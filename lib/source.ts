import { loader } from "fumadocs-core/source";
import type { Folder, Item, Node } from "fumadocs-core/page-tree";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

const COMPONENT_GROUPS = [
  { name: "Alert", slugs: ["alert"] },
  { name: "Badge", slugs: ["badge"] },
  {
    name: "Button",
    index: "button-overview",
    slugs: [
      "button",
      "button-group",
      "toggle",
      "morph",
      "copy-button",
      "action-button",
      "action-toggle",
      "delete-button",
    ],
  },
  { name: "Checkbox", slugs: ["checkbox"] },
  { name: "Collapsible", slugs: ["collapsible"] },
  { name: "Command Palette", slugs: ["command-palette"] },
  { name: "Dialog", index: "dialog-overview", slugs: ["dialog", "alert-dialog"] },
  { name: "Dropdown Menu", slugs: ["dropdown-menu"] },
  { name: "Empty", slugs: ["empty"] },
  { name: "Hover Card", slugs: ["hover-card"] },
  { name: "Input", index: "input-overview", slugs: ["input", "textarea"] },
  { name: "Popover", slugs: ["popover"] },
  { name: "Progress", slugs: ["progress"] },
  { name: "Radio", slugs: ["radio"] },
  {
    name: "Select",
    index: "select-overview",
    slugs: ["select", "select-search", "select-motion", "select-motion-search"],
  },
  { name: "Selection Toolbar", slugs: ["selection-toolbar"] },
  { name: "Separator", slugs: ["separator"] },
  { name: "Sheet", slugs: ["sheet"] },
  { name: "Sidebar", index: "sidebar-overview", slugs: ["sidebar", "sidebar-layout"] },
  { name: "Skeleton", slugs: ["skeleton"] },
  { name: "Slider", slugs: ["slider"] },
  { name: "Switch", slugs: ["switch"] },
  {
    name: "Table of Contents",
    index: "table-of-contents-overview",
    slugs: ["table-of-contents", "table-of-contents-lines"],
  },
  { name: "Tabs", slugs: ["tabs"] },
  { name: "Text Shimmer", slugs: ["text-shimmer"] },
  { name: "Toast", slugs: ["toast"] },
  { name: "Tooltip", slugs: ["tooltip"] },
] as const;

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
            COMPONENT_GROUPS.flatMap((group) =>
              "index" in group && group.index ? [group.index] : [],
            ),
          );
          const groupedSlugs = new Set<string>();
          const componentFolders: Node[] = [];
          for (const group of COMPONENT_GROUPS) {
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
