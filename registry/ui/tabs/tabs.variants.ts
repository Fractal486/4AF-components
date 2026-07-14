import { cva, type VariantProps } from "class-variance-authority";

export const tabsListVariants = cva("relative flex items-center", {
  variants: {
    variant: {
      /* A track wraps its tabs, so it must not stretch: the list is a flex child of a
         column, and would otherwise become a page-wide bar.
         rounded-md (7px) tabs inside a rounded-lg (10px) track with 2px of padding —
         concentric, so the inner corners sit parallel to the outer ones. */
      segment: "w-fit self-start gap-0.5 rounded-lg bg-muted p-0.5",
      pill: "w-fit self-start gap-1 rounded-full bg-muted p-1",
      /* The opposite: a rule *should* run the full width, so the tabs read as sitting
         on a line rather than in a box. A real border, not a shadow — its job here is
         separation, not elevation. */
      underline: "w-full gap-1 border-b border-border",
    },
  },
  defaultVariants: { variant: "segment" },
});

export const tabVariants = cva(
  [
    // `isolate` is load-bearing, not decoration. The indicator sits at `-z-10` so it
    // paints under the label — but a `relative` element with `z-index: auto` is not a
    // stacking context, so a negative-z child escapes it and paints behind the
    // *list's* background instead, and the pill vanishes. `isolate` makes the tab a
    // stacking context, which traps the indicator between the tab's background and
    // its text, exactly where it belongs.
    "relative isolate inline-flex cursor-pointer items-center justify-center",
    "text-sm font-medium whitespace-nowrap select-none",
    // Only the colour changes on hover — the indicator is a separate element and
    // moves under Motion, so naming `color` keeps the browser from watching the rest.
    "transition-[color] duration-(--duration-fast) ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Base UI drives selection, and the attribute it actually sets is `aria-selected`
    // — not `data-selected`. Styling off the ARIA attribute has the nice property that
    // the styling can't drift from what a screen reader is told.
    "text-muted-foreground hover:text-foreground aria-selected:text-foreground",
  ],
  {
    variants: {
      variant: {
        segment: "rounded-md px-2.5 py-1",
        pill: "rounded-full px-3.5 py-1.5",
        // -1px pulls the tab over the list's border so the indicator sits on top of
        // it rather than below, and the two hairlines don't stack into 2px.
        underline: "-mb-px rounded-t-md px-3 pt-1.5 pb-2.5",
      },
    },
    defaultVariants: { variant: "segment" },
  },
);

/** The travelling indicator. Rendered only under the selected tab. */
export const tabIndicatorVariants = cva("absolute", {
  variants: {
    variant: {
      segment: "inset-0 -z-10 rounded-md bg-surface shadow-border",
      pill: "inset-0 -z-10 rounded-full bg-surface shadow-border",
      underline: "-bottom-px left-0 h-px w-full bg-foreground",
    },
  },
  defaultVariants: { variant: "segment" },
});

export type TabsVariants = VariantProps<typeof tabsListVariants>;
