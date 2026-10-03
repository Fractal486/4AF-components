import { cva, type VariantProps } from "class-variance-authority";

/**
 * The tab row a custom panel can put directly under its header (`CommandPanelTabList`).
 *
 * Both variants close on the same rule the header draws under itself, so the row reads as
 * part of the panel's chrome rather than as content. `fill` pads the tabs off that rule on
 * both sides; `underline` seats them on it, because the rule is what its line travels along.
 */
export const commandPanelTabListVariants = cva(
  "relative flex shrink-0 items-center gap-0.5 border-b border-border px-1.5",
  {
    variants: {
      variant: {
        fill: "py-1.5",
        underline: "items-end pt-1.5",
      },
    },
    defaultVariants: { variant: "fill" },
  },
);

/**
 * One tab: a plain label that brightens when selected. Nothing else on the tab changes —
 * the travelling indicator is the whole of the selected state.
 */
export const commandPanelTabVariants = cva(
  [
    "relative z-10 text-xs text-muted-foreground outline-none select-none",
    "transition-colors duration-(--duration-fast)",
    "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
    "data-[active]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        fill: "rounded-[6px] px-2.5 py-1",
        // Rounded at the top only: the bottom edge sits on the rule.
        underline: "rounded-t-[6px] px-2.5 pt-1 pb-2",
      },
    },
    defaultVariants: { variant: "fill" },
  },
);

/**
 * The travelling indicator. Only the vertical placement and the look live here — `left`
 * and `width` are measured from the selected tab and set inline.
 */
export const commandPanelTabIndicatorVariants = cva("pointer-events-none absolute z-0", {
  variants: {
    variant: {
      // The tab's own radius, inset by the row's padding so it sits exactly behind the tab.
      fill: "inset-y-1.5 rounded-[6px] bg-muted",
      // Over the row's bottom border, so the line replaces that stretch of rule.
      underline: "-bottom-px h-px bg-foreground",
    },
  },
  defaultVariants: { variant: "fill" },
});

export type CommandPanelTabListVariants = VariantProps<typeof commandPanelTabListVariants>;
