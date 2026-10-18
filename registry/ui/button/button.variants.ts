import { cva, type VariantProps } from "class-variance-authority";

/**
 * The inline space between a button's icon and label. Components that put their
 * content behind a wrapper (for example, DeleteButton's Morph) use this same
 * size-aware token instead of guessing at the gap again.
 */
export const buttonContentGap = cva("", {
  variants: {
    size: {
      xs: "gap-2",
      sm: "gap-2",
      md: "gap-2.5",
      lg: "gap-3",
      "icon-xs": "gap-0",
      "icon-sm": "gap-0",
      icon: "gap-0",
      "icon-lg": "gap-0",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const buttonVariants = cva(
  [
    // Layout. `relative` anchors both the loading spinner and the hit-area
    // pseudo-element below.
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center",
    "font-medium whitespace-nowrap select-none",

    // Icons: sized in one place, and made inert so a click always lands on the
    // button rather than on the SVG (which is what breaks `event.target` checks).
    // Each size gives the loader slot the same box as its icons. On its own the slot is
    // `1em`, which is 2px smaller than the icon at every size but `lg`, so a spinner
    // replacing an icon would visibly shrink.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",

    // Motion. Only `scale` and the colours actually change, so only those are
    // named — `transition-all` would have the browser watch every property, and
    // would animate things like padding on variant switches, which looks broken.
    // Scale composites on the GPU: no layout, no paint, no jank.
    //
    // Colour only. `scale` is deliberately absent: the press is a spring, driven by
    // Motion in button.tsx, because no cubic-bezier has weight. Leaving `scale` in this
    // list would put CSS and Motion in a fight over the same property.
    //
    // Hover keeps the fast expo curve, and should: a hover is a response to the cursor
    // and wants to feel immediate. Only the press wants mass.
    "transition-[background-color,box-shadow,color,opacity]",
    "duration-(--duration-fast) ease-out",

    // Hold every button on its own compositing layer, permanently.
    //
    // Motion promotes the element when the press starts and demotes it on release.
    // *Creating* a layer snaps the element's origin to whole device pixels, and
    // destroying it snaps back — so each press begins and ends with an instant ~1px
    // jump that no animation covers, worst at the edge furthest from the centre. It's
    // invisible on a bare label and obvious once there's an icon, because a glyph's
    // crisp strokes re-rasterize against the pixel grid.
    //
    // Promoting up front means that snap happens once, before first paint, and never
    // again. The cost is that text is antialiased in grayscale rather than subpixel for
    // the element's life — a hair lighter, but *consistently*, which is the whole point:
    // a permanent, invisible difference beats a transient, visible one.
    "will-change-transform",

    // Focus is a ring offset from the button, not a colour change: it stays
    // legible on every variant, including the coloured ones.
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
        /** A shadow, not a border: no layout cost, and being built from transparency
            it sits correctly on any background rather than only the one it was
            picked against. Hover moves the fill only — the outline holds still,
            because the fill already says "you're on it", and moving both is two
            signals for one event. */
        outline: "bg-surface text-foreground shadow-border hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        plain: "bg-transparent text-foreground hover:bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        link: "text-foreground underline decoration-border underline-offset-4 hover:decoration-current",
      },
      size: {
        xs: `h-6 ${buttonContentGap({ size: "xs" })} rounded-[6px] px-2.5 text-xs [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5`,
        sm: `h-[30px] ${buttonContentGap({ size: "sm" })} rounded-[6px] px-3 text-xs [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5`,
        md: `h-[34px] ${buttonContentGap({ size: "md" })} rounded-[8px] px-3.5 text-sm [&_svg]:size-4 [&_[data-slot=loader]]:size-4`,
        lg: `h-[38px] ${buttonContentGap({ size: "lg" })} rounded-[8px] px-5 text-base [&_svg]:size-4 [&_[data-slot=loader]]:size-4`,
        "icon-xs": "size-6 rounded-[6px] [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5",
        "icon-sm": "size-[30px] rounded-[6px] [&_svg]:size-3.5 [&_[data-slot=loader]]:size-3.5",
        icon: "size-[34px] rounded-[8px] [&_svg]:size-4 [&_[data-slot=loader]]:size-4",
        "icon-lg": "size-[38px] rounded-[8px] [&_svg]:size-4 [&_[data-slot=loader]]:size-4",
      },
      /** `rectangular` keeps the corner radius the size gives it; `pill` rounds the ends
          fully, which turns the square icon sizes into circles. Listed after `size` so
          the radius it sets is the one `cn` keeps. */
      shape: {
        rectangular: "",
        pill: "rounded-full",
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
      { size: "xs", class: "data-[icon-start]:ps-2 data-[icon-end]:pe-2" },
      { size: "sm", class: "data-[icon-start]:ps-2.5 data-[icon-end]:pe-2.5" },
      { size: "md", class: "data-[icon-start]:ps-3 data-[icon-end]:pe-3" },
      { size: "lg", class: "data-[icon-start]:ps-4.5 data-[icon-end]:pe-4.5" },
      // A compact control is below the 40px comfortable target, and an icon button
      // has no label to widen it. Extend the *hit area* with a pseudo-element
      // rather than the button: the target grows, the design doesn't.
      {
        size: ["xs", "sm", "icon-xs", "icon-sm", "icon"],
        class:
          "after:absolute after:top-1/2 after:left-1/2 after:size-10 after:min-w-full after:-translate-1/2",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "rectangular",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
