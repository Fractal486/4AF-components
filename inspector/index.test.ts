import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { groups } from "./index";

const inspectorExceptions = new Set(["ascii-loader", "sidebar-layout"]);

describe("Inspector registry parity", () => {
  it("documents only valid registry exceptions", () => {
    const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
      items: { name: string; type: string }[];
    };
    const registryUiNames = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name);

    expect([...inspectorExceptions].filter((name) => !registryUiNames.includes(name))).toEqual([]);
  });

  it("has an inspector entry for every non-exempt installable UI component", () => {
    const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
      items: { name: string; type: string }[];
    };
    const inspectorSlugs = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.slug)));
    const missingEntries = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => !inspectorExceptions.has(name) && !inspectorSlugs.has(name));

    expect(missingEntries).toEqual([]);
  });
});
