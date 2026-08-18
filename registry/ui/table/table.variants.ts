import { cva, type VariantProps } from "class-variance-authority";

/**
 * The scroll container, which is also where the outer frame lives when the table is
 * `bordered`.
 *
 * The frame is on the wrapper rather than the table for one reason: `border-collapse`
 * ignores `border-radius`, so a border on a collapsed table can only ever be a square one.
 * On the wrapper it rounds — and the wrapper already clips, because setting `overflow-x`
 * forces the other axis out of `visible` too, so the corners cut the cells cleanly.
 */
export const tableWrapperVariants = cva(
  [
    "w-full overflow-x-auto",
    // The library's thin scrollbar, same declaration the menu, dialog and select panels
    // use. `h-1.5` as well as `w-1.5`, because this is the first of them that can scroll
    // sideways and the webkit rule sizes each axis separately. Firefox reads the first two
    // properties and ignores the pseudo-elements.
    "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
    "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5",
    "[&::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
    "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground",
  ],
  {
    variants: {
      bordered: {
        true: "rounded-md border border-border",
        false: "",
      },
    },
    defaultVariants: { bordered: false },
  },
);

/**
 * The `<table>` itself.
 *
 * `border-separate` with zero spacing, not `border-collapse`, and the pinned header is the
 * whole reason. Collapsed borders belong to the *table*, not to the cells that appear to
 * carry them — so a sticky header cell travels without its edge, and the collapsed border
 * it left behind stays in flow as a sliver at the top of the scrollport with the rows
 * running through it. Separated borders belong to each cell and pin with it.
 *
 * The cost is that a `<tr>` can no longer draw anything: in this model borders on rows and
 * row groups are ignored outright. Every rule below therefore lives on the cells, and the
 * row is left owning only its background.
 */
export const tableVariants = cva("w-full border-separate border-spacing-0 text-sm");

/**
 * Row density, and the only axis this component has. `md` is a comfortable reading table;
 * `sm` is the one you reach for when the point is to see many rows at once.
 */
/**
 * The header row, which is the element that actually pins.
 *
 * `-top-px` rather than flush: a sticky element settling on a fractional boundary opens a
 * sub-pixel seam above itself that the rows behind show through, which is why the seam
 * flickers while scrolling. Overhanging leaves nothing to open.
 *
 * `z-20`, not `z-10`, because cell content routinely positions itself — a Badge's label sits
 * at `relative z-10` — and a tie is broken by source order, in `<tbody>`'s favour.
 *
 * Positioned either way: unpinned it still needs to be a containing block, or the selection
 * bar it holds would be laid out against the scroll container instead of against the row.
 */
export const tableHeaderRowVariants = cva("", {
  variants: {
    pinned: {
      true: "sticky -top-px z-20",
      false: "relative",
    },
  },
  defaultVariants: { pinned: false },
});

/**
 * The selection bar: an absolutely positioned cell laid over the labels, which stay in place
 * underneath it. Left padding clears the select-all column — 16px of checkbox between the
 * cell's own padding — so the count begins where the first label would.
 *
 * No fill of its own, so the labels can be seen crossing under it as they fade. The cells it
 * covers keep theirs, which is what stops the rows scrolling underneath a pinned header from
 * showing through — and is why the labels fade by their *content* rather than as whole cells:
 * a cell at `opacity: 0` takes its background and its borders with it.
 */
