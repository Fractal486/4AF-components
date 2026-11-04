/**
 * Every demo the playground can load, as plain data: the docs route reads it on the server to
 * decide which pages open as a playground. The demos themselves live in `component-demo.tsx`.
 */
export const DEMO_NAMES = [
  "action-button",
  "action-toggle",
  "alert",
  "alert-dialog",
  "ascii-loader",
  "matrix-loader",
  "classic-loader",
  "badge",
  "number-animation",
  "breadcrumb",
  "button",
  "button-group",
  "checkbox",
  "checkbox-group",
  "checkbox-nested",
  "collapsible",
  "command-palette",
  "context-menu",
  "copy-button",
  "date-picker",
  "delete-button",
  "dialog",
  "dropdown-menu",
  "empty",
  "hover-card",
  "input",
  "kbd",
  "menubar",
  "morph",
  "popover",
  "progress",
  "radio",
  "select",
  "select-sort",
  "select-filter",
  "select-aligned",
  "select-search",
  "selection-toolbar",
  "scroll-area",
  "separator",
  "sheet",
  "sidebar",
  "sidebar-layout",
  "skeleton",
  "skeleton-text",
  "skeleton-wrap",
  "skeleton-inline",
  "slider",
  "slider-circle",
  "slider-knob",
  "switch",
  "data-table",
  "table",
  "table-of-contents",
  "table-of-contents-lines",
  "tabs",
  "scramble-text",
  "blur-text",
  "text-shimmer",
  "textarea",
  "toggle",
  "tooltip",
] as const;

export type ComponentDemoName = (typeof DEMO_NAMES)[number];

export interface PlaygroundDemo {
  name: ComponentDemoName;
  label: string;
}

/** Demos a page offers after its own, switched from the canvas rail. */
const EXTRA_DEMOS: Partial<Record<ComponentDemoName, PlaygroundDemo[]>> = {
  checkbox: [
    { name: "checkbox-group", label: "Group" },
    { name: "checkbox-nested", label: "Nested" },
  ],
  select: [
    { name: "select-sort", label: "Sort trigger" },
    { name: "select-filter", label: "Filter trigger" },
  ],
  slider: [
    { name: "slider-circle", label: "Circle" },
    { name: "slider-knob", label: "Knob" },
  ],
  skeleton: [
    { name: "skeleton-text", label: "Text" },
    { name: "skeleton-wrap", label: "Wrap" },
    { name: "skeleton-inline", label: "Inline" },
  ],
};

const isDemoName = (name: string): name is ComponentDemoName =>
  (DEMO_NAMES as readonly string[]).includes(name);

/** The demos a component page shows, its own first; empty for a page with no demo. */
export function playgroundDemos(slug: string, title: string): PlaygroundDemo[] {
  if (!isDemoName(slug)) return [];
  return [{ name: slug, label: title }, ...(EXTRA_DEMOS[slug] ?? [])];
}
