import { readFile } from "node:fs/promises";
import { join } from "node:path";
import registry from "../../registry.json";

export interface InstalledFile {
  /** Where the file lands in a project using the default shadcn aliases. */
  path: string;
  /** Registry item the file belongs to. */
  item: string;
  code: string;
  lang: "ts" | "tsx";
}

type RegistryItem = (typeof registry.items)[number] & {
  registryDependencies?: string[];
  files?: { path: string; target?: string }[];
};

const items = new Map(registry.items.map((item) => [item.name, item as RegistryItem]));

/** `http://…/r/slot.json` → `slot`. */
function dependencyName(url: string) {
  return url.slice(url.lastIndexOf("/") + 1).replace(/\.json$/, "");
}

/** `@ui/button.tsx` → `components/ui/button.tsx`; `@lib/cn.ts` → `lib/cn.ts`. */
function projectPath(target: string) {
  return target.replace(/^@ui\//, "components/ui/").replace(/^@lib\//, "lib/");
}

/** The import specifiers shadcn rewrites on install, so the shown source matches the copy. */
function projectImports(code: string) {
  return code
    .replaceAll("@/registry/lib/", "@/lib/")
    .replace(/@\/registry\/ui\/[^/"]+\//g, "@/components/ui/");
}

/**
 * Every source file `shadcn add` writes for `<name>`, in install order: the item's own
 * files, then its registry dependencies breadth-first. The theme item carries CSS
 * variables rather than files, so it contributes nothing here.
 */
export async function installedFiles(name: string): Promise<InstalledFile[]> {
  const order: RegistryItem[] = [];
  const seen = new Set<string>();
  const queue = [name];
  while (queue.length > 0) {
    const item = items.get(queue.shift()!);
    if (!item || seen.has(item.name)) continue;
    seen.add(item.name);
    order.push(item);
    queue.push(...(item.registryDependencies ?? []).map(dependencyName));
  }

  return Promise.all(
    order.flatMap((item) =>
      (item.files ?? []).map(async (file) => ({
        path: projectPath(file.target ?? file.path),
        item: item.name,
        code: projectImports(await readFile(join(process.cwd(), file.path), "utf8")),
        lang: file.path.endsWith(".tsx") ? ("tsx" as const) : ("ts" as const),
      })),
    ),
  );
}
