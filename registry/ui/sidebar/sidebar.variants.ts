import { cva, type VariantProps } from "class-variance-authority";

/** Height deliberately reflows the following navigation rows as a section unfolds.
 * Base UI measures the panel and retains it through its exit transition. Collapsing to the
 * icon rail folds an open section the same way, alongside the width, rather than dropping
 * its rows in one frame and jumping everything below. */
export const sidebarMenuCollapsiblePanelVariants = cva([
  "group/sidebar-section min-w-0 h-(--collapsible-panel-height) overflow-clip",
  "transition-[height] duration-(--duration-slow) ease-collapse",
  "data-[starting-style]:h-0 data-[ending-style]:h-0",
  "group-data-[collapsible=icon]:h-0",
]);

/** Animate the rows, keeping the submenu's vertical separator stationary. */
export const sidebarMenuCollapsibleContentVariants = cva([
  "min-w-0",
  "[&>[data-slot=sidebar-menu-sub]>li]:opacity-100 [&>[data-slot=sidebar-menu-sub]>li]:blur-[0px]",
  "[&>[data-slot=sidebar-menu-sub]>li]:transition-[opacity,filter] [&>[data-slot=sidebar-menu-sub]>li]:duration-(--duration-slow) [&>[data-slot=sidebar-menu-sub]>li]:ease-out",
  "group-data-[starting-style]/sidebar-section:[&>[data-slot=sidebar-menu-sub]>li]:opacity-0 group-data-[starting-style]/sidebar-section:[&>[data-slot=sidebar-menu-sub]>li]:blur-[4px]",
  "group-data-[ending-style]/sidebar-section:[&>[data-slot=sidebar-menu-sub]>li]:opacity-0 group-data-[ending-style]/sidebar-section:[&>[data-slot=sidebar-menu-sub]>li]:blur-[4px]",
  // In the icon rail the folded panel hides the rows instead of `display: none`, so they
  // fade as it folds. `visibility` holds visible to the end of the fold, then takes the
  // rows out of the tab order and the accessibility tree.
  "group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-sub]]:flex group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-sub]]:invisible",
  "[&>[data-slot=sidebar-menu-sub]]:transition-[visibility] [&>[data-slot=sidebar-menu-sub]]:duration-(--duration-slow)",
  "group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-sub]>li]:opacity-0 group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-sub]>li]:blur-[4px]",
]);

/**
 * The nav row. Two axes: `variant` (filled on hover vs. a bordered chip) and `size`.
 *
 * Only the layout properties transition, and only because the rail collapse genuinely
 * changes them — the button squares off to 32px when the sidebar becomes an icon rail.
 * The hover and active backgrounds are deliberately *not* in that list: a row highlight
 * that fades in lags behind the pointer as it runs down a list, which reads as the
 * interface struggling to keep up rather than as polish.
 */
