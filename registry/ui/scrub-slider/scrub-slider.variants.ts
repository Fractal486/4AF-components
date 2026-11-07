import { cva, type VariantProps } from "class-variance-authority";

/**
 * The scrub slider has two layouts. `card` holds a label, a value, and a ruler that shows dimly
 * while a mouse or pen hovers it (`data-hovered`) and in full while the slider is in use
 * (`data-active`: dragged or keyboard-focused), when the label and value lift above it.
 * `inline` is one row, an always-visible ruler before the value, for dense panels. The
 * pixel counterparts the ruler maths needs (tick spacing and heights) sit beside it in
 * `scrub-slider.tsx` and must change with these sizes.
 */

const sizes = { md: "", sm: "" };

export const scrubSliderVariants = cva(
  [
    "group/scrub-slider relative isolate w-full cursor-ew-resize touch-pan-y select-none outline-none",
    "has-[[type=range]:focus-visible]:ring-2 has-[[type=range]:focus-visible]:ring-ring",
    "data-[editing]:cursor-default",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  ],
  {
    variants: {
      layout: {
        card: "overflow-hidden",
        inline: "flex items-center gap-2 rounded-md",
      },
      size: sizes,
      /**
       * `card` is a faint fill. `outline-ghost` follows Button's variant of the same name: a
       * shadow-border edge alone. `plain` has neither.
       */
      variant: {
        card: "bg-muted/60",
        "outline-ghost": "shadow-border",
        plain: "",
      },
    },
    compoundVariants: [
      { layout: "card", size: "md", class: "h-15 rounded-xl" },
      { layout: "card", size: "sm", class: "h-12 rounded-lg" },
      { layout: "inline", size: "md", class: "h-7" },
      { layout: "inline", size: "sm", class: "h-6" },
    ],
    defaultVariants: { layout: "card", size: "md", variant: "card" },
  },
);

/**
 * The label and value. On the card, a row centred at rest that lifts while active to make
 * room for the ruler below it; inline, the value at the end of the row.
 */
export const scrubSliderContentVariants = cva("pointer-events-none flex items-center", {
  variants: {
    layout: {
      card: "absolute inset-0 justify-between gap-3 transition-[translate] duration-(--duration-slow) ease-out",
      inline: "shrink-0",
    },
    size: sizes,
  },
  compoundVariants: [
    { layout: "card", size: "md", class: "px-4 group-data-[active]/scrub-slider:-translate-y-[9px]" },
    { layout: "card", size: "sm", class: "px-3 group-data-[active]/scrub-slider:-translate-y-[7px]" },
  ],
  defaultVariants: { layout: "card", size: "md" },
});

export const scrubSliderLabelVariants = cva("min-w-0 truncate text-muted-foreground", {
  variants: { size: { md: "text-sm leading-5", sm: "text-[13px] leading-4" } },
  defaultVariants: { size: "md" },
});

/**
 * Inline, the value keeps a minimum width so the ruler doesn't shift with short numbers, and
 * takes the pointer with a text cursor, since only a click on it opens the editor.
 */
export const scrubSliderValueVariants = cva(
  "tabular flex shrink-0 items-baseline gap-0.5 text-foreground",
  {
    variants: {
      layout: { card: "", inline: "pointer-events-auto min-w-8 cursor-text justify-end" },
      size: { md: "text-[15px] leading-5", sm: "text-[13px] leading-4" },
    },
    compoundVariants: [{ layout: "inline", class: "text-sm leading-5" }],
    defaultVariants: { layout: "card", size: "md" },
  },
);

/**
 * The unit after the value. Muted, and dimmer still while the ruler scrolls, when the
 * number is the part that's changing.
 */
export const scrubSliderUnitVariants = cva(
  "text-muted-foreground transition-[opacity] duration-(--duration-fast) ease-out group-data-[scrolling]/scrub-slider:opacity-50",
  {
    variants: { size: { md: "text-sm", sm: "text-xs" } },
    defaultVariants: { size: "md" },
  },
);

/**
 * The ruler. On the card it rises in and fades in on hover, after a chevron nudge
 * (`data-nudged`), and while active. On the way out it only fades and blurs; its rise is
 * undone after it has gone, not played backwards. `data-hovered` is never set while active,
 * so the two states don't compete. Inline, it is always shown, filling the row before the
 * value.
 */
