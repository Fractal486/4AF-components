import registry from "../registry.json";

export const COMPONENT_FAMILIES = [
  { name: "Alert", slugs: ["alert"] },
  { name: "Badge", slugs: ["badge"] },
  { name: "Breadcrumb", slugs: ["breadcrumb"] },
  {
    name: "Button",

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
  { name: "Date Picker", slugs: ["date-picker"] },
  { name: "Dialog", slugs: ["dialog", "alert-dialog"] },
  { name: "Dropdown Menu", slugs: ["dropdown-menu"] },
  { name: "Empty", slugs: ["empty"] },
  { name: "Hover Card", slugs: ["hover-card"] },
  { name: "Input", slugs: ["input", "textarea"] },
  { name: "Loader", slugs: ["ascii-loader", "matrix-loader", "classic-loader"] },
  { name: "Popover", slugs: ["popover"] },
  { name: "Progress", slugs: ["progress"] },
  { name: "Radio", slugs: ["radio"] },
  {
    name: "Select",

    slugs: ["select", "select-search", "select-aligned"],
  },
  { name: "Selection Toolbar", slugs: ["selection-toolbar"] },
  { name: "Separator", slugs: ["separator"] },
  { name: "Sheet", slugs: ["sheet"] },
  { name: "Sidebar", slugs: ["sidebar", "sidebar-layout"] },
  { name: "Skeleton", slugs: ["skeleton"] },
  { name: "Slider", slugs: ["slider"] },
  { name: "Switch", slugs: ["switch"] },
  { name: "Table", slugs: ["table", "data-table"] },
  {
    name: "Table of Contents",

    slugs: ["table-of-contents", "table-of-contents-lines"],
  },
  { name: "Tabs", slugs: ["tabs"] },
  { name: "Text Effects", slugs: ["text-shimmer", "scramble-text"] },
  { name: "Tooltip", slugs: ["tooltip"] },
] as const;

export const COMPONENT_CATEGORIES = [
  {
    name: "Actions",
    slugs: [
      "button",
      "button-group",
      "toggle",
      "morph",
      "action-button",
      "action-toggle",
      "copy-button",
      "delete-button",
    ],
  },
  {
    name: "Fields and selection",
    slugs: [
      "input",
      "textarea",
      "switch",
      "checkbox",
      "radio",
      "slider",
      "select",
      "select-search",
      "select-aligned",
      "date-picker",
    ],
  },
  {
    name: "Feedback and status",
    slugs: [
      "progress",
      "alert",
      "badge",
      "skeleton",
      "empty",
      "text-shimmer",
      "scramble-text",
      "ascii-loader",
      "matrix-loader",
      "classic-loader",
    ],
  },
  {
    name: "Navigation and application structure",
    slugs: [
      "breadcrumb",
      "tabs",
      "collapsible",
      "table",
      "data-table",
      "table-of-contents",
      "table-of-contents-lines",
      "separator",
      "command-palette",
      "sidebar",
      "sidebar-layout",
    ],
  },
  {
    name: "Overlays and menus",
    slugs: [
      "tooltip",
      "sheet",
      "dialog",
      "alert-dialog",
      "popover",
      "selection-toolbar",
      "hover-card",
      "dropdown-menu",
    ],
  },
] as const;

const COMPONENT_MAIN_APIS: Record<string, string> = {
  "action-button": "ActionButton",
  "action-toggle": "ActionToggle",
  alert: "Alert",
  "alert-dialog": "AlertDialog and composition parts",
  "ascii-loader": "AsciiLoader",
  "matrix-loader": "MatrixLoader",
  "classic-loader": "ClassicLoader",
  badge: "Badge, BadgeIconsProvider",
  breadcrumb: "Breadcrumb, BreadcrumbList (sm/md), item/link/page/separator parts, BreadcrumbEllipsis, BreadcrumbCollapse",
  button: "Button",
  "button-group": "ButtonGroup",
  checkbox: "Checkbox",
  collapsible: "Collapsible, CollapsibleTrigger, CollapsibleContent",
  "command-palette": "CommandPalette, panel/list/row/tab/footer parts, Kbd, useCommandSearch, useCommandPanelHighlight",
  "copy-button": "CopyButton",
  "date-picker": "DatePicker, DateRangePicker (default/ghost/plain, xs/sm/md), Calendar",
  "delete-button": "DeleteButton",
  dialog: "Dialog and composition parts, DialogSteps, DialogStep",
  "dropdown-menu": "Root, trigger, content, item, checkbox/radio/submenu, shortcut, nested-select parts",
  empty: "Empty and composition parts",
  "hover-card": "HoverCard, HoverCardTrigger, HoverCardContent, HoverCardSkeleton",
  input: "Input",
  morph: "Morph",
  popover: "Popover and composition parts",
  progress: "Progress, ProgressLabel, ProgressValue",
  radio: "RadioGroup, Radio",
  select: "Select (24px xs, 30px sm, 34px md trigger and row sizes), SelectTrigger (default/ghost/plain, optional label), SelectSortTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator, SelectSub, SelectSubTrigger, SelectSubContent",
  "select-aligned": "AlignedSelect (optional 24px xs trigger and popup rows), AlignedSelectTrigger (default/ghost/plain, optional label), AlignedSelectContent, AlignedSelectItem",
  "select-search": "SearchSelect and input/content/item parts",
  "selection-toolbar": "SelectionToolbar, item parts, useSelectionToolbar",
  separator: "Separator",
  sheet: "Sheet and composition parts",
  sidebar: "SidebarProvider, Sidebar, SidebarPanel, SidebarHeaderButton, menu/group/submenu parts",
  "sidebar-layout": "SidebarLayout",
  skeleton: "Skeleton",
  slider: "Slider",
  switch: "Switch",
  table: "Table, TableCaption, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell",
  "data-table": "DataTable, DataTableRow, DataTableHead, DataTableRowActions, and the re-exported table layout parts",
  "table-of-contents": "TableOfContents",
  "table-of-contents-lines": "TableOfContentsLines",
  tabs: "Tabs (segment/pill/underline; appearance default/solid/outline), TabsList, TabsTab, TabsCount, TabsPanel",
  "text-shimmer": "TextShimmer",
  "scramble-text": "ScrambleText",
  textarea: "Textarea",
  toggle: "Toggle",
  tooltip: "TooltipProvider, Tooltip",
};

export interface RegistryComponent {
  name: string;
  title: string;
  mainApi: string;
  description: string;
}

function componentTitle(name: string) {
  if (name === "ascii-loader") return "ASCII Loader";

  return name
    .split("-")
    .map((part, index) =>
      index > 0 && part === "of" ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export const registryComponents: RegistryComponent[] = registry.items
  .filter((item) => item.type === "registry:ui")
  .map((item) => ({
    name: item.name,
    title: componentTitle(item.name),
    mainApi: COMPONENT_MAIN_APIS[item.name] ?? componentTitle(item.name),
    description: item.description ?? "",
  }));

export const componentCount = registryComponents.length;

const registryComponentsByName = new Map(
  registryComponents.map((component) => [component.name, component]),
);

export const componentCategories = COMPONENT_CATEGORIES.map((category) => ({
  name: category.name,
  components: category.slugs.flatMap((slug) => {
    const component = registryComponentsByName.get(slug);
    return component ? [component] : [];
  }),
}));

export function componentCatalogMarkdown() {
  const escapeCell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");

  return componentCategories
    .map(
      (category) =>
        `## ${category.name}\n\n| Install name | Main API | What it provides |\n| --- | --- | --- |\n${category.components
          .map(
            (component) =>
              `| [\`${component.name}\`](/docs/${component.name}) | \`${escapeCell(component.mainApi)}\` | ${escapeCell(component.description)} |`,
          )
          .join("\n")}`,
    )
    .join("\n\n");
}
