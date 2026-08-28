import { cva, type VariantProps } from "class-variance-authority";

export const tabsListVariants = cva("relative flex items-center", {
  variants: {
    variant: {
      /* A track wraps its tabs, so it must not stretch: the list is a flex child of a
         column, and would otherwise become a page-wide bar.
         6px tabs inside an 8px track with 2px of padding — the shared button radius tiers,
         so the inner corners sit parallel to the outer ones. The fill is set per `solid`
         below. */
      segment: "w-fit self-start gap-0.5 rounded-[8px] p-0.5",
      pill: "w-fit self-start gap-1 rounded-full p-1",
      /* The opposite: a rule *should* run the full width, so the tabs read as sitting
         on a line rather than in a box. A real border, not a shadow — its job here is
         separation, not elevation. */
      underline: "w-full gap-1 border-b border-border",
    },
    // The pill treatment (segment/pill only). `false` is the raised surface chip with a
    // hairline; `true` drops the hairline for a dark fill on a brighter track.
    solid: { false: "", true: "" },
  },
  compoundVariants: [
    { variant: ["segment", "pill"], solid: false, class: "bg-muted" },
    // Brighter track so the dark, borderless pill reads against it.
    { variant: ["segment", "pill"], solid: true, class: "bg-border" },
  ],
  defaultVariants: { variant: "segment", solid: false },
});

export const tabVariants = cva(
  [
    // `relative z-10` lifts the tab above the indicator. The indicator is an earlier
    // sibling at `z-0`; without a stacking order the tab's transparent box would still
    // let the indicator (a positioned element) paint over the label. z-10 keeps the
    // text on top of the chip, which is the whole point of a chip.
    "relative z-10 inline-flex items-center justify-center",
    "text-sm font-medium whitespace-nowrap select-none",
    // Only the colour changes on hover — the indicator is a separate element and
    // moves under Motion, so naming `color` keeps the browser from watching the rest.
    "transition-[color] duration-(--duration-fast) ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Base UI drives selection, and the attribute it actually sets is `aria-selected`
    // — not `data-selected`. Styling off the ARIA attribute has the nice property that
    // the styling can't drift from what a screen reader is told. `text-foreground` reads
    // on both pills: light ink on the surface chip, and the flipped light-on-dark on the
    // solid one (the background fill is dark in dark mode, near-white in light).
    "text-muted-foreground hover:text-foreground aria-selected:text-foreground",
  ],
  {
    variants: {
      variant: {
        segment: "rounded-[6px] px-2.5 py-1",
        pill: "rounded-full px-3.5 py-1.5",
        // -1px pulls the tab over the list's border so the indicator sits on top of
        // it rather than below, and the two hairlines don't stack into 2px.
        underline: "-mb-px rounded-t-[8px] px-3 pt-1.5 pb-2.5",
      },
    },
    defaultVariants: { variant: "segment" },
  },
);

/**
 * The travelling indicator. One per list, positioned over the selected tab.
 *
 * Only the vertical placement and the look live here — `left` and `width` are measured
 * from the active tab and animated inline, so they must not be set in these classes.
 * `inset-y-*` matches the list's padding so the chip lines up with the tab it sits under.
 */
export const tabIndicatorVariants = cva("pointer-events-none absolute z-0", {
  variants: {
    variant: {
      segment: "inset-y-0.5 rounded-[6px]",
      pill: "inset-y-1 rounded-full",
      underline: "bottom-0 h-px bg-foreground",
    },
    solid: { false: "", true: "" },
  },
  compoundVariants: [
    // Raised surface chip with a hairline, vs. a dark borderless fill.
    { variant: ["segment", "pill"], solid: false, class: "bg-surface shadow-border" },
    { variant: ["segment", "pill"], solid: true, class: "bg-background" },
  ],
  defaultVariants: { variant: "segment", solid: false },
});

export type TabsVariants = VariantProps<typeof tabsListVariants>;
