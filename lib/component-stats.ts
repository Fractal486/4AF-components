import { readFileSync } from "node:fs";
import { join } from "node:path";
import registry from "../registry.json";
import { registryComponents } from "./component-catalog.ts";

export interface ComponentDependency {
  name: string;
  title: string;
  href: string;
}

export interface ComponentStats {
  /** Non-blank lines across the files this item installs, dependencies excluded. */
  lines: number;
  files: number;
  /** Other installable components this one installs, in registry order. */
  dependencies: ComponentDependency[];
}

const componentsByName = new Map(registryComponents.map((component) => [component.name, component]));

function countLines(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== "").length;
}

/** Read at build time from `registry.json` and the source it lists. */
export function componentStats(name: string): ComponentStats | undefined {
  const item = registry.items.find((entry) => entry.name === name && entry.type === "registry:ui");
  if (!item) return undefined;

  const dependencies = (item.registryDependencies ?? []).flatMap((url) => {
    const dependency = componentsByName.get(url.slice(url.lastIndexOf("/") + 1).replace(/\.json$/u, ""));
    return dependency
      ? [{ name: dependency.name, title: dependency.title, href: `/docs/${dependency.name}` }]
      : [];
  });

  const files = item.files ?? [];
  return {
    lines: files.reduce((total, file) => total + countLines(file.path), 0),
    files: files.length,
    dependencies,
  };
}
