import { loader } from "fumadocs-core/source";
import type { Folder, Item, Node } from "fumadocs-core/page-tree";
import { defineDocs } from "fumadocs-mdx/macro";
import { COMPONENT_FAMILIES } from "@/lib/component-catalog";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  pageTree: {
    transformers: [
      {
        root(tree) {
          const componentPages = tree.children.filter(isComponentPage);
          if (componentPages.length === 0) return tree;
          const overviewPage = tree.children.find(
            (node): node is Item =>
              node.type === "page" && (node.url === "/docs" || node.url === "/docs/"),
          );
          const referenceFolder = tree.children.find(
            (node): node is Folder => node.type === "folder" && node.name === "Reference",
          );
          const componentPagesBySlug = new Map(
            componentPages.map((page) => [page.url.split("/").pop(), page]),
          );
          const groupIndexSlugs = new Set<string>(
            COMPONENT_FAMILIES.flatMap((group) =>
              "index" in group && group.index ? [group.index] : [],
            ),
          );
          const groupedSlugs = new Set<string>();
          const componentFolders: Node[] = [];
          for (const group of COMPONENT_FAMILIES) {
            const { name, slugs } = group;
            const indexSlug = "index" in group ? group.index : undefined;
            const children = slugs.flatMap((slug) => {
              const page = componentPagesBySlug.get(slug);
              if (!page) return [];
              groupedSlugs.add(slug);
              return [page];
            });
            if (children.length === 0) continue;
            if (children.length === 1) {
              const [child] = children;
              if (child) componentFolders.push(child);
              continue;
            }
            const index = indexSlug ? componentPagesBySlug.get(indexSlug) : undefined;
            componentFolders.push({
              type: "folder",
              name,
              defaultOpen: false,
              collapsible: true,
              ...(index ? { index } : {}),
              children,
            });
          }
          const ungroupedComponentPages = componentPages.filter(
            (page) => {
              const slug = page.url.split("/").pop() ?? "";
              return !groupedSlugs.has(slug) && !groupIndexSlugs.has(slug);
            },
          );

          return {
            ...tree,
            children: [
              {
                type: "separator" as const,
                name: "Reference",
              },
              ...(overviewPage ? [overviewPage] : []),
              ...(referenceFolder?.index ? [referenceFolder.index] : []),
              ...(referenceFolder?.children ?? []),
              {
                type: "separator" as const,
                name: "Components",
              },
              ...componentFolders,
              ...ungroupedComponentPages,
              ...tree.children.filter(
                (node) =>
                  node !== overviewPage && node !== referenceFolder && !isComponentPage(node),
              ),
            ],
          };
        },
      },
    ],
  },
});

function isComponentPage(node: Node): node is Item {
  return node.type === "page" && node.url !== "/docs" && node.url !== "/docs/";
}
