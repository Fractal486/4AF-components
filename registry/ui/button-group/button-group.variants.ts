import { cva, type VariantProps } from "class-variance-authority";

/**
 * Fields joined into the group: an Input (bare, or inside the wrapper its icon or action
 * adds), the SearchSelect input (always inside its wrapper), and the Select,
 * AlignedSelect, and DatePicker triggers.
 *
 * These are styled from the group rather than through the cloned `className`: a select
 * root renders no element to receive one, and a wrapped field puts `className` on the
 * inner input rather than on the wrapper that sits in the row. The rules match the group's
 * direct children by `data-slot`; the "box" (the element that draws the border) is either
 * that child or the input inside its wrapper.
 *
 * The selects, and a named DatePicker, render a hidden form `<input>` right after their
 * trigger, so a trigger can be the last control without being `:last-child`. "Not last"
 * is therefore "followed by something other than a bare input" — every 4AF field input
 * carries a `data-slot`, so only those hidden inputs are skipped.
 *
 * A field drops its own border for the group's outline and keeps only the hairlines on its
 * joined edges, in the divider colour. Focused or invalid, it gets its full border and ring
 * back and is raised over its neighbours like a focused button. These selectors outrank
 * the field's own rest and hover borders, so the fields need no group-specific code.
 */
const FIELD_CLASSES = [
  // A field always frames the group: a field without an edge doesn't read as one.
  "has-[>[data-slot=input],>[data-slot=input-wrapper],>[data-slot=search-select-field],>[data-slot=select-trigger],>[data-slot=aligned-select-trigger],>[data-slot=date-picker-trigger]]:shadow-border",
  // `:where` keeps the layout defaults at zero specificity, so a caller's own `flex-1`,
  // `basis-*`, or `min-w-*` on a field still wins.
  "[:where(&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]))]:min-w-0",
  "[&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):focus-within]:z-10",
  "[&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):is([aria-invalid=true],:has([aria-invalid=true]))]:z-[5]",
  // The wrapper carries the overlap; a cloned margin on the input inside it is undone.
  "[&>:is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input])]:m-0",
  // An offset ring paints page background over the neighbours, as on a button.
  "[&>:is([data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger])]:ring-offset-0",
  "[:is(&>:is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]),&>:is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input])):not(:focus,[aria-invalid=true])]:border-transparent",
];

const FIELD_HORIZONTAL_CLASSES = [
  // Text fields take the free width. Triggers size to the value they show, like a button
  // to its label: a `max-content` basis ignores their standalone `w-full` or panel width,
  // and follows the value as it changes. Both at zero specificity, as above.
  "[:where(&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field]))]:flex-1",
  "[:where(&>:is([data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]))]:flex-[0_0_max-content]",
  // The basis alone isn't enough: the group's own width is measured from each item's
  // `width`, so a DatePicker's fixed panel width (or Select's `w-full`) would size the group
  // wider than the row it lays out, leaving an empty framed strip at the end. This one has
  // to outrank the triggers' own width classes, so it is not in `:where`.
  "[&>:is([data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger])]:w-auto",
  "[&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):not(:first-child)]:-ms-px",
  "[:is(&>:not(:first-child):is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]),&>:not(:first-child):is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input]))]:rounded-s-none",
  "[:is(&>:is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):has(~:not(input:not([data-slot]))),&>:is([data-slot=input-wrapper],[data-slot=search-select-field]):has(~:not(input:not([data-slot])))>:is([data-slot=input],[data-slot=search-select-input]))]:rounded-e-none",
  "[:is(&>:not(:first-child):is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]),&>:not(:first-child):is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input])):not(:focus,[aria-invalid=true])]:border-s-border",
  "[:is(&>:is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):has(~:not(input:not([data-slot]))),&>:is([data-slot=input-wrapper],[data-slot=search-select-field]):has(~:not(input:not([data-slot])))>:is([data-slot=input],[data-slot=search-select-input])):not(:focus,[aria-invalid=true])]:border-e-border",
];

const FIELD_VERTICAL_CLASSES = [
  "[&>:is([data-slot=input],[data-slot=input-wrapper],[data-slot=search-select-field],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):not(:first-child)]:-mt-px",
  "[:is(&>:not(:first-child):is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]),&>:not(:first-child):is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input]))]:rounded-t-none",
  "[:is(&>:is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):has(~:not(input:not([data-slot]))),&>:is([data-slot=input-wrapper],[data-slot=search-select-field]):has(~:not(input:not([data-slot])))>:is([data-slot=input],[data-slot=search-select-input]))]:rounded-b-none",
  "[:is(&>:not(:first-child):is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]),&>:not(:first-child):is([data-slot=input-wrapper],[data-slot=search-select-field])>:is([data-slot=input],[data-slot=search-select-input])):not(:focus,[aria-invalid=true])]:border-t-border",
  "[:is(&>:is([data-slot=input],[data-slot=select-trigger],[data-slot=aligned-select-trigger],[data-slot=date-picker-trigger]):has(~:not(input:not([data-slot]))),&>:is([data-slot=input-wrapper],[data-slot=search-select-field]):has(~:not(input:not([data-slot])))>:is([data-slot=input],[data-slot=search-select-input])):not(:focus,[aria-invalid=true])]:border-b-border",
];

export const buttonGroupVariants = cva(
  [
    // `isolate` keeps the item that raises itself while focused from painting over
    // anything outside the group.
    "isolate inline-flex",
    ...FIELD_CLASSES,
  ],
  {
    variants: {
      orientation: {
        horizontal: ["flex-row", ...FIELD_HORIZONTAL_CLASSES],
        // Stretch is flex's default, and it's what's wanted: a vertical run of
        // buttons with different labels has to share one width or it isn't a group.
        vertical: ["flex-col", ...FIELD_VERTICAL_CLASSES],
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
        /** A pill group: its first and last buttons are pills with their inner ends
            flattened, so the outline rounds fully too. */
        full: "rounded-full",
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
