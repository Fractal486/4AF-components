import registry from "../registry.json";

export const COMPONENT_FAMILIES = [
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
      "select-motion",
      "select-motion-search",
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
      "toast",
      "ascii-loader",
    ],
  },
  {
    name: "Navigation and application structure",
    slugs: [
      "tabs",
      "collapsible",
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
  badge: "Badge",
  button: "Button",
  "button-group": "ButtonGroup",
  checkbox: "Checkbox",
  collapsible: "Collapsible, CollapsibleTrigger, CollapsibleContent",
  "command-palette": "CommandPalette, panel/list/row/action parts, useCommandSearch, useCommandPanelHighlight",
  "copy-button": "CopyButton",
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
  select: "Select, SelectTrigger, SelectSortTrigger, SelectValue, SelectContent, SelectItem",
  "select-motion": "Select, SelectTrigger, SelectValue, SelectContent, SelectItem",
  "select-motion-search": "MotionSearchSelect and input/content/item parts",
  "select-search": "SearchSelect and input/content/item parts",
  "selection-toolbar": "SelectionToolbar, item parts, useSelectionToolbar",
  separator: "Separator",
  sheet: "Sheet and composition parts",
  sidebar: "SidebarProvider, Sidebar, SidebarPanel, SidebarHeaderButton, menu/group/submenu parts",
  "sidebar-layout": "SidebarLayout",
  skeleton: "Skeleton",
  slider: "Slider",
  switch: "Switch",
  "table-of-contents": "TableOfContents",
  "table-of-contents-lines": "TableOfContentsLines",
  tabs: "Tabs, TabsList, TabsTab, TabsPanel",
  "text-shimmer": "TextShimmer",
  textarea: "Textarea",
  toast: "ToastProvider, useToast, createToastManager",
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
