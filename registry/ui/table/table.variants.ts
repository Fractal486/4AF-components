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
export const tableVariants = cva("w-full border-separate border-spacing-0 caption-bottom text-sm");

/**
 * The composable native caption. `caption-bottom` on the table places it below the data while
 * the browser's native caption treatment keeps it centered.
 *
 * `text-xs`, matching the column headers rather than the data: both are meta-text *about* the
 * table, and a caption set at the body's own size competes with the rows it is describing. At
 * `text-sm` with a 16px gap this block stood 36px tall — one whole `sm` row — which is why it
 * read as an extra row hanging off the bottom rather than as a label.
 *
 * Only the gap scales with density. The type doesn't, for the same reason the header's doesn't:
 * meta-text has one size in this table, and it is the smaller one.
 */
export const tableCaptionVariants = cva("text-center text-xs text-muted-foreground", {
  variants: {
    size: {
      sm: "mt-2",
      md: "mt-3",
    },
  },
  defaultVariants: { size: "sm" },
});

/**
 * The header row, which is the element that actually pins.
 *
 * `top-0`, flush. It used to be `-top-px`, to overhang the sub-pixel seam a sticky element opens
 * above itself on a fractional scroll boundary — but a negative offset is not free: the header
 * sits in flow at scroll 0 and pins a pixel higher the moment you scroll, so it visibly hops up
 * and loses its top pixel on the first wheel notch. The seam is closed on the *cells* instead,
 * with a 1px background-coloured shadow above each one, which paints over the gap without moving
 * anything.
 *
 * `z-20`, not `z-10`, because cell content routinely positions itself — a Badge's label sits
 * at `relative z-10` — and a tie is broken by source order, in `<tbody>`'s favour.
 *
 * Positioned either way: unpinned it still needs to be a containing block, or an overlay laid
 * across it — DataTable's selection bar — would be positioned against the scroll container
 * instead of against the row.
 */
export const tableHeaderRowVariants = cva("", {
  variants: {
    pinned: {
      true: "sticky top-0 z-20",
      false: "relative",
    },
  },
  defaultVariants: { pinned: false },
});

