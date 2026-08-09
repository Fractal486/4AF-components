import { loader } from "fumadocs-core/source";
import type { Item, Node } from "fumadocs-core/page-tree";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: "content/docs",
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

          return {
            ...tree,
            children: [
              ...(overviewPage ? [overviewPage] : []),
              {
                type: "folder" as const,
                name: "Components",
                defaultOpen: false,
                collapsible: true,
                children: componentPages,
              },
              ...tree.children.filter(
                (node) => node !== overviewPage && !isComponentPage(node),
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