export const scrubSliderRulerVariants = cva("pointer-events-none", {
  variants: {
    layout: {
      card: [
        "absolute",
        "translate-y-1 opacity-0 blur-[2px] transition-[opacity,filter,translate] duration-(--duration-slow) ease-out [transition-delay:0s,0s,var(--duration-slow)]",
        // Written out in full: Tailwind only generates classes it finds literally in the source.
        "group-data-[hovered]/scrub-slider:translate-y-0 group-data-[hovered]/scrub-slider:opacity-100 group-data-[hovered]/scrub-slider:blur-none group-data-[hovered]/scrub-slider:[transition-delay:0s]",
        "group-data-[nudged]/scrub-slider:translate-y-0 group-data-[nudged]/scrub-slider:opacity-100 group-data-[nudged]/scrub-slider:blur-none group-data-[nudged]/scrub-slider:[transition-delay:0s]",
        "group-data-[active]/scrub-slider:translate-y-0 group-data-[active]/scrub-slider:opacity-100 group-data-[active]/scrub-slider:blur-none group-data-[active]/scrub-slider:[transition-delay:0s]",
      ],
      inline: "relative order-first min-w-0 flex-1",
    },
    size: sizes,
  },
  compoundVariants: [
    { layout: "card", size: "md", class: "inset-x-4 bottom-1.5 h-4" },
    { layout: "card", size: "sm", class: "inset-x-3 bottom-1.5 h-3.5" },
    { layout: "inline", size: "md", class: "h-4" },
    { layout: "inline", size: "sm", class: "h-3.5" },
  ],
  defaultVariants: { layout: "card", size: "md" },
});

/**
 * The tick layer, faded at both ends so ticks scroll in and out rather than popping: over
 * 32px on the card, 12px on the shorter inline ruler. The ticks stay at 55% until the
 * slider is active.
 */
export const scrubSliderTicksVariants = cva(
  "absolute inset-0 opacity-55 transition-[opacity] duration-(--duration-slow) ease-out group-data-[active]/scrub-slider:opacity-100",
  {
    variants: {
      layout: {
        card: "[mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]",
        inline: "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]",
      },
    },
    defaultVariants: { layout: "card" },
  },
);

/**
 * One tick. While dragging, ticks follow the pointer directly; otherwise (keyboard steps,
 * values set from outside) they glide.
 */
export const scrubSliderTickVariants = cva(
  "absolute bottom-0 left-0 h-full w-px origin-bottom bg-foreground transition-[translate,scale,opacity] duration-(--duration-fast) ease-out group-data-[dragging]/scrub-slider:transition-none",
);

/**
 * The indicator, full height while active and half height at rest. On the card it shows
 * at rest only after a chevron nudge, gliding to the new value's tick; on hover alone the
 * ruler is a preview, without it. Leaving either state it only fades: the return to half
 * height waits until it has gone. Inline, it always shows, so a drag grows it from the
 * resting half height and a release shrinks it back. A `fixed` indicator is the ruler's
 * centre mark, so it shows whenever the ruler does, hover included.
 */
export const scrubSliderIndicatorVariants = cva(
  [
    "absolute bottom-0 left-0 h-full w-0.5 origin-bottom scale-y-50 rounded-full bg-foreground",
    "transition-[translate,opacity,scale] duration-(--duration-fast) ease-out",
    "group-data-[active]/scrub-slider:scale-y-100 group-data-[active]/scrub-slider:opacity-100 group-data-[active]/scrub-slider:[transition-delay:0s]",
    "group-data-[dragging]/scrub-slider:transition-[opacity,scale]",
  ],
  {
    variants: {
      layout: { card: "", inline: "" },
      indicator: { sliding: "", fixed: "" },
    },
    compoundVariants: [
      {
        layout: "card",
        indicator: "sliding",
        class: "opacity-0 [transition-delay:0s,0s,var(--duration-fast)] group-data-[nudged]/scrub-slider:opacity-100",
      },
      { layout: "inline", class: "opacity-100" },
      { indicator: "fixed", class: "opacity-100" },
    ],
    defaultVariants: { layout: "card", indicator: "sliding" },
  },
);

/**
 * The chevrons either side of the value. Quiet until hovered, faded at a bound, pressed in
 * slightly like any button, and dimmed while dragging or editing.
 */
export const scrubSliderStepperVariants = cva(
  [
    "pointer-events-auto inline-flex shrink-0 cursor-default items-center justify-center rounded-sm text-subtle-foreground outline-none",
    "transition-[color,opacity,scale] ease-out [transition-duration:var(--duration-fast),var(--duration-slow),var(--duration-fast)] hover:text-foreground active:scale-90",
    // Dims strongly while dragging, over the same slow token as the label row's lift, and
    // while the number is being typed.
    "group-data-[dragging]/scrub-slider:pointer-events-none group-data-[dragging]/scrub-slider:opacity-25",
    "group-data-[editing]/scrub-slider:pointer-events-none group-data-[editing]/scrub-slider:opacity-25",
    "aria-disabled:opacity-30 aria-disabled:hover:text-subtle-foreground aria-disabled:active:scale-100",
  ],
  {
    variants: {
      size: { md: "size-5 [&_svg]:size-3.5", sm: "size-4 [&_svg]:size-3" },
    },
    defaultVariants: { size: "md" },
  },
);

/** The number while it is being typed: the value's own text, taking input. */
export const scrubSliderInputVariants = cva(
  "pointer-events-auto m-0 min-w-[1ch] cursor-text border-0 bg-transparent p-0 text-right tabular text-foreground outline-none",
);

export type ScrubSliderVariants = VariantProps<typeof scrubSliderVariants>;
