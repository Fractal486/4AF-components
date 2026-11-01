import { cva, type VariantProps } from "class-variance-authority";

// The tiny backdrop layer softens only the fading strip. Its mask tapers the blur
// inward, while the list's existing mask still fades the entire edge to transparent.
export const tabsEdgeVariants = cva(
  "pointer-events-none absolute z-20 backdrop-blur-[1.5px]",
  {
    variants: {
      edge: {
        left: "inset-y-0 left-0 translate-x-(--tabs-scroll-offset) w-(--tabs-fade-left) [mask-image:linear-gradient(to_right,black,transparent)]",
        right: "inset-y-0 right-0 translate-x-(--tabs-scroll-offset) w-(--tabs-fade-right) [mask-image:linear-gradient(to_left,black,transparent)]",
        top: "inset-x-0 top-0 translate-y-(--tabs-scroll-offset) h-(--tabs-fade-top) [mask-image:linear-gradient(to_bottom,black,transparent)]",
        bottom: "inset-x-0 bottom-0 translate-y-(--tabs-scroll-offset) h-(--tabs-fade-bottom) [mask-image:linear-gradient(to_top,black,transparent)]",
      },
    },
  },
);

export const tabsRootVariants = cva("flex min-w-0 min-h-0 gap-4", {
  variants: { orientation: { horizontal: "flex-col", vertical: "flex-row" } },
  defaultVariants: { orientation: "horizontal" },
});

