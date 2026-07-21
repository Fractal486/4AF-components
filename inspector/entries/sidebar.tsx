import { bool, defineEntry, select } from "../schema";
import { SidebarDemo } from "./sidebar-demo";

const SIDES = ["left", "right"] as const;
const VARIANTS = ["sidebar", "floating", "inset", "split"] as const;
const COLLAPSIBLE = ["offcanvas", "icon", "none"] as const;

export const sidebarEntry = defineEntry({
  slug: "sidebar",
  name: "Sidebar",
  // A whole app shell is the one component the preview box is too small for.
  fullscreen: true,
  controls: {
    side: select(SIDES, "left"),
    // `sidebar` sits flush against the page edge; `floating` and `inset` inset it.
    variant: select(VARIANTS, "sidebar"),
    // What's left behind when it collapses: nothing, an icon rail, or no collapse at all.
    collapsible: select(COLLAPSIBLE, "icon"),
    // Swaps the nav rows for their loading skeletons.
    loading: bool(false, "Loading"),
  },
  render({ side, variant, collapsible, loading }) {
    return (
      <SidebarDemo
        // Remounted per shell option so the fixed panel re-measures against the new
        // geometry instead of animating between two layouts.
        key={`${side}-${variant}-${collapsible}`}
        side={side}
        variant={variant}
        collapsible={collapsible}
        loading={loading}
      />
    );
  },
});
