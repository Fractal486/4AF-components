import { cva, type VariantProps } from "class-variance-authority";

export const switchTrackVariants = cva([
  "group/switch relative inline-flex h-5 w-9 shrink-0 touch-pan-y cursor-pointer items-center rounded-full px-0.5",
  // Only the colour crossfades in CSS — the slide is Motion's, on transform.
  "transition-[background-color] duration-(--duration-base) ease-out",
  "bg-muted data-[checked]:bg-primary",
  // Hover lightens the track in both themes: the on-track to its hover token, the off-track
  // a step toward white (a fixed neutral, like the `fixed` thumb).
  "not-data-[disabled]:hover:bg-[color-mix(in_oklab,var(--color-muted),var(--color-white)_12%)]",
  "not-data-[disabled]:data-[checked]:hover:bg-primary-hover",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "[&:is([aria-invalid=true],[data-invalid])]:ring-2 [&:is([aria-invalid=true],[data-invalid])]:ring-destructive",
  "data-[pending]:cursor-progress data-[readonly]:cursor-default",
  // `data-[disabled]`, not `disabled:` — Base UI renders the switch as a non-native
  // button (a span with role=switch), and the `:disabled` pseudo-class only applies to
  // real form controls. Base UI marks the disabled state with a data attribute instead.
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
]);

export const switchThumbVariants = cva(
  [
    "pointer-events-none absolute start-0.5 z-10 flex size-4 items-center justify-center rounded-full",
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
        adaptive: "shadow-border bg-foreground data-[checked]:bg-primary-foreground [&_[data-slot=loader]]:text-background data-[checked]:[&_[data-slot=loader]]:text-primary",
        // Always dark. On the light on-track the ring defines its edge; off, the ring
        // is dropped so the dark thumb recedes into the dark track instead of being
        // outlined against it.
        fixed: "bg-neutral-950 shadow-border data-[unchecked]:shadow-none [&_[data-slot=loader]]:text-neutral-50",
      },
    },
    defaultVariants: { tone: "adaptive" },
  },
);

export type SwitchVariants = VariantProps<typeof switchThumbVariants>;
