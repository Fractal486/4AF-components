import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { groups } from "./index";

describe("Inspector registry parity", () => {
  it("has an inspector entry for every installable UI component", () => {
    const registry = JSON.parse(readFileSync(resolve("registry.json"), "utf8")) as {
      items: { name: string; type: string }[];
    };
    const inspectorSlugs = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.slug)));
    const missingEntries = registry.items
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
      .filter((name) => !inspectorSlugs.has(name));

    expect(missingEntries).toEqual([]);
  });
});
