import { cva, type VariantProps } from "class-variance-authority";

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
    "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden p-2 text-left text-sm",
    "text-muted-foreground outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "transition-[width,height,padding] duration-(--duration-slow) ease-out",
    "hover:bg-muted hover:text-foreground",
    "group-has-data-[slot=sidebar-menu-action]/menu-item:group-hover/menu-item:bg-muted group-has-data-[slot=sidebar-menu-action]/menu-item:group-hover/menu-item:text-foreground",
    "active:bg-muted active:text-foreground",
    "data-active:bg-muted data-active:font-medium data-active:text-foreground data-active:[&>svg]:stroke-[2.5]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // Leaves room for a trailing action button when the row has one.
    "group-has-data-[slot=sidebar-menu-action]/menu-item:pr-8",
    // Collapsed to the icon rail, every row becomes a square with the glyph centred.
    // `!` because the size/padding above are set per-size and would otherwise win.
    "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
    "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
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
        default: "h-8 rounded-[8px] text-sm",
        sm: "h-7 rounded-[6px] text-xs",
        // Tall rows keep their own padding when collapsed, so a two-line row doesn't
        // get squashed into the rail.
        lg: "h-12 rounded-[8px] text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

/** The nested row under a parent item. Hidden entirely once the rail collapses. */
export const sidebarMenuSubButtonVariants = cva(
  [
    "flex h-7 w-full min-w-0 -translate-x-px cursor-pointer items-center gap-2 overflow-hidden rounded-[6px] px-2 text-left",
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
export type SidebarMenuSubButtonVariants = VariantProps<typeof sidebarMenuSubButtonVariants>;

/** Fixed icon-only controls used by the split sidebar rail. */
export const sidebarRailButtonVariants = cva([
  "group/rail-button flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px]",
  "text-muted-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring",
  "hover:bg-muted hover:text-foreground",
  "active:bg-muted active:text-foreground",
  "data-active:bg-muted data-active:text-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&>svg]:size-4 [&>svg]:shrink-0",
]);