export const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button flex w-full cursor-default items-center gap-2 overflow-hidden p-2 text-left text-sm",
    "text-muted-foreground outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "transition-[width,height,padding] duration-(--duration-slow) ease-collapse",
    "hover:bg-muted hover:text-foreground",
    // A sibling action should highlight this row when it is hovered, but a broad
    // parent-group hover would also fire while a collapsible row's nested children are hovered.
    "group-has-[>_[data-slot=sidebar-menu-action]:hover]/menu-item:bg-muted group-has-[>_[data-slot=sidebar-menu-action]:hover]/menu-item:text-foreground",
    "group-has-[>_[data-slot=sidebar-menu-chevron-button]:hover]/menu-item:bg-muted group-has-[>_[data-slot=sidebar-menu-chevron-button]:hover]/menu-item:text-foreground",
    "active:bg-muted active:text-foreground",
    "data-active:bg-muted data-active:font-medium data-active:text-foreground data-active:[&>svg]:stroke-[2.5]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // Leaves room for a trailing action button when the row has one.
    "group-has-data-[slot=sidebar-menu-action]/menu-item:pr-8",
    "group-has-[>_[data-slot=sidebar-menu-badge]]/menu-item:pr-10",
    "pointer-coarse:group-has-[>_[data-replaces-badge]]/menu-item:pr-16",
    // Collapsed to the icon rail, every row narrows to 32px with the glyph 8px in; its rail
    // height is per size below (32px, or 28px for `sm`). `!` because the size/padding above
    // are set per-size and would otherwise win.
    "group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:p-2!",
    // Collapsible triggers append their trailing chevron after the label, so labels
    // must be shrinkable without relying on being the final child.
    "[&>span]:min-w-0 [&>span]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    // The label is clipped by the narrowing row rather than ellipsised, so it doesn't
    // re-truncate with a moving "…" on every frame. Its fade spans the whole change, timed
    // by the state it heads into: collapsing on `ease-in`, so it stays readable while the row
    // closes over it and goes at the end; expanding on `ease-out`, so it starts coming back
    // as soon as the row opens.
    "[&>span]:transition-[opacity] [&>span]:duration-(--duration-slow) [&>span]:ease-out",
    "group-data-[collapsible=icon]:[&>span]:ease-in",
    "group-data-[collapsible=icon]:[&>span]:opacity-0 group-data-[collapsible=icon]:[&>span]:text-clip",
  ],
  {
    variants: {
      variant: {
        default: "",
        // A hairline built from a shadow, so it costs no layout and sits correctly on
        // whatever the sidebar's surface happens to be.
        outline: "bg-background shadow-border",
      },
      size: {
        default: "h-8 rounded-[8px] text-sm group-data-[collapsible=icon]:h-8!",
        // Keeps its 28px height in the rail, narrowing to the rail's 32px: growing to a
        // square moved its glyph, and a footer pinned to the bottom pushed it up. The 8px
        // side padding keeps the glyph on the same line as every other rail icon.
        sm: "h-7 rounded-[6px] text-xs group-data-[collapsible=icon]:h-7! group-data-[collapsible=icon]:py-1.5!",
        // Tall rows keep their own padding when collapsed, so a two-line row doesn't
        // get squashed into the rail.
        lg: "h-12 rounded-[8px] text-sm group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

/** The nested row under a parent item. Hidden entirely once the rail collapses. */
export const sidebarMenuSubButtonVariants = cva(
  [
    "flex h-7 w-full min-w-0 -translate-x-px cursor-default items-center gap-2 overflow-hidden rounded-[6px] px-2 text-left",
    "text-muted-foreground outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "hover:bg-muted hover:text-foreground",
    "group-hover/menu-sub-item:bg-muted group-hover/menu-sub-item:text-foreground",
    "active:bg-muted active:text-foreground",
    "data-active:bg-muted data-active:font-medium data-active:text-foreground data-active:[&>svg]:stroke-[2.5] data-active:[&>svg]:text-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // Leaves room for a trailing action button on nested rows too.
    "group-has-data-[slot=sidebar-menu-sub-action]/menu-sub-item:pr-8",
    "group-data-[collapsible=icon]:hidden",
    "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-subtle-foreground",
  ],
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SidebarMenuButtonVariants = VariantProps<typeof sidebarMenuButtonVariants>;

/** Replacement actions share the badge slot on a mouse; touch keeps both reachable. */
export const sidebarMenuReplacementActionVariants = cva([
  "data-[replaces-badge]:pointer-fine:opacity-0",
  "data-[replaces-badge]:pointer-fine:group-hover/menu-item:opacity-100",
  "data-[replaces-badge]:pointer-fine:group-focus-within/menu-item:opacity-100",
  "data-[replaces-badge]:pointer-fine:data-popup-open:opacity-100 data-[replaces-badge]:pointer-fine:data-[state=open]:opacity-100",
]);

export const sidebarMenuBadgeVariants = cva([
  "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1",
  "text-xs font-medium tabular-nums text-muted-foreground select-none",
  "data-[tone=success]:text-success data-[tone=warning]:text-warning-700 dark:data-[tone=warning]:text-warning-400 data-[tone=destructive]:text-destructive",
  "peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5",
  "group-has-[>_[data-replaces-badge]]/menu-item:right-8 pointer-fine:group-has-[>_[data-replaces-badge]]/menu-item:right-1",
  "group-has-data-[slot=sidebar-menu-chevron]/menu-collapsible:right-8",
  "group-has-data-[slot=sidebar-menu-action]/menu-collapsible:right-14!",
  "pointer-fine:group-has-[>_[data-replaces-badge]]/menu-collapsible:right-8!",
  "pointer-fine:group-has-[>_[data-replaces-badge]]/menu-item:group-hover/menu-item:opacity-0",
  "pointer-fine:group-has-[>_[data-replaces-badge]]/menu-item:group-focus-within/menu-item:opacity-0",
  "pointer-fine:group-has-[>_[data-replaces-badge][data-popup-open]]/menu-item:opacity-0",
  "pointer-fine:group-has-[>_[data-replaces-badge][data-state=open]]/menu-item:opacity-0",
  // The rail form: a dot in the row's corner. It applies in the icon rail, except while
  // `data-hold="count"` keeps the count to fade out at the start of a collapse.
  "group-data-[collapsible=icon]:not-data-[hold=count]:not-data-count:not-data-dot:hidden",
  "group-data-[collapsible=icon]:not-data-[hold=count]:right-1.5! group-data-[collapsible=icon]:not-data-[hold=count]:top-1.5! group-data-[collapsible=icon]:not-data-[hold=count]:size-1.5 group-data-[collapsible=icon]:not-data-[hold=count]:min-w-0 group-data-[collapsible=icon]:not-data-[hold=count]:p-0",
  "group-data-[collapsible=icon]:not-data-[hold=count]:[&>[data-part=count]]:sr-only",
  "group-data-[collapsible=icon]:not-data-[hold=count]:[&>[data-part=dot]]:block",
  // The replacement action disappears in icon mode; its notification dot stays visible.
  "group-data-[collapsible=icon]:opacity-100!",
  // Collapsing, the count fades and shrinks out and the dot comes in the same way; expanding,
  // the count fades in from the first frame, alongside the row's action.
  "[&>*]:transition-[opacity,scale] [&>*]:duration-(--duration-fast) [&>*]:ease-out",
  "data-settling:[&>*]:scale-50 data-settling:[&>*]:opacity-0",
]);
export type SidebarMenuSubButtonVariants = VariantProps<typeof sidebarMenuSubButtonVariants>;

/** Fixed icon-only controls used by the split sidebar rail. */
export const sidebarRailButtonVariants = cva([
  "group/rail-button flex size-8 shrink-0 cursor-default items-center justify-center rounded-[8px]",
  "text-muted-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring",
  "hover:bg-muted hover:text-foreground",
  "active:bg-muted active:text-foreground",
  "data-active:bg-muted data-active:text-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&>svg]:size-4 [&>svg]:shrink-0",
]);

/**
 * The mobile drawer: a panel that slides in from the sidebar's side over a plain dim
 * backdrop, and slides back out — CSS transitions on Base UI's starting and ending styles,
 * longer in than out, matching the docs site's navigation drawer. Translate and opacity only.
 */
export const sidebarMobileBackdropVariants = cva(
  [
    "inset-0 z-40 bg-black/50",
    "transition-[opacity] duration-(--duration-slower) ease-in-out",
    "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-(--duration-slow)",
  ],
  {
    variants: {
      // Inside a `mobileContainer`, positioned against it rather than the viewport.
      contained: { false: "fixed", true: "absolute" },
    },
    defaultVariants: { contained: false },
  },
);

export const sidebarMobilePopupVariants = cva(
  [
    "inset-y-0 z-50 flex min-w-0 flex-col border-border bg-surface p-0 shadow-overlay-drop outline-none",
    "transition-[translate] duration-(--duration-slower) ease-in-out data-[ending-style]:duration-(--duration-slow)",
  ],
  {
    variants: {
      side: {
        left: "left-0 border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
        right: "right-0 border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
      },
      contained: {
        false: "fixed h-dvh max-w-[85vw]",
        true: "absolute max-w-[85%]",
      },
    },
    defaultVariants: { side: "left", contained: false },
  },
);