export const tableRowVariants = cva([
  // Named, so a cell can react to the state of the row it sits in — which is how the
  // actions column reveals itself on hover without every cell in the row hearing about it.
  "group/row",
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

/**
 * Two tiers of rule, and the difference between them is what the eye reads as structure.
 *
 * A **boundary** — under the header, over the footer — is 1.5px at the full `border` token. It
 * divides one kind of content from another, and it is the only line in the table that should
 * announce itself.
 *
 * A **separator** — between rows, and between columns when `bordered` — is 1px at 60% of that
 * token. It is there to be followed along, not looked at. At full strength every line in the
 * table carried the same weight, so the header's rule read as one more row rule and the grid
 * flattened into a wireframe.
 *
 * Both are on the cells, because `border-separate` ignores borders anywhere else. The `bordered`
 * variants below deliberately don't restate a colour: the base owns it, so the vertical rules
 * inherit the separator tier and only the bottom edge is lifted to the boundary one.
 */
export const tableHeadVariants = cva(
  [
    // Muted and small: a column header names the data, it isn't part of it. `whitespace-nowrap`
    // because a wrapped header changes the height of the whole header row.
    "text-left align-middle font-medium whitespace-nowrap text-muted-foreground",
    // The boundary. `border-border/60` first, then the bottom edge back up to full: tailwind-merge
    // drops an earlier per-side colour when a later all-sides one lands, so the order is load-bearing.
    "border-border/60 border-b-[1.5px] border-b-border",
  ],
  {
    variants: {
      /**
       * `sm`'s header matches its row height rather than sitting a step under it. The header
       * carries the selection bar, and that bar holds `xs` Buttons at 24px — a 32px header left
       * them 4px of clearance, which reads as cramped beside the 16px select-all checkbox they
       * sit level with. At 36px the controls get 6px, and the label gets the same 10px of
       * breathing room the `md` header has.
       *
       * `md` keeps its header a step under its row: there is no clearance problem at that size,
       * and a header that reads as a band rather than as the first record is worth having where
       * the space allows it.
       */
      size: {
        sm: "h-9 px-2.5 text-xs",
        md: "h-9 px-3 text-xs",
      },
      /**
       * The vertical rule between columns, and it belongs to the cell's **leading** edge — the
       * cell that starts a new column draws the line that begins it. The first cell in a row
       * doesn't get one: the wrapper's frame is already drawn there, and a second line on top
       * of it reads heavier than the rest of the grid.
       *
       * Leading rather than trailing so a column can decline its own rule. On the trailing edge
       * the line before the actions column belonged to the last *data* cell, which had no way to
       * know what followed it — and `:last-child` was the selection bar's `<th>` anyway, so the
       * old `not-last` quietly stopped excluding the right cell as soon as a selection stood.
       */
      bordered: {
        true: "not-first:border-l",
        false: "",
      },
      /**
       * A fill, and only a fill: the pinning itself is on the row, because an overlay can pin
       * only if its containing block does. What the cells still have to do is be opaque,
       * since the rows travel underneath them.
       *
       * The shadow is that fill continued one pixel upwards. A sticky element on a fractional
       * scroll boundary opens a sub-pixel seam above itself for the rows behind to show
       * through; painting over it here rather than overhanging the row keeps the header from
       * hopping when scrolling starts.
       *
       * `bg-background` is the page's own ground; a table on a raised surface should pass its
       * fill through `className`.
       */
      pinned: {
        true: "bg-background shadow-[0_-1px_0_0_var(--color-background)]",
        false: "",
      },
    },
    defaultVariants: { size: "sm", bordered: false, pinned: false },
  },
);

export const tableCellVariants = cva(["border-b border-border/60 align-middle text-foreground"], {
  variants: {
    /**
     * `md` is the comfortable reading table, not a spacious one. At 48px it put 14px above and
     * below a 20px line, which is what made the header-to-row relationship look like a
     * different design at each density rather than one design at two scales. 44px gives 12px.
     */
    size: {
      sm: "h-9 px-2.5 py-1.5",
      md: "h-11 px-3 py-2",
    },
    /** The vertical rule, on the cell's leading edge. See `tableHeadVariants`. */
    bordered: {
      true: "not-first:border-l",
      false: "",
    },
  },
  defaultVariants: { size: "sm", bordered: false },
});

/**
 * A gutter column: a cell that holds a control rather than data. `w-px` collapses it to its
 * content — a checkbox or a menu button plus padding — so it takes the narrowest column the
 * table can give it and the data columns keep the rest.
 *
 * Deliberately not named for selection. The same cell is the checkbox column at the leading
 * edge and the actions column at the trailing one, and a placeholder row draws it empty at
 * both ends so a loading table keeps the shape of a loaded one.
 */
export const tableGutterCellVariants = cva("w-px border-border/60 align-middle", {
  variants: {
    /**
     * Which rule this cell draws. A gutter cell sits in the header and in the body, so it can't
     * take its weight from `pinned` — that axis is about `stickyHeader`, and a header row still
     * needs the boundary rule when the table isn't pinned at all.
     */
    section: {
      header: "border-b-[1.5px] border-b-border",
      body: "border-b",
    },
    size: {
      sm: "px-2.5",
      md: "px-3",
    },
    /**
     * A gutter column draws no vertical rule, in either direction, and that is the point of
     * owning the leading edge: the checkbox column doesn't need one because it is already
     * against the frame, and the actions column shouldn't have one because there is nothing
     * behind it to divide — the ⋯ is hidden until the row is hovered, so the rule would be
     * fencing off an empty strip.
     */
    bordered: {
      true: "",
      false: "",
    },
    /**
     * A fill, so rows travelling underneath don't show through, plus the pixel of it above that
     * closes the sticky seam. See `tableHeadVariants`.
     */
    pinned: {
      true: "bg-background shadow-[0_-1px_0_0_var(--color-background)]",
      false: "",
    },
  },
  defaultVariants: { section: "body", size: "sm", bordered: false, pinned: false },
});

export type TableVariants = VariantProps<typeof tableCellVariants>;