export const tabsListVariants = cva("group/tabs-list relative flex min-w-0 min-h-0 max-w-full items-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>[role=tab]]:shrink-0 [&>[role=tab]]:focus-visible:ring-inset [&>[role=tab]]:focus-visible:ring-offset-0", {
  variants: {
    orientation: {
      horizontal: "overflow-x-auto [--tabs-fade-left:0px] [--tabs-fade-right:0px] data-[overflow-left]:[--tabs-fade-left:32px] data-[overflow-right]:[--tabs-fade-right:32px] [mask-image:linear-gradient(to_right,transparent,black_var(--tabs-fade-left),black_calc(100%_-_var(--tabs-fade-right)),transparent)]",
      vertical: "flex-col max-h-full items-stretch overflow-y-auto [--tabs-fade-top:0px] [--tabs-fade-bottom:0px] data-[overflow-top]:[--tabs-fade-top:32px] data-[overflow-bottom]:[--tabs-fade-bottom:32px] [mask-image:linear-gradient(to_bottom,transparent,black_var(--tabs-fade-top),black_calc(100%_-_var(--tabs-fade-bottom)),transparent)]",
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
    { variant: "underline", orientation: "vertical", class: "w-fit border-b-0 border-e" },
    { variant: "pill", orientation: "vertical", size: "md", class: "rounded-[20px]" },
    { variant: "pill", orientation: "vertical", size: "sm", class: "rounded-[16px]" },
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
  defaultVariants: { variant: "segment", appearance: "default", size: "md", orientation: "horizontal" },
});

export const tabVariants = cva(
  [
    // `relative z-10` lifts the tab above the indicator. The indicator is a
    // sibling at `z-0`; without a stacking order the tab's transparent box would still
    // let the indicator (a positioned element) paint over the label. z-10 keeps the
    // text on top of the chip, which is the whole point of a chip.
    "relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "font-medium whitespace-nowrap select-none",
    // Only the colour changes on hover — the indicator is a separate element and
    // moves independently, so naming `color` keeps the browser from watching the rest.
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
      orientation: { horizontal: "", vertical: "justify-start" },
      variant: {
        segment: "",
        pill: "rounded-full",
        // -1px pulls the tab over the list's border so the indicator sits on top of
        // it rather than below, and the two hairlines don't stack into 2px.
        underline: "-mb-px",
      },
      appearance: { default: "", solid: "", outline: "" },
      /* `sm` uses smaller text and tighter spacing, with a 32px pill track. */
      size: {
        sm: "text-xs [&_svg:not([class*='size-'])]:size-3.5",
        md: "text-sm [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      { variant: "underline", orientation: "vertical", class: "mb-0 -me-px rounded-none" },
      { variant: "segment", size: "md", class: "rounded-[6px] px-2.5 py-1" },
      { variant: "segment", size: "sm", class: "rounded-[5px] px-2 py-1" },
      { variant: "pill", size: "md", class: "px-3.5 py-1.5" },
      { variant: "pill", size: "sm", class: "px-2.5 py-1.5" },
      // Compact: the underline marks the label alone, so the tab needs only enough padding
      // to space the labels apart and give the focus ring room.
      { variant: "underline", size: "md", class: "rounded-t-[6px] px-2.5 pt-1 pb-2" },
      { variant: "underline", size: "sm", class: "rounded-t-[5px] px-1.5 pt-0.5 pb-1" },
      // Outlined segment: with the 3px padding and 1px border, 34px and 30px, the md and
      // sm Input and Select heights.
      { variant: "segment", appearance: "outline", size: "md", class: "rounded-[4px] px-3 py-[3px]" },
      { variant: "segment", appearance: "outline", size: "sm", class: "rounded-[3px] px-2.5 py-[3px]" },
      // Outlined pill: a pixel off the tab's vertical padding pays for the border, so the
      // track keeps its height.
      { variant: "pill", appearance: "outline", class: "py-[5px]" },
    ],
    defaultVariants: { variant: "segment", appearance: "default", size: "md", orientation: "horizontal" },
  },
);

/** Base UI measures the selected tab; CSS keeps the indicator in the list's coordinates.
 * Width/height animate to preserve rounded corners without scaling their shape.
 */
export const tabIndicatorVariants = cva([
  "pointer-events-none absolute top-0 left-0 z-0 w-(--active-tab-width) h-(--active-tab-height)",
  "translate-x-(--active-tab-left) translate-y-(--active-tab-top)",
  "motion-safe:group-data-[indicator-ready]/tabs-list:transition-[translate,width,height]",
  "motion-safe:group-data-[indicator-ready]/tabs-list:[transition-duration:var(--duration-slower),var(--duration-slow),var(--duration-slow)]",
  "ease-[var(--ease-out)] motion-reduce:transition-none",
], {
  variants: {
    variant: { segment: "", pill: "rounded-full", underline: "bg-foreground" },
    orientation: { horizontal: "", vertical: "" },
    appearance: { default: "", solid: "", outline: "" },
    size: {
      md: "[--tabs-line-width:1.5px] [--tabs-label-x:--spacing(2.5)] [--tabs-label-top:--spacing(1)] [--tabs-label-bottom:--spacing(2)]",
      sm: "[--tabs-line-width:1px] [--tabs-label-x:--spacing(1.5)] [--tabs-label-top:--spacing(0.5)] [--tabs-label-bottom:--spacing(1)]",
    },
  },
  compoundVariants: [
    { variant: ["segment", "pill"], appearance: "default", class: "bg-surface shadow-border" },
    { variant: ["segment", "pill"], appearance: "solid", class: "bg-background" },
    { variant: ["segment", "pill"], appearance: "outline", class: "bg-muted" },
    { variant: "segment", appearance: ["default", "solid"], size: "md", class: "rounded-[6px]" },
    { variant: "segment", appearance: ["default", "solid"], size: "sm", class: "rounded-[5px]" },
    { variant: "segment", appearance: "outline", size: "md", class: "rounded-[4px]" },
    { variant: "segment", appearance: "outline", size: "sm", class: "rounded-[3px]" },
    {
      variant: "underline", orientation: "horizontal",
      class: "top-auto bottom-0 h-(--tabs-line-width) w-[calc(var(--active-tab-width)-var(--tabs-label-x)*2)] translate-x-[calc(var(--active-tab-left)+var(--tabs-label-x))] translate-y-0",
    },
    {
      variant: "underline", orientation: "vertical",
      class: "left-auto right-0 rtl:left-0 rtl:right-auto w-(--tabs-line-width) h-[calc(var(--active-tab-height)-var(--tabs-label-top)-var(--tabs-label-bottom))] translate-x-0 translate-y-[calc(var(--active-tab-top)+var(--tabs-label-top))]",
    },
  ],
  defaultVariants: { variant: "segment", appearance: "default", size: "md", orientation: "horizontal" },
});

export type TabsVariants = VariantProps<typeof tabsListVariants>;
