import { cva, type VariantProps } from "class-variance-authority";

// The tiny backdrop layer softens only the fading strip. Its mask tapers the blur
// inward, while the list's existing mask still fades the entire edge to transparent.
export const tabsEdgeVariants = cva(
  "pointer-events-none absolute inset-y-0 z-20 translate-x-(--tabs-scroll-offset) backdrop-blur-[1.5px]",
  {
    variants: {
      edge: {
        left: "left-0 w-(--tabs-fade-left) [mask-image:linear-gradient(to_right,black,transparent)]",
        right: "right-0 w-(--tabs-fade-right) [mask-image:linear-gradient(to_left,black,transparent)]",
      },
    },
  },
);

export const tabsListVariants = cva("relative flex items-center", {
  variants: {
    scrollable: {
      false: "",
      true: "min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [--tabs-fade-left:0px] [--tabs-fade-right:0px] data-[overflow-left]:[--tabs-fade-left:32px] data-[overflow-right]:[--tabs-fade-right:32px] [mask-image:linear-gradient(to_right,transparent,black_var(--tabs-fade-left),black_calc(100%_-_var(--tabs-fade-right)),transparent)] [&>[role=tab]]:shrink-0 [&>[role=tab]]:focus-visible:ring-inset [&>[role=tab]]:focus-visible:ring-offset-0",
    },
    variant: {
      /* A track wraps its tabs, so it must not stretch: the list is a flex child of a
         column, and would otherwise become a page-wide bar. The radius pairs with the
         tab's inside it — see the size compounds. The fill is set per `solid` below. */
      segment: "w-fit self-start p-0.5",
      pill: "w-fit self-start rounded-full",
      /* The opposite: a rule *should* run the full width, so the tabs read as sitting
         on a line rather than in a box. A real border, not a shadow — its job here is
         separation, not elevation. */
      underline: "w-full border-b border-border",
    },
    // The pill treatment (segment/pill only). `false` is the raised surface chip with a
    // hairline; `true` drops the hairline for a dark fill on a brighter track.
    solid: { false: "", true: "" },
    size: { sm: "", md: "" },
  },
  compoundVariants: [
    { variant: ["segment", "pill"], solid: false, class: "bg-muted" },
    // Brighter track so the dark, borderless pill reads against it.
    { variant: ["segment", "pill"], solid: true, class: "bg-border" },
    /* Radii are concentric — outer = inner + padding — so a 2px track around a 6px tab
       rounds to 8px, and the sm tab's 5px corner rounds to 7px. Reuse one radius for both
       and the corners visibly disagree. */
    { variant: "segment", size: "md", class: "gap-0.5 rounded-[8px]" },
    { variant: "segment", size: "sm", class: "gap-0.5 rounded-[7px]" },
    /* The pill track's padding *is* its gap between the chip and the edge, so it shrinks
       with the tab rather than staying put. */
    { variant: "pill", size: "md", class: "gap-1 p-1" },
    { variant: "pill", size: "sm", class: "gap-0.5 p-0.5" },
    { variant: "underline", size: "md", class: "gap-1" },
    { variant: "underline", size: "sm", class: "gap-0.5" },
  ],
  defaultVariants: { variant: "segment", solid: false, size: "md" },
});

export const tabVariants = cva(
  [
    // `relative z-10` lifts the tab above the indicator. The indicator is an earlier
    // sibling at `z-0`; without a stacking order the tab's transparent box would still
    // let the indicator (a positioned element) paint over the label. z-10 keeps the
    // text on top of the chip, which is the whole point of a chip.
    "relative z-10 inline-flex items-center justify-center",
    "font-medium whitespace-nowrap select-none",
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
        segment: "",
        pill: "rounded-full",
        // -1px pulls the tab over the list's border so the indicator sits on top of
        // it rather than below, and the two hairlines don't stack into 2px.
        underline: "-mb-px",
      },
      /* `sm` drops a type step and tightens the padding, landing the pill track on 32px —
         the height of an Input or a small Button, so a row of tabs lines up with the
         controls beside it instead of standing a row taller. */
      size: { sm: "text-xs", md: "text-sm" },
    },
    compoundVariants: [
      { variant: "segment", size: "md", class: "rounded-[6px] px-2.5 py-1" },
      { variant: "segment", size: "sm", class: "rounded-[5px] px-2 py-1" },
      { variant: "pill", size: "md", class: "px-3.5 py-1.5" },
      { variant: "pill", size: "sm", class: "px-2.5 py-1.5" },
      { variant: "underline", size: "md", class: "rounded-t-[8px] px-3 pt-1.5 pb-2.5" },
      { variant: "underline", size: "sm", class: "rounded-t-[6px] px-2.5 pt-1 pb-2" },
    ],
    defaultVariants: { variant: "segment", size: "md" },
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
      segment: "inset-y-0.5",
      pill: "rounded-full",
      underline: "bottom-0 h-px bg-foreground",
    },
    solid: { false: "", true: "" },
    size: { sm: "", md: "" },
  },
  compoundVariants: [
    // Raised surface chip with a hairline, vs. a dark borderless fill.
    { variant: ["segment", "pill"], solid: false, class: "bg-surface shadow-border" },
    { variant: ["segment", "pill"], solid: true, class: "bg-background" },
    // The chip repeats the tab's radius, and sits inside the track's own padding.
    { variant: "segment", size: "md", class: "rounded-[6px]" },
    { variant: "segment", size: "sm", class: "rounded-[5px]" },
    { variant: "pill", size: "md", class: "inset-y-1" },
    { variant: "pill", size: "sm", class: "inset-y-0.5" },
  ],
  defaultVariants: { variant: "segment", solid: false, size: "md" },
});

export type TabsVariants = VariantProps<typeof tabsListVariants>;
