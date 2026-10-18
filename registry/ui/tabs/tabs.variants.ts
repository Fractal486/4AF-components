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
         tab's inside it — see the size compounds. The fill is set per `appearance` below. */
      segment: "w-fit self-start p-0.5",
      pill: "w-fit self-start rounded-full",
      /* The opposite: a rule *should* run the full width, so the tabs read as sitting
         on a line rather than in a box. A real border, not a shadow — its job here is
         separation, not elevation. */
      underline: "w-full border-b border-border",
    },
    /* The track and chip treatment (segment/pill only; underline ignores it):
       `default` — a raised surface chip with a hairline on a muted track;
       `solid` — a borderless background chip on a border track;
       `outline` — a bordered, unfilled track with a muted fill under the selected tab. */
    appearance: { default: "", solid: "", outline: "" },
    size: { sm: "", md: "" },
  },
  compoundVariants: [
    { variant: ["segment", "pill"], appearance: "default", class: "bg-muted" },
    // Border track behind the borderless background chip.
    { variant: ["segment", "pill"], appearance: "solid", class: "bg-border" },
    { variant: ["segment", "pill"], appearance: "outline", class: "border border-border" },
    /* Radii are concentric — outer = inner + padding — so a 2px track around a 6px tab
       rounds to 8px, and the sm tab's 5px corner rounds to 7px. Reuse one radius for both
       and the corners visibly disagree. */
    { variant: "segment", size: "md", class: "gap-0.5 rounded-[8px]" },
    { variant: "segment", size: "sm", class: "gap-0.5 rounded-[7px]" },
    /* Outlined, the segment's fill sits 3px inside the border. Concentric through the
       border (outer = fill + padding + border), so the 8px and 7px tracks hold 4px and
       3px fills. */
    { variant: "segment", appearance: "outline", class: "gap-[3px] p-[3px]" },
    /* The pill track's padding *is* its gap between the chip and the edge, so it shrinks
       with the tab rather than staying put. */
    { variant: "pill", size: "md", class: "gap-1 p-1" },
    { variant: "pill", size: "sm", class: "gap-0.5 p-0.5" },
    { variant: "underline", size: "md", class: "gap-1" },
    { variant: "underline", size: "sm", class: "gap-0.5" },
  ],
  defaultVariants: { variant: "segment", appearance: "default", size: "md" },
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
    // The slow token: at the fast one the label's highlight read as a snap; a hover is
    // ambient, so it eases in rather than keeping pace with the cursor.
    "transition-[color] duration-(--duration-slow) ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Base UI drives selection, and the attribute it actually sets is `aria-selected`
    // — not `data-selected`. Styling off the ARIA attribute has the nice property that
    // the styling can't drift from what a screen reader is told. `text-foreground` reads
    // on both chips: foreground text contrasts with the surface or background fill
    // in either theme.
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
      appearance: { default: "", solid: "", outline: "" },
      /* `sm` uses smaller text and tighter spacing, with a 32px pill track. */
      size: { sm: "text-xs", md: "text-sm" },
    },
    compoundVariants: [
      { variant: "segment", size: "md", class: "rounded-[6px] px-2.5 py-1" },
      { variant: "segment", size: "sm", class: "rounded-[5px] px-2 py-1" },
      { variant: "pill", size: "md", class: "px-3.5 py-1.5" },
      { variant: "pill", size: "sm", class: "px-2.5 py-1.5" },
      // Compact: the underline marks the label alone, so the tab needs only enough padding
      // to space the labels apart and give the focus ring room.
      { variant: "underline", size: "md", class: "rounded-t-[6px] px-2 py-1" },
      { variant: "underline", size: "sm", class: "rounded-t-[5px] px-1.5 pt-0.5 pb-1" },
      // Outlined segment: with the 3px padding and 1px border, 34px and 30px, the md and
      // sm Input and Select heights.
      { variant: "segment", appearance: "outline", size: "md", class: "rounded-[4px] px-3 py-[3px]" },
      { variant: "segment", appearance: "outline", size: "sm", class: "rounded-[3px] px-2.5 py-[3px]" },
      // Outlined pill: a pixel off the tab's vertical padding pays for the border, so the
      // track keeps its height.
      { variant: "pill", appearance: "outline", class: "py-[5px]" },
    ],
    defaultVariants: { variant: "segment", appearance: "default", size: "md" },
  },
);

/**
 * The travelling indicator. One per list, positioned over the selected tab.
 *
 * Only the vertical placement and appearance live here. `left` and `width` define the
 * measured target; Motion animates the layout change with transforms. Do not set those
 * target properties in these classes.
 * `inset-y-*` matches the list's padding so the chip lines up with the tab it sits under.
 */
export const tabIndicatorVariants = cva("pointer-events-none absolute z-0", {
  variants: {
    variant: {
      segment: "inset-y-0.5",
      pill: "rounded-full",
      // A pixel down, so it sits over the list's 1px separator instead of just above it.
      underline: "-bottom-px h-[1.5px] bg-foreground",
    },
    appearance: { default: "", solid: "", outline: "" },
    size: { sm: "", md: "" },
  },
  compoundVariants: [
    // Raised surface chip with a hairline, or a borderless background fill.
    { variant: ["segment", "pill"], appearance: "default", class: "bg-surface shadow-border" },
    { variant: ["segment", "pill"], appearance: "solid", class: "bg-background" },
    { variant: ["segment", "pill"], appearance: "outline", class: "bg-muted" },
    // The chip repeats the tab's radius, and sits inside the track's own padding.
    { variant: "segment", appearance: ["default", "solid"], size: "md", class: "rounded-[6px]" },
    { variant: "segment", appearance: ["default", "solid"], size: "sm", class: "rounded-[5px]" },
    { variant: "segment", appearance: "outline", size: "md", class: "inset-y-[3px] rounded-[4px]" },
    { variant: "segment", appearance: "outline", size: "sm", class: "inset-y-[3px] rounded-[3px]" },
    { variant: "pill", size: "md", class: "inset-y-1" },
    { variant: "pill", size: "sm", class: "inset-y-0.5" },
  ],
  defaultVariants: { variant: "segment", appearance: "default", size: "md" },
});

export type TabsVariants = VariantProps<typeof tabsListVariants>;
