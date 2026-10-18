import { cva, type VariantProps } from "class-variance-authority";

export const switchTrackVariants = cva([
  // The track is a flex row; the thumb is its only child. Toggling `justify` from
  // start to end is what moves the thumb, and the thumb's `layout` animation turns
  // that positional change into a slide.
  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5",
  "justify-start data-[checked]:justify-end",
  // Only the colour crossfades in CSS — the slide is Motion's, on transform.
  "transition-[background-color] duration-(--duration-base) ease-out",
  "bg-muted data-[checked]:bg-primary",
  // Hover lightens the track in both themes: the on-track to its hover token, the off-track
  // a step toward white (a fixed neutral, like the `fixed` thumb).
  "not-data-[disabled]:hover:bg-[color-mix(in_oklab,var(--color-muted),var(--color-white)_12%)]",
  "not-data-[disabled]:data-[checked]:hover:bg-primary-hover",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  // `data-[disabled]`, not `disabled:` — Base UI renders the switch as a non-native
  // button (a span with role=switch), and the `:disabled` pseudo-class only applies to
  // real form controls. Base UI marks the disabled state with a data attribute instead.
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
]);

export const switchThumbVariants = cva(
  [
    "pointer-events-none relative block size-4 rounded-full",
    // The fill change is a colour crossfade, not a snap — the thumb eases between its
    // two colours as it slides. The thumb's rounded visual pieces inherit this fill;
    // Motion only drives their transform when the pointer is held.
    "transition-[background-color] duration-(--duration-base) ease-out",
  ],
  {
    variants: {
      tone: {
        // The thumb inverts to stay in contrast with the track: light on the dark
        // (off) track, dark on the light-in-dark-mode primary (on) track. In dark
        // mode this reads as white-when-off, black-when-on. The ring defines its edge
        // against the light on-track.
        adaptive: "shadow-border bg-foreground data-[checked]:bg-primary-foreground",
        // Always dark. On the light on-track the ring defines its edge; off, the ring
        // is dropped so the dark thumb recedes into the dark track instead of being
        // outlined against it.
        fixed: "bg-neutral-950 shadow-border data-[unchecked]:shadow-none",
      },
    },
    defaultVariants: { tone: "adaptive" },
  },
);

export type SwitchVariants = VariantProps<typeof switchThumbVariants>;
