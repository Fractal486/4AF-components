import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  componentCategories,
  componentCatalogMarkdown,
  componentCount,
} from "../lib/component-catalog";
import { renderComponentPageMarkdown } from "../lib/component-docs";

interface RegistryItem {
  name: string;
  type: string;
}

const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
  items: RegistryItem[];
};

describe("component documentation", () => {
  it("has one routed page for every installable component", () => {
    const missing = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => !existsSync(resolve("content/docs", `${name}.mdx`)));

    expect(missing).toEqual([]);
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
          !markdown.includes("```bash\npnpm 4af install") ||
          !markdown.includes("## Usage") ||
          !markdown.includes("```tsx")
        );
      });

    expect(incomplete).toEqual([]);
  });

  it("exposes the same renderer through the repository CLI", () => {
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/4af.ts"), "docs", "button"],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("# Button");
    expect(result.stdout).toContain("## Install");
    expect(result.stdout).toContain("## Usage");
    expect(result.stdout).not.toContain("<ComponentReference");
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
    expect(markdown).toContain("[`select-motion-search`](/docs/select-motion-search)");
  });

  it("retains the component-specific guidance from the former monolithic guide", () => {
    const requiredNotes: Record<string, string[]> = {
      alert: ["same 14px slot", "FieldError"],
      button: ["scale to `0.95`", "pressTarget=\"content\""],
      "action-button": ["SVG `Spinner`", "fillIcon"],
      "action-toggle": ["revertAfter={Infinity}", "onPressedChange"],
      "copy-button": ["Promise<string>", "<CopyButton icon="],
      badge: ["animateLayout={false}", "FLIP-animates"],
      select: [
        "SelectSortTrigger",
        'ComponentDemo name="select-sort"',
        "clearable",
        "iconForValue",
      ],
      "select-overview": ["32px", "36px"],
      "select-search": ["readonly any[]", "SearchSelectItem"],
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
});
