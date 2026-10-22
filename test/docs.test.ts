import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { parse as parseYaml } from "yaml";
import {
  COMPONENT_CATEGORIES,
  COMPONENT_FAMILIES,
  componentCategories,
  componentCatalogMarkdown,
  componentCount,
} from "../lib/component-catalog";
import { renderComponentPageMarkdown } from "../lib/component-docs";
import { publicInstallCommand, SITE_URL } from "../lib/site";
import tsconfig from "../tsconfig.json";

interface RegistryItem {
  name: string;
  type: string;
  files?: { path: string; target?: string }[];
}

const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
  items: RegistryItem[];
};
const installable = registry.items.filter((item) => item.type === "registry:ui");
const installableNames = installable.map((item) => item.name).sort();

// Inspect private catalog/demo maps without exporting test-only APIs or loading every demo.
function objectEntries(file: string, name: string) {
  const source = ts.createSourceFile(file, readFileSync(resolve(file), "utf8"), ts.ScriptTarget.Latest, true);
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((entry) => ts.isIdentifier(entry.name) && entry.name.text === name);
  if (!declaration?.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
    throw new Error(`${file}: expected an object literal for ${name}`);
  }
  return declaration.initializer.properties.map((property) => {
    if (
      !ts.isPropertyAssignment(property) ||
      !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ) {
      throw new Error(`${file}: ${name} must use explicit named entries`);
    }
    return [property.name.text, property.initializer] as const;
  });
}

