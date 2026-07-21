import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

interface RegistryItem {
  name: string;
  registryDependencies?: string[];
  files?: { path: string }[];
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
        "animate-text-shimmer": "text-shimmer var(--text-shimmer-duration, 2.5s) linear infinite",
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
  });
});
