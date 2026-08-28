import { cva, type VariantProps } from "class-variance-authority";

/**
 * The group, not the buttons, carries the outline.
 *
 * A Button's outline is `shadow-border` — a ring drawn *outside* its box. Two of those
 * side by side each extend a pixel past the seam, and where the two rings cross at the
 * top and bottom of the join they paint over each other: a doubled, brighter pixel at
 * each corner of every seam. It reads as a rendering artefact, because it is one.
 *
 * So exactly one element draws the ring — this one — and the buttons inside drop
 * theirs. The seams become real hairlines, which is the right material for them
 * anyway: a seam separates, it doesn't lift.
 */
export const buttonGroupVariants = cva(
  [
    // `isolate` keeps the item that raises itself while focused from painting over
    // anything outside the group.
    "isolate inline-flex",
  ],
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        // Stretch is flex's default, and it's what's wanted: a vertical run of
        // buttons with different labels has to share one width or it isn't a group.
        vertical: "flex-col",
      },
      /** Only an outlined run needs the ring; a filled one is its own edge. */
      framed: {
        true: "shadow-border",
        false: "",
      },
      /** Matches the radius the buttons' size gave them — the group holds no padding,
          so outer and inner radius are the same number. */
      radius: {
        md: "rounded-[6px]",
        lg: "rounded-[8px]",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      framed: false,
      radius: "md",
    },
  },
);

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;

/**
 * Applied to each child, computed from its place in the run.
 *
 * `seam` is what the join between two buttons is *made of*, and that depends on what
 * the buttons are: a hairline in the divider colour between outlined buttons, a
 * hairline of their own text colour on filled ones (`border` would disappear into an
 * ink or red fill), and nothing at all between quiet ones — a line there would be
 * louder than the buttons it was separating.
 */
export const buttonGroupItemVariants = cva(
  [
    // The group draws the ring now. Both classes survive `cn` — tailwind-merge reads
    // `shadow-border` as a shadow *colour* — but Tailwind emits `shadow-none` after
    // any themed shadow, so this is the one that lands.
    "shadow-none",

    // Small Buttons carry a 40px hit-area pseudo-element to lift them to a
    // comfortable target. In a group it does harm rather than good: the controls are
    // already contiguous, so there's no dead space left to reclaim, and two
    // neighbouring hit areas overlap — clicks near a seam land on whichever of the
    // two paints last, not on the one under the cursor.
    "after:content-none",

    // The focus ring has to clear its neighbours, and it can't do that from two
    // pixels away: an offset ring paints a band of page background *over* the button
    // beside it. Sitting on the edge and raising the item is the version that reads.
    "focus-visible:z-10 focus-visible:ring-offset-0",
  ],
  {
    variants: {
      orientation: {
        horizontal: "",
        vertical: "",
      },
      position: {
        first: "",
        middle: "rounded-none",
        last: "",
        only: "",
      },
      seam: {
        divider: "border-border",
        tint: "border-current/20",
        none: "",
      },
    },
    compoundVariants: [
      // Only the joined side loses its radius, so the outer corners keep whatever
      // radius the button's size gave them and the group stays concentric.
      { orientation: "horizontal", position: "first", class: "rounded-e-none" },
      { orientation: "horizontal", position: "last", class: "rounded-s-none" },
      { orientation: "vertical", position: "first", class: "rounded-b-none" },
      { orientation: "vertical", position: "last", class: "rounded-t-none" },

      // Every button after the first is pulled back a pixel, so it *overlaps* the one
      // before it rather than meeting it exactly.
      //
      // Buttons are sized by their labels, so their widths are fractional. Laid out
      // end to end, some boundary in a run of three or more lands mid-pixel, and the
      // browser rounds both sides away from it — leaving a sliver of the page showing
      // through at exactly one seam while every other seam looks right. A pixel of
      // overlap is wider than any rounding error, so there's nothing left to show
      // through. With the ring now on the group, a button draws nothing outside its
      // own box, so the overlap is invisible everywhere else.
      { orientation: "horizontal", position: ["middle", "last"], class: "-ms-px" },
      { orientation: "vertical", position: ["middle", "last"], class: "-mt-px" },

      // The hairline belongs to the second button of each pair, on its leading edge —
      // which the overlap parks exactly over the seam. A border sits inside the box,
      // so the only cost is the content of a joined button sitting half a pixel off
      // centre.
      {
        orientation: "horizontal",
        position: ["middle", "last"],
        seam: ["divider", "tint"],
        class: "border-s",
      },
      {
        orientation: "vertical",
        position: ["middle", "last"],
        seam: ["divider", "tint"],
        class: "border-t",
      },
    ],
    defaultVariants: {
      orientation: "horizontal",
      position: "only",
      seam: "none",
    },
  },
);

export type ButtonGroupItemVariants = VariantProps<typeof buttonGroupItemVariants>;