export const tableSelectionBarVariants = cva(
  [
    "absolute inset-0 flex items-center justify-between gap-3",
    "text-left text-xs font-medium text-foreground",
  ],
  {
    variants: {
      size: {
        sm: "pr-2.5 pl-9",
        md: "pr-3 pl-10",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const tableRowVariants = cva([
  // No transition. A row wash is feedback about where the cursor *is*, and easing it in
  // makes the pointer arrive before the answer does; the eye reads that as lag rather than
  // as polish. The colours below are quiet enough that there is nothing to soften anyway.
  //
  // A wash rather than a fill: white on hover, one step above it when selected. The
  // `bg-white/[…]` form states the colour exactly — `oklch(1 0 0)` *is* white — while
  // sidestepping the arbitrary-value parser that reads a bare `/` inside `bg-[oklch(…)]`
  // as an opacity modifier.
  //
  // Mirrored to black for the light theme, because white over a white surface is nothing at
  // all and a row that gives no feedback under the cursor reads as inert.
  //
  // `not-data-[selected]` rather than trusting source order: a hover rule and a
  // data-attribute rule have identical specificity, so which one won a selected-and-hovered
  // row would come down to whatever order Tailwind happened to emit them in. Scoping the
  // hover out of the selected case settles it in the class list instead.
  "hover:not-data-[selected]:bg-black/[0.01] dark:hover:not-data-[selected]:bg-white/[0.01]",
  "data-[selected]:bg-black/[0.02] dark:data-[selected]:bg-white/[0.02]",
]);

export const tableHeadVariants = cva(
  [
    // Muted and small: a column header names the data, it isn't part of it. `whitespace-nowrap`
    // because a wrapped header changes the height of the whole header row.
    "text-left align-middle font-medium whitespace-nowrap text-muted-foreground",
    // The row rule, on the cell because `border-separate` ignores it anywhere else.
    "border-b border-border",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3 text-xs",
      },
      /**
       * The vertical rule between columns, and it belongs to the cell's right edge. The last
       * cell in a row doesn't get one: the wrapper's frame is already drawn there, and a
       * second line on top of it reads heavier than the rest of the grid.
       */
      bordered: {
        true: "border-border not-last:border-r",
        false: "",
      },
      /**
       * A fill, and only a fill: the pinning itself is on the row now, because an overlay can
       * pin only if its containing block does — and the selection bar is that overlay. What
       * the cells still have to do is be opaque, since the rows travel underneath them.
       *
       * `bg-background` is the page's own ground; a table on a raised surface should pass its
       * fill through `className`.
       */
      pinned: {
        true: "bg-background",
        false: "",
      },
    },
    defaultVariants: { size: "md", bordered: false, pinned: false },
  },
);

/**
 * The contents of a column header, which fade out under the selection bar and back in when it
 * leaves. On the same clock as the bar's own animation, so the two cross rather than one
 * finishing before the other starts.
 */
export const tableHeadContentVariants = cva(
  "block transition-[opacity] duration-(--duration-slow) ease-out",
  {
    variants: {
      covered: {
        true: "opacity-0",
        false: "opacity-100",
      },
    },
    defaultVariants: { covered: false },
  },
);

export const tableCellVariants = cva(["border-b border-border align-middle text-foreground"], {
  variants: {
    size: {
      sm: "h-9 px-2.5 py-1.5",
      md: "h-12 px-3 py-2",
    },
    /**
     * The vertical rule between columns, and it belongs to the cell's right edge. The last
     * cell in a row doesn't get one: the wrapper's frame is already drawn there, and a
     * second line on top of it reads heavier than the rest of the grid.
     */
    bordered: {
      true: "border-border not-last:border-r",
      false: "",
    },
  },
  defaultVariants: { size: "md", bordered: false },
});

/**
 * The button a sortable column header wears. `inline-flex` rather than `flex`, because an
 * inline-level box is still placed by the cell's `text-align` — so a right-aligned numeric
 * column keeps its header against the right edge without the call site having to say so a
 * second time in flex terms.
 *
 * Both this and the chevron key off `aria-sort`, which lives on the `<th>`: that attribute
 * is defined for a column header, not for a button inside one, so the state is read from
 * the cell rather than duplicated onto the control.
 */
export const tableSortButtonVariants = cva([
  "inline-flex cursor-pointer items-center gap-1.5 rounded-sm align-middle select-none",
  "transition-[color] duration-(--duration-fast) ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  // The header stays muted until it is the one doing the sorting, and then it reads at full
  // strength: a bright chevron beside a muted label looks like a stray glyph rather than
  // like a column that is active.
  "group-aria-[sort=ascending]/sort:text-foreground",
  "group-aria-[sort=descending]/sort:text-foreground",
]);

/**
 * The chevron, dimmer than the label beside it so an unsorted column reads as *offering* a
 * sort rather than announcing one. Hovering the header lifts it to the label's weight —
 * that is the affordance — and sorting lifts it past that.
 */
export const tableSortChevronVariants = cva([
  "size-3.5 shrink-0",
  "transition-[color] duration-(--duration-fast) ease-out",
  "text-subtle-foreground group-hover/sort:text-muted-foreground",
  "group-aria-[sort=ascending]/sort:text-foreground",
  "group-aria-[sort=descending]/sort:text-foreground",
]);

/**
 * The selection column. `w-px` collapses it to its content — a checkbox plus padding — so
 * it takes the narrowest column the table can give it and the data columns keep the rest.
 */
export const tableSelectCellVariants = cva("w-px border-b border-border align-middle", {
  variants: {
    size: {
      sm: "px-2.5",
      md: "px-3",
    },
    /**
     * The vertical rule between columns, and it belongs to the cell's right edge. The last
     * cell in a row doesn't get one: the wrapper's frame is already drawn there, and a
     * second line on top of it reads heavier than the rest of the grid.
     */
    bordered: {
      true: "border-border not-last:border-r",
      false: "",
    },
    /** A fill, so rows travelling underneath don't show through. See `tableHeadVariants`. */
    pinned: {
      true: "bg-background",
      false: "",
    },
  },
  defaultVariants: { size: "md", bordered: false, pinned: false },
});

export type TableVariants = VariantProps<typeof tableCellVariants>;
