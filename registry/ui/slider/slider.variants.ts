import { cva, type VariantProps } from "class-variance-authority";

/**
 * The slider's shape is two axes, the thumb (`bar`, `circle`, `knob`) and the size (`md`,
 * `sm`), and most of its classes depend on both, so they live in compound variants. The
 * pixel counterparts the positioning maths needs (thumb width, fill reach, tooltip offset)
 * stay beside that maths in `slider.tsx` and must change with these.
 */

const thumbs = { bar: "", circle: "", knob: "" };
const sizes = { md: "", sm: "" };

/**
 * The control: the pointer target the rail, ticks and thumb sit in. `knob` keeps its full
 * height as its rail thins, so the target does not shrink with it.
 */
export const sliderControlVariants = cva(
  "group relative flex w-full touch-none items-center select-none",
  {
    variants: {
      thumb: thumbs,
      size: sizes,
      // The bar is grabbed; the round thumbs are pushed along, so they point the way they
      // travel, which flips in RTL.
      cursor: {
        grab: "cursor-grab active:cursor-grabbing",
        "resize-ltr": "cursor-e-resize",
        "resize-rtl": "cursor-w-resize",
        disabled: "cursor-not-allowed opacity-50",
      },
    },
    compoundVariants: [
      { thumb: "circle", size: "md", class: "h-7" },
      { thumb: "circle", size: "sm", class: "h-6" },
      { thumb: "knob", size: "md", class: "h-5" },
      { thumb: "knob", size: "sm", class: "h-4" },
      { thumb: "bar", size: "md", class: "h-10" },
      { thumb: "bar", size: "sm", class: "h-8" },
    ],
    defaultVariants: { thumb: "bar", size: "md", cursor: "grab" },
  },
);

/**
 * The rail, clipped to its own shape so the fill rounds with it. `circle` and `bar` fill the
 * control; `knob` is a thin centred line (4px at md, 2px at sm) that its dot overhangs.
 */
export const sliderRailVariants = cva("absolute overflow-hidden bg-muted", {
  variants: {
    thumb: { bar: "inset-0 rounded-md", circle: "inset-0 rounded-full", knob: "rounded-full" },
    size: sizes,
  },
  compoundVariants: [
    { thumb: "knob", size: "md", class: "inset-x-0 top-1/2 h-1 -translate-y-1/2" },
    { thumb: "knob", size: "sm", class: "inset-x-0 top-1/2 h-0.5 -translate-y-1/2" },
  ],
  defaultVariants: { thumb: "bar", size: "md" },
});

/** The thumb's drawn shape, also the size of Base UI's hidden thumb under it. */
export const sliderThumbVariants = cva("", {
  variants: { thumb: thumbs, size: sizes },
  compoundVariants: [
    { thumb: "circle", size: "md", class: "size-5 rounded-full" },
    { thumb: "circle", size: "sm", class: "size-4 rounded-full" },
    { thumb: "knob", size: "md", class: "size-2.5 rounded-full" },
    { thumb: "knob", size: "sm", class: "size-2 rounded-full" },
    { thumb: "bar", size: "md", class: "h-4 w-0.5 rounded-full" },
    { thumb: "bar", size: "sm", class: "h-3 w-0.5 rounded-full" },
  ],
  defaultVariants: { thumb: "bar", size: "md" },
});

/**
 * The tick layer. Inset by the thumb's travel inset, so each tick lands where the thumb's
 * centre lands at that value; a single bar's `fader` marks run the full width instead, where
 * its fill's edge lands.
 *
 * The bar shows its marks only while it is in use (hovered, dragged, or its range input
 * keyboard-focused); at rest it is a rail and a fill. The slow token: an ambient change the
 * hand didn't ask for eases in rather than snapping with the cursor.
 */
export const sliderTicksVariants = cva("pointer-events-none absolute inset-y-0", {
  variants: {
    thumb: {
      bar: "opacity-0 transition-[opacity] duration-(--duration-slow) ease-out group-hover:opacity-100 group-data-[dragging-index]:opacity-100 group-has-[[type=range]:focus-visible]:opacity-100",
      circle: "",
      knob: "",
    },
    size: sizes,
    fader: { true: "inset-x-0", false: "" },
  },
  compoundVariants: [
    { thumb: "circle", size: "md", fader: false, class: "inset-x-3.5" },
    { thumb: "circle", size: "sm", fader: false, class: "inset-x-3" },
    { thumb: "knob", size: "md", fader: false, class: "inset-x-[5px]" },
    { thumb: "knob", size: "sm", fader: false, class: "inset-x-1" },
    { thumb: "bar", fader: false, class: "inset-x-2" },
  ],
  defaultVariants: { thumb: "bar", size: "md", fader: false },
});

/**
 * One tick. Round thumbs get dots; the bar, a thin vertical handle, gets hairlines in the
 * same family, read like a ruler: short marks, a taller one every few steps (`level` 1), the
 * tallest at the midpoint (`level` 2). The bar's marks sit quieter, since its rail already
 * has an outline and a fill.
 */
export const sliderTickVariants = cva("absolute top-1/2 -translate-y-1/2", {
  variants: {
    thumb: {
      bar: "rounded-none bg-foreground/10",
      circle: "size-1 -translate-x-1/2 rounded-full bg-foreground/25",
      knob: "size-1 -translate-x-1/2 rounded-full bg-foreground/25",
    },
    size: sizes,
    level: { 0: "", 1: "", 2: "" },
  },
  compoundVariants: [
    { thumb: "bar", size: "md", level: 0, class: "h-1.5" },
    { thumb: "bar", size: "md", level: 1, class: "h-2.5" },
    { thumb: "bar", size: "md", level: 2, class: "h-3.5" },
    { thumb: "bar", size: "sm", level: 0, class: "h-1" },
    { thumb: "bar", size: "sm", level: 1, class: "h-2" },
    { thumb: "bar", size: "sm", level: 2, class: "h-3" },
  ],
  defaultVariants: { thumb: "bar", size: "md", level: 0 },
});

/** The inline label and value row inside the bar, kept clear of the rail's rounded ends. */
export const sliderInlineVariants = cva(
  "pointer-events-none absolute inset-0 flex items-center gap-2 text-xs",
  {
    variants: { size: { md: "px-3", sm: "px-2.5" } },
    defaultVariants: { size: "md" },
  },
);

export type SliderVariants = VariantProps<typeof sliderControlVariants>;
