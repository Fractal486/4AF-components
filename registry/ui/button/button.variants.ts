import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    // Layout. `relative` anchors both the loading spinner and the hit-area
    // pseudo-element below.
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center",
    "font-medium whitespace-nowrap select-none",

    // Icons: sized in one place, and made inert so a click always lands on the
    // button rather than on the SVG (which is what breaks `event.target` checks).
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",

    // Motion. Only `scale` and the colours actually change, so only those are
    // named — `transition-all` would have the browser watch every property, and
    // would animate things like padding on variant switches, which looks broken.
    // Scale composites on the GPU: no layout, no paint, no jank.
    "transition-[scale,background-color,box-shadow,color,opacity]",
    "duration-(--duration-fast) ease-out",

    // The press. 0.97 is deliberately small — enough to feel the button give
    // under the cursor, not enough to read as an animation. Pointer-down to
    // pixels-moving is ~1 frame, which is what makes it feel physical rather
    // than delayed.
    "enabled:active:scale-[0.97]",

    // Focus is a ring offset from the button, not a colour change: it stays
    // legible on every variant, including the ones that are already amber.
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",

    // A loading button *is* disabled (it must not be clicked twice), but it must
    // not look disabled — "working" and "unavailable" are different states and
    // dimming both to 50% collapses them into one. So the fade is scoped to
    // disabled-but-not-loading.
    "disabled:cursor-not-allowed disabled:not-data-[loading=true]:opacity-50",
    "data-[loading=true]:cursor-progress",
  ],
  {
    variants: {
      variant: {
        /** The default. Ink, not colour — colour is a signal, and most buttons
            are not the most important thing on the screen. */
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** The one action on the page worth spending the accent on. */
        brand: "bg-brand text-brand-foreground hover:bg-brand-hover",
        /** A shadow, not a border: it sits correctly on any background, including
            images and coloured surfaces, because it's built from transparency. */
        outline:
          "bg-surface text-foreground shadow-border hover:bg-muted hover:shadow-border-hover",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        link: "text-foreground underline decoration-border underline-offset-4 hover:decoration-current",
      },
      size: {
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs [&_svg]:size-3.5",
        md: "h-9 gap-2 rounded-md px-3.5 text-sm [&_svg]:size-4",
        lg: "h-11 gap-2 rounded-lg px-5 text-base [&_svg]:size-4",
        "icon-sm": "size-8 rounded-md [&_svg]:size-3.5",
        icon: "size-9 rounded-md [&_svg]:size-4",
        "icon-lg": "size-11 rounded-lg [&_svg]:size-4",
      },
    },
    compoundVariants: [
      // Optical alignment: an icon carries less visual mass than the box around
      // it, so equal padding makes it look like it's drifting toward the edge.
      // Shave 2px off whichever side the icon is on and the button re-centres.
      //
      // The `data-icon-*` attributes come from the component, not from CSS. They
      // have to: `:first-child`/`:last-child` only count *elements*, and a bare
      // text label is a text node — so in `<Button><Plus/>Save</Button>` the svg
      // is both the first and the last element child, and a pure-CSS rule can't
      // tell a leading icon from a trailing one.
      { size: "sm", class: "data-[icon-start]:ps-2.5 data-[icon-end]:pe-2.5" },
      { size: "md", class: "data-[icon-start]:ps-3 data-[icon-end]:pe-3" },
      { size: "lg", class: "data-[icon-start]:ps-4.5 data-[icon-end]:pe-4.5" },
      // A 32px control is below the 40px comfortable target, and an icon button
      // has no label to widen it. Extend the *hit area* with a pseudo-element
      // rather than the button: the target grows, the design doesn't.
      {
        size: ["sm", "icon-sm", "icon"],
        class:
          "after:absolute after:top-1/2 after:left-1/2 after:size-10 after:min-w-full after:-translate-1/2",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
