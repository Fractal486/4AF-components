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
  { name: "Context Menu", slugs: ["context-menu"] },
  { name: "Date Picker", slugs: ["date-picker"] },
  { name: "Dialog", slugs: ["dialog", "alert-dialog"] },
  { name: "Dropdown Menu", slugs: ["dropdown-menu"] },
  { name: "Empty", slugs: ["empty"] },
  { name: "Hover Card", slugs: ["hover-card"] },
  { name: "Input", slugs: ["input", "textarea"] },
  { name: "Kbd", slugs: ["kbd"] },
  { name: "Loader", slugs: ["ascii-loader", "matrix-loader", "classic-loader"] },
  { name: "Menubar", slugs: ["menubar"] },
  { name: "Number Animation", slugs: ["number-animation"] },
  { name: "Popover", slugs: ["popover"] },
  { name: "Progress", slugs: ["progress"] },
  { name: "Radio", slugs: ["radio"] },
  { name: "Scroll Area", slugs: ["scroll-area"] },
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
  { name: "Text Effects", slugs: ["text-shimmer", "scramble-text", "blur-text"] },
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
      "number-animation",
      "skeleton",
      "empty",
      "text-shimmer",
      "scramble-text",
      "blur-text",
      "ascii-loader",
      "matrix-loader",
      "classic-loader",
    ],
  },
  {
    name: "Navigation and layout",
    slugs: [
      "breadcrumb",
      "tabs",
      "collapsible",
      "table",
      "data-table",
      "table-of-contents",
      "table-of-contents-lines",
      "separator",
      "scroll-area",
      "command-palette",
      "kbd",
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
      "context-menu",
      "menubar",
    ],
  },
] as const;

const COMPONENT_MAIN_APIS: Record<string, string> = {
  "action-button": "ActionButton",
  "action-toggle": "ActionToggle",
  alert: "Alert, AlertTitle, AlertDescription, AlertClose",
  "alert-dialog": "AlertDialog, AlertDialogAction, AlertDialogMedia, AlertDialogFooterItem, and shared composition parts",
  "ascii-loader": "AsciiLoader",
  "matrix-loader": "MatrixLoader",
  "classic-loader": "ClassicLoader",
  "number-animation": "NumberAnimation",
  badge: "Badge, BadgeClose, BadgeDot, BadgeCount, BadgeIconsProvider",
  breadcrumb: "Breadcrumb, BreadcrumbList, item/link/page/separator parts, BreadcrumbEllipsis, BreadcrumbCollapse",
  button: "Button",
  "button-group": "ButtonGroup",
  checkbox: "Checkbox, CheckboxGroup",
  collapsible: "Collapsible, CollapsibleTrigger, CollapsibleTriggerIcon, CollapsibleContent",
  "command-palette": "CommandPalette, panel/list/row/tab/footer parts, useCommandSearch, useCommandPanelHighlight",
  "context-menu": "ContextMenu, ContextMenuTrigger, ContextMenuContent, composable popup parts, and item/checkbox/radio/action/submenu/select rows",
  "copy-button": "CopyButton",
  "date-picker": "DatePicker, DateRangePicker, Calendar",
  "delete-button": "DeleteButton",
  dialog: "Dialog, DialogBody, composable surfaces, createDialogHandle, DialogSteps, DialogStep",
  "dropdown-menu": "DropdownMenu, createDropdownMenuHandle, composable popup parts, and action/selection/submenu rows",
  empty: "Empty and composition parts",
  "hover-card": "HoverCard, createHoverCardHandle, HoverCardSkeleton, and composable popup parts",
  input: "Input, InputCount",
  kbd: "Kbd, KbdGroup",
  menubar: "Menubar, MenubarMenu, MenubarTrigger, MenubarContent, and item/checkbox/radio/action/submenu/select rows",
  morph: "Morph",
  popover: "Popover, createPopoverHandle, and composable popup parts",
  progress: "Progress, ProgressCircle, ProgressLabel, ProgressValue",
  radio: "RadioGroup, Radio",
  select: "Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectGroupLabel, SelectSortTrigger, submenu parts",
  "select-aligned": "AlignedSelect, AlignedSelectTrigger, AlignedSelectContent, AlignedSelectItem",
  "select-search": "SearchSelect, SearchSelectGroup, SearchSelectGroupLabel, SearchSelectCollection and input/content/item parts",
  "selection-toolbar": "SelectionToolbar, item parts, useSelectionToolbar",
  "scroll-area": "ScrollArea, ScrollAreaScrollbar",
  separator: "Separator",
  sheet: "Sheet and composition parts",
  sidebar: "SidebarProvider, Sidebar, SidebarPanel, SidebarHeaderButton, SidebarTabs, menu/group/submenu parts",
  "sidebar-layout": "SidebarLayout",
  skeleton: "Skeleton, SkeletonText",
  slider: "Slider",
  switch: "Switch",
  table: "Table, TableCaption, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell",
  "data-table": "DataTable, useDataTable, DataTableContent, DataTableToolbar, DataTableSearch, DataTableViewOptions, DataTablePagination, and composition parts",
  "table-of-contents": "TableOfContents",
  "table-of-contents-lines": "TableOfContentsLines",
  tabs: "Tabs, TabsList, TabsTab, TabsCount, TabsPanel",
  "text-shimmer": "TextShimmer",
  "scramble-text": "ScrambleText",
  "blur-text": "BlurText",
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
