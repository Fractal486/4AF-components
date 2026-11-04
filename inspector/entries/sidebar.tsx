import { bool, defineEntry, inMenu, select, withIcons } from "../schema";
import { VIEWPORT_ICONS } from "../setting-icons";
import { SidebarDemo } from "./sidebar-demo";

const LAYOUTS = ["default", "split"] as const;
const VARIANTS = ["default", "floating", "inset"] as const;
const COLLAPSIBLE = ["offcanvas", "icon", "none"] as const;
const SEARCH_VARIANTS = ["default", "plain", "underline"] as const;
const TONES = ["neutral", "accent"] as const;
const TAB_VARIANTS = ["segment", "pill", "underline"] as const;
const TAB_APPEARANCES = ["default", "solid", "outline"] as const;
const TAB_SIZES = ["sm", "md"] as const;

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
    // The desktop shell, or the mobile drawer (opened from the header's trigger).
    viewport: withIcons(select(["desktop", "mobile"] as const, "desktop", "Viewport"), VIEWPORT_ICONS),
    // Split adds the fixed icon rail; the default keeps one navigation column.
    layout: select(LAYOUTS, "default", "Layout"),
    // `default` sits flush against the page edge; `floating` and `inset` inset it.
    // The drawer has no variants.
    variant: select(VARIANTS, "default", "Variant", (values) => values.viewport === "mobile"),
    // What's left behind when it collapses: nothing, an icon rail, or no collapse at all.
    // Split has no collapse modes: its panel closes and the icon rail stays.
    collapsible: select(COLLAPSIBLE, "icon", undefined, (values) => values.layout === "split"),
    // Swaps the nav rows for their loading skeletons.
    loading: bool(false, "Loading"),
    customHeader: bool(false, "Custom header"),
    // The header's search field, and its styles in the row's ⋯ menu.
    searchField: bool(true, "Search field"),
    searchVariant: inMenu(select(SEARCH_VARIANTS, "plain", "Variant"), "searchField"),
    searchTone: inMenu(select(TONES, "neutral", "Focus tone"), "searchField"),
    // A tabs row under the title switching the nav; the default layout's, as split panels
    // already switch by rail. Its styles are in the row's ⋯ menu.
    tabs: bool(false, "Tabs"),
    tabsVariant: inMenu(select(TAB_VARIANTS, "segment", "Variant"), "tabs"),
    // Underline has no track, so no appearance.
    tabsAppearance: inMenu(select(TAB_APPEARANCES, "solid", "Appearance", (values) => values.tabsVariant === "underline"), "tabs"),
    tabsSize: inMenu(select(TAB_SIZES, "sm", "Size"), "tabs"),
  },
  render({
    viewport, layout, variant, collapsible, loading, customHeader,
    searchField, searchVariant, searchTone, tabs, tabsVariant, tabsAppearance, tabsSize,
  }) {
    const resolvedVariant = resolveSidebarVariant(layout, variant);

    return (
      <SidebarDemo
        // Remounted per shell option so the fixed panel re-measures against the new
        // geometry instead of animating between two layouts.
        key={`${viewport}-${layout}-${variant}-${collapsible}`}
        variant={resolvedVariant}
        collapsible={layout === "split" ? "offcanvas" : collapsible}
        loading={loading}
        customHeader={customHeader}
        tabs={tabs && layout === "default"}
        tabsStyle={{ variant: tabsVariant, appearance: tabsAppearance, size: tabsSize }}
        searchField={searchField}
        searchStyle={{ variant: searchVariant, tone: searchTone }}
        mobile={viewport === "mobile"}
      />
    );
  },
});
