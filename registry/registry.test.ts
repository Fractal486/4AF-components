import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: { path: string; target?: string }[];
}

const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
  items: RegistryItem[];
};
const items = new Map(registry.items.map((item) => [item.name, item]));

describe("private registry", () => {
  it("references existing source files", () => {
    for (const item of registry.items) {
      for (const file of item.files ?? []) expect(existsSync(resolve(file.path))).toBe(true);
    }
  });

  it("uses explicit private-registry URLs instead of built-in shadcn names", () => {
    for (const item of registry.items) {
      for (const dependency of item.registryDependencies ?? []) {
        expect(dependency).toMatch(/^http:\/\/localhost:3000\/r\/[a-z0-9-]+\.json$/);
        const name = dependency.split("/").at(-1)?.replace(/\.json$/, "");
        expect(name && items.has(name)).toBe(true);
      }
    }
  });

  it("declares the complete source and package dependency closure", () => {
    const dependencyName = (url: string) => url.split("/").at(-1)?.replace(/\.json$/, "");
    const closureFor = (root: RegistryItem) => {
      const closure = new Set<string>();
      const visit = (item: RegistryItem) => {
        if (closure.has(item.name)) return;
        closure.add(item.name);
        for (const url of item.registryDependencies ?? []) {
          const name = dependencyName(url);
          const dependency = name ? items.get(name) : undefined;
          if (dependency) visit(dependency);
        }
      };
      visit(root);
      return closure;
    };
    const packageName = (specifier: string) =>
      specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]!;
    const resolveSource = (specifier: string, importer: string) => {
      const raw =
        specifier === "@/registry/ui/ui/input.variants"
          ? "registry/ui/input/input.variants"
          : specifier === "@/registry/ui/ui/button.variants"
            ? "registry/ui/button/button.variants"
          : specifier.startsWith("@/")
            ? specifier.slice(2)
            : specifier.startsWith(".")
              ? relative(process.cwd(), resolve(dirname(importer), specifier)).replaceAll("\\", "/")
              : null;
      if (!raw) return null;
      return [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`, `${raw}/index.tsx`].find((path) =>
        existsSync(resolve(path)),
      );
    };

    const missing: string[] = [];
    for (const item of registry.items) {
      const closure = closureFor(item);
      const availableFiles = new Set(
        [...closure].flatMap((name) => items.get(name)?.files?.map((file) => file.path) ?? []),
      );
      const availablePackages = new Set(
        [...closure].flatMap((name) => items.get(name)?.dependencies ?? []),
      );

      for (const file of item.files ?? []) {
        const source = ts.createSourceFile(
          file.path,
          readFileSync(resolve(file.path), "utf8"),
          ts.ScriptTarget.Latest,
          true,
        );
        for (const statement of source.statements) {
          if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
            continue;
          }
          const specifier = statement.moduleSpecifier.text;
          const sourcePath = resolveSource(specifier, file.path);
          if (sourcePath) {
            if (!availableFiles.has(sourcePath)) {
              missing.push(`${item.name}: ${file.path} imports undeclared ${sourcePath}`);
            }
            continue;
          }
          if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
            const dependency = packageName(specifier);
            if (
              dependency !== "react" &&
              dependency !== "react-dom" &&
              !availablePackages.has(dependency)
            ) {
              missing.push(`${item.name}: ${file.path} imports undeclared package ${dependency}`);
            }
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("does not install Motion for the CSS-only table of contents", () => {
    expect(items.get("table-of-contents")?.dependencies ?? []).not.toContain("motion");
    expect(items.get("table-of-contents")?.registryDependencies ?? []).not.toContain(
      "http://localhost:3000/r/motion.json",
    );
  });

  it("ships the design foundation and direct Button dependencies", () => {
    expect(items.get("button")?.registryDependencies).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/r/4af-theme.json",
        "http://localhost:3000/r/cn.json",
        "http://localhost:3000/r/motion.json",
      ]),
    );
  });

  it("ships every direct Dropdown Menu component dependency", () => {
    expect(items.get("dropdown-menu")?.registryDependencies).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/r/checkbox.json",
        "http://localhost:3000/r/input.json",
      ]),
    );
  });

  it("ships every direct Command Palette component dependency", () => {
    expect(items.get("command-palette")?.registryDependencies).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/r/morph.json",
        "http://localhost:3000/r/use-action.json",
      ]),
    );
  });

  it("installs the Textarea's shared Input variants at the flat UI alias", () => {
    expect(items.get("textarea")?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "registry/ui/input/input.variants.ts",
          target: "@ui/input.variants.ts",
        }),
      ]),
    );
    expect(readFileSync(resolve("registry/ui/textarea/textarea.tsx"), "utf8")).toContain(
      'from "@/registry/ui/ui/input.variants"',
    );
  });

  it("installs shared Button variants at the flat UI alias", () => {
    expect(items.get("button")?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "registry/ui/button/button.variants.ts",
          target: "@ui/button.variants.ts",
        }),
      ]),
    );
    expect(readFileSync(resolve("registry/ui/delete-button/delete-button.tsx"), "utf8")).toContain(
      'from "@/registry/ui/ui/button.variants"',
    );
    expect(readFileSync(resolve("registry/ui/toggle/toggle.tsx"), "utf8")).toContain(
      'from "@/registry/ui/ui/button.variants"',
    );
  });

  it("ships the custom tokens consumed by installable components", () => {
    const theme = items.get("4af-theme") as {
      cssVars?: {
        theme?: Record<string, string>;
        light?: Record<string, string>;
        dark?: Record<string, string>;
      };
      css?: Record<string, unknown>;
    };

    expect(theme.cssVars?.theme).toEqual(
      expect.objectContaining({
        "color-success": "var(--success)",
        "radius-xs": "3px",
        "radius-sm": "5px",
        "text-2xs": "0.6875rem",
        "shadow-overlay-drop": "var(--elevation-overlay-drop)",
        "animate-matrix-pulse": "matrix-pulse var(--matrix-cycle, 1.2s) var(--ease-in-out) infinite",
      }),
    );
    expect(theme.cssVars?.light).toEqual(
      expect.objectContaining({
        destructive: "oklch(0.6 0.225 26)",
        success: "oklch(0.52 0.13 152)",
        "elevation-overlay-drop": "0 8px 16px -6px oklch(0 0 0 / 0.1), 0 16px 32px -8px oklch(0 0 0 / 0.12)",
      }),
    );
    expect(theme.cssVars?.dark).toEqual(
      expect.objectContaining({
        background: "oklch(0.1448 0 0)",
        "elevation-overlay-drop": "0 16px 32px -12px oklch(0 0 0 / 0.7)",
      }),
    );
    expect(theme.css).toHaveProperty("@keyframes text-shimmer");
    expect(theme.css).toHaveProperty("@keyframes matrix-pulse");
  });
});
