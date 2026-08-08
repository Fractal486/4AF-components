import { cva } from "class-variance-authority";

/**
 * One notch tighter than the button scale's `sm`, applied on top of it.
 *
 * A selection toolbar is read at a glance and then dismissed, so it should take as little
 * of the text it's covering as it can — 32px overall, against the 40px a bare `sm` button
 * in a `p-1` bar comes to. Only the box shrinks: the label stays `text-xs` and the glyph
 * stays 3.5, because a smaller bar is the point and smaller *text* is just harder to read.
 *
 * 24px rather than the 28px the height alone would allow, because the ghost variant's hover
 * fill is the button's whole box. At 28px in 2px of padding that fill runs almost to the
 * bar's edge and the two rectangles read as one smudged shape; at 24px in 4px it sits
 * inside the bar as a distinct chip. The bar's height is unchanged either way — the padding
 * grew by exactly what the button gave up.
 *
 * The icon-only case is caught by `data-size`, which Button writes onto the element — the
 * `icon-sm` variant sets width and height together, so the height alone can't be pulled in
 * without leaving a control that's wider than it is tall.
 */
export const selectionToolbarButtonVariants = cva(
  [
    "h-6 px-2.5",
    // The optical shave the button scale applies at `sm`, rescaled: 2px off whichever side
    // the icon is on, measured from this bar's padding rather than `sm`'s.
    "data-[icon-start]:ps-2 data-[icon-end]:pe-2",
    "data-[size^=icon]:size-6 data-[size^=icon]:px-0",
  ],
  {
    variants: {
      /**
       * Red ink on the same neutral hover, never the solid `destructive` fill — the call
       * the menu already makes for its destructive row, for the same reason. A 24px slab
       * of red inside a 32px bar is louder than the bar itself, and the bar is supposed to
       * be the quiet thing hovering over someone's text.
       *
       * `hover:text-destructive` is pinned because the ghost variant underneath moves its
       * text to `foreground` on hover, which would drain the red at the moment of the press.
       */
      tone: {
        default: "",
        destructive: "text-destructive hover:text-destructive",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

/**
 * The bar itself, and it is deliberately the Tooltip's material rather than the Popover's:
 * the same `bg-surface` fill, the same hairline-plus-drop-shadow, the same fast duration.
 * A selection toolbar is a transient annotation on the text you just selected — the thing
 * a tooltip is — not a panel you opened and will dismiss. Reusing the Popover's real
 * border and heavier lift would make it read as a much bigger commitment than it is.
 *
 * Radii are concentric: the `rounded-md` (7px) corners of the actions inside `p-1` (4px) of
 * padding want 11px, and `rounded-lg` (10px) is the token nearest it. A pixel tight rather
 * than a pixel loose, at a size where neither is visible.
 *
 * No `overflow-hidden`: a focus ring is drawn 2px outside its button and the padding is
 * only 4px, so clipping here would shave the ring on the first and last action.
 */
export const selectionToolbarVariants = cva([
  "z-50 flex w-fit max-w-[calc(100vw-2rem)] items-center gap-0.5 rounded-lg bg-surface p-1",
  "text-foreground outline-none",
  // A single faint 1px ring plus a soft drop shadow. rgba, not oklch, so the `/` alpha
  // can't trip Tailwind's arbitrary parser.
  "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.18)]",
  "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_14px_30px_-12px_rgba(0,0,0,0.6)]",
  // Scale grows from the edge nearest the selection — Base UI hands us
  // `--transform-origin` pointing there. `blur-0` is the resting filter so it interpolates
  // from blur(4px) rather than from `none`, which some browsers won't tween. Only these
  // properties change, so only these are named. Base UI holds the popup mounted through
  // the transition and unmounts on `transitionend`, which fires because a transition is set.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,translate,filter] duration-(--duration-fast) ease-out",
  // Entering, it rises the last 6px out of the text toward its resting place.
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[side=top]:data-[starting-style]:translate-y-1.5",
  "data-[side=bottom]:data-[starting-style]:-translate-y-1.5",
  // Leaving, it dissolves where it stands. No translate: reversing the entrance drags the
  // eye back to the text at the exact moment the bar has stopped being relevant, and the
  // selection underneath it is usually changing in the same frame.
  "data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
]);