describe("component documentation", () => {
  it("places every installable component in exactly one sidebar family", () => {
    const familyNames = COMPONENT_FAMILIES.flatMap((family) => [...family.slugs]);
    expect(familyNames.sort()).toEqual(installableNames);
  });

  it("lists main APIs that are exported from each component's public entry point", () => {
    const apiEntries = objectEntries("lib/component-catalog.ts", "COMPONENT_MAIN_APIS");
    expect(apiEntries.map(([name]) => name).sort()).toEqual(installableNames);
    const apiByName = new Map(apiEntries);
    const { options } = ts.convertCompilerOptionsFromJson(tsconfig.compilerOptions, process.cwd());
    const paths = [...new Set(registry.items.flatMap((item) =>
      (item.files ?? []).map((file) => resolve(file.path)),
    ))];
    // Only bind the shipped modules: this follows their re-exports without loading or
    // type-checking third-party packages. The project's typecheck covers those separately.
    const program = ts.createProgram(paths, { ...options, noResolve: true, noLib: true, types: [] });
    const checker = program.getTypeChecker();

    for (const item of installable) {
      const summary = apiByName.get(item.name)!;
      expect(ts.isStringLiteral(summary), item.name).toBe(true);
      if (!ts.isStringLiteral(summary)) continue;
      // Summaries also contain prose such as "and composition parts". Components and
      // hooks are the PascalCase and useCamelCase identifiers in those summaries.
      const identifiers = summary.text.match(/\b(?:[A-Z][A-Za-z0-9]*|use[A-Z][A-Za-z0-9]*)\b/g) ?? [];
      expect(identifiers.length, item.name).toBeGreaterThan(0);
      const entry = item.files?.find((file) => file.target === `@ui/${item.name}.tsx`);
      expect(entry, `${item.name}: public entry point`).toBeDefined();
      const source = program.getSourceFile(resolve(entry!.path))!;
      const moduleSymbol = checker.getSymbolAtLocation(source)!;
      const exports = new Map(checker.getExportsOfModule(moduleSymbol).map((symbol) => [symbol.name, symbol]));
      const shippedFiles = new Set(item.files?.map((file) => resolve(file.path)));

      for (const identifier of identifiers) {
        const symbol = exports.get(identifier);
        expect(symbol, `${item.name}: missing export ${identifier}`).toBeDefined();
        const target = symbol!.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol!) : symbol!;
        expect(Boolean(target.flags & ts.SymbolFlags.Value), `${item.name}: ${identifier} must be a value`).toBe(true);
        expect(
          target.getDeclarations()?.some((declaration) => shippedFiles.has(declaration.getSourceFile().fileName)),
          `${item.name}: ${identifier} must resolve to a shipped declaration`,
        ).toBe(true);
      }
    }
  });

  it("provides a demo mapping for every installable component", () => {
    const demoNames = objectEntries("stories/component-demo.tsx", "demos").map(([name]) => name);
    // Select Sort is a bundled Select composition with an additional demo. Sidebar Layout
    // has its own key, even though its loader intentionally reuses the Sidebar entry.
    expect(demoNames.sort()).toEqual([...installableNames, "select-sort"].sort());
  });

  it("keeps the agent catalog's category tables aligned with the component categories", () => {
    const reference = readFileSync(
      resolve(".agents/skills/4af-components/references/component-catalog.md"), "utf8",
    );
    const section = reference.split(/^## /m).find((part) => part.startsWith("Installable catalog\n"));
    expect(section, "Installable catalog section").toBeDefined();
    const categories = section!.split(/^### /m).slice(1).map((part) => {
      const [name, ...lines] = part.split(/\r?\n/);
      const slugs = lines.flatMap((line) => {
        const row = line.match(/^\|\s*\[`([^`]+)`\]\(([^)]+)\)\s*\|/);
        if (!row) return [];
        expect(row[2], `${name}: ${row[1]}`).toBe(`${SITE_URL}/docs/${row[1]}.md`);
        return [row[1]!];
      });
      return { name: name!.trim(), slugs };
    });
    expect(categories.map((category) => category.name).sort()).toEqual(
      COMPONENT_CATEGORIES.map((category) => category.name).sort(),
    );
    for (const category of COMPONENT_CATEGORIES) {
      expect(categories.find((entry) => entry.name === category.name)?.slugs.sort(), category.name)
        .toEqual([...category.slugs].sort());
    }
  });

  it("has one routed page for every installable component", () => {
    const missing = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => !existsSync(resolve("content/docs", `${name}.mdx`)));

    expect(missing).toEqual([]);
  });

  it("parses the front matter of every page", () => {
    // An unquoted `: ` in a value is a nested mapping in YAML, which fails the build.
    const failures = readdirSync(resolve("content/docs"), { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".mdx"))
      .flatMap((file) => {
        const match = readFileSync(resolve("content/docs", file), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match) return [];
        try {
          parseYaml(match[1]!);
          return [];
        } catch {
          return [file];
        }
      });

    expect(failures).toEqual([]);
  });

  it("lists every installable component in the docs sidebar", () => {
    // The page tree is built from the families in `component-catalog`, but only out of the
    // pages Fumadocs was given — and it is given the ones `meta.json` names. A component
    // with a page, a family and a registry entry still has no sidebar entry without this.
    const meta = JSON.parse(readFileSync(resolve("content/docs/meta.json"), "utf8")) as {
      pages: string[];
    };
    const missing = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => !meta.pages.includes(name));

    expect(missing).toEqual([]);
  });

  it("renders every component page as standalone agent-friendly Markdown", () => {
    const incomplete = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => {
        const page = readFileSync(resolve("content/docs", `${name}.mdx`), "utf8");
        const markdown = renderComponentPageMarkdown(page, name);
        return (
          markdown.includes("<ComponentDemo") ||
          markdown.includes("<ComponentReference") ||
          !markdown.includes("## Install") ||
          !markdown.includes(`\`\`\`bash\n${publicInstallCommand(name)}\n\`\`\``) ||
          !markdown.includes("## Usage") ||
          !markdown.includes("```tsx")
        );
      });

    expect(incomplete).toEqual([]);
  });

  it("keeps the complete API summary on every component page", () => {
    const incomplete = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => {
        const page = readFileSync(resolve("content/docs", `${name}.mdx`), "utf8");
        return (
          !page.includes(`<ComponentDemo name="${name}" />`) ||
          !page.includes(`<ComponentReference name="${name}" />`) ||
          !page.includes("## API") ||
          !page.includes("**Main export")
        );
      });

    expect(incomplete).toEqual([]);
  });

  it("does not maintain a hard-coded component count on the overview", () => {
    const overview = readFileSync(resolve("content/docs/index.mdx"), "utf8");

    expect(overview).toContain("<ComponentCount />");
    expect(overview).not.toMatch(/contains \*\*\d+ installable components/);
  });

  it("renders registry-driven content as native Markdown", () => {
    const markdown = componentCatalogMarkdown();
    const catalogNames = componentCategories.flatMap((category) =>
      category.components.map((component) => component.name),
    );
    const registryNames = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name);

    expect(markdown.match(/^\| \[`/gm)).toHaveLength(componentCount);
    expect(new Set(catalogNames)).toEqual(new Set(registryNames));
    expect(markdown).toContain("## Actions");
    expect(markdown).toContain("## Overlays and menus");
    expect(markdown).toContain("| Install name | Main API | What it provides |");
    expect(markdown).toContain("[`button`](/docs/button)");
    expect(markdown).toContain("[`select-search`](/docs/select-search)");
  });

  it("retains the component-specific guidance from the former monolithic guide", () => {
    const requiredNotes: Record<string, string[]> = {
      alert: ["same 14px slot", "aria-describedby"],
      button: ["scale to `0.95`", "pressTarget=\"content\""],
      "action-button": ["labels.pending", "pendingMode"],
      "action-toggle": ["new state should persist", "onPressedChange", "fillIcon"],
      "copy-button": ["Promise<string>", "<CopyButton icon="],
      badge: ["animateLayout={false}", "FLIP-animates"],
      select: [
        "SelectSortTrigger",
        "SelectSeparator",
        'ComponentDemo name="select-sort"',
        "clearable",
        "ghost reset button",
        'variant="ghost"',
        "Fruit: Banana",
        "iconForValue",
      ],
      "select-aligned": [
        'variant="default" | "ghost" | "plain"',
        "default and ghost panels match the trigger width",
        "Fruit: Banana",
      ],
      "select-search": ["Resolution order", "iconForValue", "SearchSelectItem"],
      "command-palette": [
        "helpers.openPanel",
        "additionalRefreshing",
        "confirm.resetAfter",
        "350ms",
      ],
      "dropdown-menu": [
        "N selected",
        "closeOnClick={false}",
        "status as a second argument",
        "accessible name",
      ],
      "selection-toolbar": [
        "onAction(pressed, text, range)",
        "variant=\"destructive\"",
        "useSelectionToolbar()",
      ],
      sidebar: ["SidebarHeaderRow", "flex-none"],
      "sidebar-layout": ["h-full", "vertical scrolling"],
    };

    for (const [name, phrases] of Object.entries(requiredNotes)) {
      const page = readFileSync(resolve("content/docs", `${name}.mdx`), "utf8");
      for (const phrase of phrases) expect(page, `${name}: ${phrase}`).toContain(phrase);
    }
  });

  it("keeps the agent catalog's explicit count and component links consistent with the registry", () => {
    const reference = readFileSync(
      resolve(".agents/skills/4af-components/references/component-catalog.md"),
      "utf8",
    );

    const installable = registry.items.filter((item) => item.type === "registry:ui");
    const statedCount = reference.match(/contains (\d+) installable UI items/);
    expect(Number(statedCount?.[1])).toBe(installable.length);
    for (const { name } of installable) {
      expect(reference).toContain(`(${SITE_URL}/docs/${name}.md)`);
    }
  });
});
