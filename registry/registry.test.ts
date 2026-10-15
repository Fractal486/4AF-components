import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";
import { SITE_URL } from "../lib/site";

interface RegistryItem {
  name: string;
  type: string;
  docs?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: { path: string; target?: string }[];
}

const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
  items: RegistryItem[];
};
const items = new Map(registry.items.map((item) => [item.name, item]));

function resolveSource(specifier: string, importer: string) {
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
}

const isClientModule = (source: ts.SourceFile) => {
  const first = source.statements[0];
  return (
    first != null &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use client"
  );
};

// React hooks that the server build doesn't provide. A module calling one already runs only
// on the client, under an importer's "use client", whether or not it says so itself.
const CLIENT_ONLY_REACT = new Set([
  "useActionState",
  "useContext",
  "useDeferredValue",
  "useEffect",
  "useEffectEvent",
  "useEvent",
  "useImperativeHandle",
  "useInsertionEffect",
  "useLayoutEffect",
  "useOptimistic",
  "useReducer",
  "useRef",
  "useState",
  "useSyncExternalStore",
  "useTransition",
]);

const usesClientOnlyReact = (source: ts.SourceFile) =>
  source.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "react" &&
      statement.importClause?.namedBindings != null &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some((element) =>
        CLIENT_ONLY_REACT.has((element.propertyName ?? element.name).text),
      ),
  );

describe("registry", () => {
  it("links every component to its docs page, which shadcn prints after installing it", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:ui")) {
      expect(item.docs, item.name).toBe(
        `Docs: ${SITE_URL}/docs/${item.name} (Markdown: ${SITE_URL}/docs/${item.name}.md)`,
      );
    }
  });

  it("references existing source files", () => {
    for (const item of registry.items) {
      for (const file of item.files ?? []) expect(existsSync(resolve(file.path))).toBe(true);
    }
  });

  it("names dependencies by their public registry URL instead of built-in shadcn names", () => {
    for (const item of registry.items) {
      for (const dependency of item.registryDependencies ?? []) {
        expect(dependency.startsWith(`${SITE_URL}/r/`)).toBe(true);
        expect(dependency).toMatch(/\/r\/[a-z0-9-]+\.json$/);
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
    const missing: string[] = [];
    for (const item of registry.items) {
      const closure = closureFor(item);
      const availableFiles = new Set(
        [...closure].flatMap((name) => items.get(name)?.files?.map((file) => file.path) ?? []),
      );
      const availablePackages = new Set(
        [...closure].flatMap((name) => items.get(name)?.dependencies ?? []).map((dependency) => {
          const version = dependency.lastIndexOf("@");
          return version > 0 ? dependency.slice(0, version) : dependency;
        }),
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

  // A Server Component sees a "use client" module's exports as client references: it can
  // render a component from there, but calling a hook or function from there throws. So a
  // module that could render on the server may only take components (PascalCase) from one.
  it("keeps server-compatible modules from calling client-only exports", () => {
    const paths = new Set(registry.items.flatMap((item) => item.files?.map((file) => file.path) ?? []));
    const parse = (path: string) =>
      ts.createSourceFile(path, readFileSync(resolve(path), "utf8"), ts.ScriptTarget.Latest, true);

    const violations: string[] = [];
    for (const path of paths) {
      if (!/\.tsx?$/.test(path) || /\.test\.tsx?$/.test(path)) continue;
      const source = parse(path);
      if (isClientModule(source) || usesClientOnlyReact(source)) continue;

      for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
          continue;
        }
        const clause = statement.importClause;
        if (!clause || clause.isTypeOnly) continue;
        const target = resolveSource(statement.moduleSpecifier.text, path);
        if (!target || !isClientModule(parse(target))) continue;

        const bindings = clause.namedBindings;
        const names = [
          ...(clause.name ? [clause.name.text] : []),
          ...(bindings && ts.isNamedImports(bindings)
            ? bindings.elements.filter((element) => !element.isTypeOnly).map((element) => element.name.text)
            : []),
          ...(bindings && ts.isNamespaceImport(bindings) ? [`* as ${bindings.name.text}`] : []),
        ];
        for (const name of names) {
          if (!/^[A-Z]/.test(name)) violations.push(`${path} imports ${name} from client-only ${target}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not install Motion for the CSS-only table of contents", () => {
    expect(items.get("table-of-contents")?.dependencies ?? []).not.toContain("motion");
    expect(items.get("table-of-contents")?.registryDependencies ?? []).not.toContain(
      `${SITE_URL}/r/motion.json`,
    );
  });

  it("ships the design foundation and direct Button dependencies", () => {
    expect(items.get("button")?.registryDependencies).toEqual(
      expect.arrayContaining([
        `${SITE_URL}/r/4af-theme.json`,
        `${SITE_URL}/r/cn.json`,
        `${SITE_URL}/r/motion.json`,
      ]),
    );
  });

  it("ships every direct Dropdown Menu component dependency", () => {
    expect(items.get("dropdown-menu")?.registryDependencies).toEqual(
      expect.arrayContaining([
        `${SITE_URL}/r/checkbox.json`,
        `${SITE_URL}/r/input.json`,
      ]),
    );
  });

  it("ships every direct Command Palette component dependency", () => {
    expect(items.get("command-palette")?.registryDependencies).toEqual(
      expect.arrayContaining([
        `${SITE_URL}/r/morph.json`,
        `${SITE_URL}/r/use-action.json`,
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
        background: "oklch(0.120 0 0)",
        "elevation-overlay-drop": "0 16px 32px -12px oklch(0 0 0 / 0.7)",
      }),
    );
    expect(theme.css).toHaveProperty("@keyframes text-shimmer");
    expect(theme.css).toHaveProperty("@keyframes matrix-pulse");
  });
});
