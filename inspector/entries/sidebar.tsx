import { bool, defineEntry, select, type ControlValues } from "../schema";
import { SidebarDemo } from "./sidebar-demo";

const LAYOUTS = ["default", "split"] as const;
const VARIANTS = ["default", "floating", "inset"] as const;
const COLLAPSIBLE = ["offcanvas", "icon", "none"] as const;

const VARIANT_BY_LAYOUT = {
  default: {
    default: "sidebar",
    floating: "floating",
    inset: "inset",
  },
  split: {
    default: "split",
    floating: "split-floating",
    inset: "split-inset",
  },
} as const;

type SidebarLayout = keyof typeof VARIANT_BY_LAYOUT;
type SidebarVariant = keyof (typeof VARIANT_BY_LAYOUT)["default"];

export function resolveSidebarVariant(layout: SidebarLayout, variant: SidebarVariant) {
  return VARIANT_BY_LAYOUT[layout][variant];
}

export const sidebarEntry = defineEntry({
  slug: "sidebar",
  name: "Sidebar",
  controls: {
    // Split adds the fixed icon rail; the default keeps one navigation column.
    layout: select(LAYOUTS, "default", "Layout"),
    // `default` sits flush against the page edge; `floating` and `inset` inset it.
    variant: select(VARIANTS, "default", "Variant"),
    // What's left behind when it collapses: nothing, an icon rail, or no collapse at all.
    collapsible: select(COLLAPSIBLE, "icon"),
    // Swaps the nav rows for their loading skeletons.
    loading: bool(false, "Loading"),
    customHeader: bool(false, "Custom header"),
  },
  render({ layout, variant, collapsible, loading, customHeader }) {
    const resolvedVariant = resolveSidebarVariant(layout, variant);

    return (
      <SidebarDemo
        // Remounted per shell option so the fixed panel re-measures against the new
        // geometry instead of animating between two layouts.
        key={`${layout}-${variant}-${collapsible}`}
        variant={resolvedVariant}
        collapsible={collapsible}
        loading={loading}
        customHeader={customHeader}
      />
    );
  },
});

export type SidebarSettings = ControlValues<typeof sidebarEntry.controls>;
