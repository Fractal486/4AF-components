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
});
