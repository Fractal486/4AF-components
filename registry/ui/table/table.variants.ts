import { cva, type VariantProps } from "class-variance-authority";

/**
 * The scroll container, which is also where the outer frame lives when the table has an
 * `outline`.
 *
 * The frame is on the wrapper rather than the table for one reason: `border-collapse`
 * ignores `border-radius`, so a border on a collapsed table can only ever be a square one.
 * On the wrapper it rounds — and the wrapper is a Scroll Area root, which clips, so the corners
 * cut the cells cleanly.
 */
export const tableWrapperVariants = cva(
  "w-full",
  {
    variants: {
      outline: {
        true: "rounded-md border border-border",
        false: "",
      },
    },
    defaultVariants: { outline: false },
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
export const tableVariants = cva([
  "group/table w-full border-separate border-spacing-0 caption-bottom text-sm",
  "[--table-bg:var(--background)]",
  "in-data-[variant=card]:[--table-bg:var(--surface)]",
  "in-data-[slot=card]:[--table-bg:var(--surface)]",
  "in-data-[slot=hover-card-content]:[--table-bg:var(--surface)]",
  "in-data-[slot=popover-content]:[--table-bg:var(--surface-raised)]",
]);

export const tableEmptyRowVariants = cva(
  "data-[slot=table-empty-row]:hover:bg-transparent dark:data-[slot=table-empty-row]:hover:bg-transparent",
);

export const tableEmptyCellVariants = cva("h-24 text-center text-muted-foreground group-data-[wrap]/table:align-middle");

// Negative trailing margin removes the viewport-wide content from column sizing.
// The content still contributes its height, so rich empty states can grow the row.
export const tableEmptyContentVariants = cva("w-[var(--table-empty-width,100%)] me-[calc(-1*var(--table-empty-width,100%))] px-2.5 whitespace-normal text-center [transform:translateX(var(--table-empty-x,0px))]");

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
 * Header rows sit above pinned body cells, which in turn cover positioned cell content.
 *
 * Positioned either way: unpinned it still needs to be a containing block, or an overlay laid
 * across it — DataTable's selection bar — would be positioned against the scroll container
 * instead of against the row.
 */
export const tableHeaderRowVariants = cva("", {
  variants: {
    pinned: {
      true: "sticky top-0 z-30",
      false: "relative",
    },
  },
  defaultVariants: { pinned: false },
});

export const tableRowVariants = cva([
  // Named, so a cell can react to the state of the row it sits in — which is how the
  // actions column reveals itself on hover without every cell in the row hearing about it.
  "group/row",
  // The base row has no hover wash: a plain table is read, not acted on, and a row that
  // lights up under the cursor promises an action it doesn't have. DataTable adds the hover
  // (`tableInteractiveRowVariants`) for its selectable rows.
  //
  // Share an opaque mixed fill with pinned cells: a translucent cell would reveal the
  // columns moving behind it. DataTable sets data-selected; plain rows never set it.
  "[--table-row-bg:var(--table-bg)] bg-(--table-row-bg)",
  "data-[selected]:[--table-row-bg:color-mix(in_oklab,black_2%,var(--table-bg))]",
  "dark:data-[selected]:[--table-row-bg:color-mix(in_oklab,white_2%,var(--table-bg))]",
]);

/**
 * The hover wash for a row you can act on — DataTable's. No transition: a row wash is feedback
 * about where the cursor *is*, and easing it in makes the pointer arrive before the answer
 * does, which reads as lag rather than polish.
 *
 * `not-data-[selected]` rather than trusting source order: a hover rule and a data-attribute
 * rule have identical specificity, so which won a selected-and-hovered row would come down to
 * whatever order Tailwind emitted them in. Scoping the hover out of the selected case settles
 * it in the class list instead.
 */
export const tableInteractiveRowVariants = cva(
  "hover:not-data-[selected]:[--table-row-bg:color-mix(in_oklab,black_1%,var(--table-bg))] dark:hover:not-data-[selected]:[--table-row-bg:color-mix(in_oklab,white_1%,var(--table-bg))]",
);

/**
 * Every rule inside the table is a **separator**: 1px at 60% of the `border` token, there to be
 * followed along, not looked at. The rules under the header and above the footer use the same
 * quiet treatment as the rules between data rows.
 *
 * Which rules are drawn is three independent switches: `horizontalLines` (between rows and under
 * the header), `verticalLines` (between columns), and `outline` (the frame, on the wrapper).
 *
 * All of them are on the cells, because `border-separate` ignores borders anywhere else. The
 * variants below deliberately don't restate a colour: the base owns it.
 */
export const tableHeadVariants = cva(
  [
    // Column headings stay smaller and muted; wrapping comes from the shared cell layout.
    "align-middle font-medium text-muted-foreground group-data-[wrap]/table:align-middle",
    "border-border/60",
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
      /** The rule under the header, on the same separator tier as the rows. */
      horizontal: {
        true: "border-b",
        false: "",
      },
      /**
       * The vertical rule between columns, and it belongs to the cell's **leading** edge — the
       * cell that starts a new column draws the line that begins it. The first cell in a row
       * doesn't get one: that edge is the table's own, where the outline goes, and a second line
       * on top of it reads heavier than the rest of the grid.
       *
       * Leading rather than trailing so a column can decline its own rule. On the trailing edge
       * the line before the actions column belonged to the last *data* cell, which had no way to
       * know what followed it — and `:last-child` was the selection bar's `<th>` anyway, so the
       * old `not-last` quietly stopped excluding the right cell as soon as a selection stood.
       */
      vertical: {
        true: "not-first:border-s",
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
       * The table background follows its surrounding surface and can be overridden locally.
       */
      pinned: {
        true: "bg-(--table-bg) shadow-[0_-1px_0_0_var(--table-bg)]",
        false: "",
      },
    },
    defaultVariants: { size: "sm", horizontal: true, vertical: false, pinned: false },
  },
);

export const tableCellVariants = cva(["border-border/60 align-middle text-foreground"], {
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
    /** The rule between rows. */
    horizontal: {
      true: "border-b",
      false: "",
    },
    /** The vertical rule, on the cell's leading edge. See `tableHeadVariants`. */
    vertical: {
      true: "not-first:border-s",
      false: "",
    },
  },
  defaultVariants: { size: "sm", horizontal: true, vertical: false },
});

/**
 * A gutter column: a cell that holds a control rather than data. `w-px` collapses it to its
 * content — a checkbox or a menu button plus padding — so it takes the narrowest column the
 * table can give it and the data columns keep the rest.
 *
 * A gutter column draws no vertical rule, in either direction, and that is the point of owning
 * the leading edge: the checkbox column doesn't need one because it is already against the
 * table's edge, and the actions column shouldn't have one because there is nothing behind it to
 * divide — the ⋯ is hidden until the row is hovered, so the rule would fence off an empty strip.
 *
 * Deliberately not named for selection. The same cell is the checkbox column at the leading
 * edge and the actions column at the trailing one, and a placeholder row draws it empty at
 * both ends so a loading table keeps the shape of a loaded one.
 */
/** Sticky placement for a pinned cell; the offset is the caller's or the measured one. */
const PINNED_CELL = [
  "data-[pinned]:sticky data-[pinned]:z-20 data-[pinned]:bg-(--table-row-bg)",
  "data-[pinned=start]:start-[var(--table-pin-offset,var(--table-auto-pin-offset,0px))] data-[pinned=end]:end-[var(--table-pin-offset,var(--table-auto-pin-offset,0px))]",
  "data-[pinned]:has-focus-visible:z-25",
];

/** Gutter cells pin with the data column beside them, so a pinned edge keeps its checkbox or menu. */
export const tableGutterCellVariants = cva(["w-px border-border/60 align-middle", ...PINNED_CELL], {
  variants: {
    /** The rule under the cell, matching the data cells beside it, in the header or the body. */
    horizontal: {
      true: "border-b",
      false: "",
    },
    size: {
      sm: "px-2.5",
      md: "px-3",
    },
    /**
     * A fill, so rows travelling underneath don't show through, plus the pixel of it above that
     * closes the sticky seam. See `tableHeadVariants`.
     */
    pinned: {
      true: "bg-(--table-bg) shadow-[0_-1px_0_0_var(--table-bg)]",
      false: "",
    },
  },
  defaultVariants: { horizontal: true, size: "sm", pinned: false },
});

export type TableVariants = VariantProps<typeof tableCellVariants>;

/** Shared by data cells and row/column headings. Logical edges also work in RTL. */
export const tableCellLayoutVariants = cva([
  "text-start whitespace-nowrap",
  "group-data-[wrap]/table:whitespace-normal group-data-[wrap]/table:align-top",
  "group-data-[wrap]/table:text-pretty group-data-[wrap]/table:wrap-break-word",
  "data-[align=start]:text-start data-[align=center]:text-center data-[align=end]:text-end data-[align=end]:tabular-nums",
  "data-[align=left]:text-left data-[align=right]:text-right data-[align=justify]:text-justify",
  ...PINNED_CELL,
]);

/** The two masks intersect, just like Scroll Area. Opaque pinned regions sit outside
 * each horizontal fade; the fade grows with the content hidden behind their inner edges. */
export const tableViewportVariants = cva([
  "has-[[data-pinned]]:[mask-image:linear-gradient(to_bottom,black_var(--scroll-area-inset-top,0px),transparent_var(--scroll-area-inset-top,0px),black_calc(var(--scroll-area-inset-top,0px)_+_min(var(--scroll-area-overflow-y-start,0px),var(--scroll-area-fade))),black_calc(100%_-_min(var(--scroll-area-overflow-y-end,0px),var(--scroll-area-fade))),transparent),linear-gradient(to_right,black_var(--table-pinned-start,0px),transparent_var(--table-pinned-start,0px),black_calc(var(--table-pinned-start,0px)_+_min(var(--table-hidden-start,var(--scroll-area-overflow-x-start,0px)),var(--scroll-area-fade))),black_calc(100%_-_var(--table-pinned-end,0px)_-_min(var(--table-hidden-end,var(--scroll-area-overflow-x-end,0px)),var(--scroll-area-fade))),transparent_calc(100%_-_var(--table-pinned-end,0px)),black_calc(100%_-_var(--table-pinned-end,0px)))]",
  "rtl:has-[[data-pinned]]:[mask-image:linear-gradient(to_bottom,black_var(--scroll-area-inset-top,0px),transparent_var(--scroll-area-inset-top,0px),black_calc(var(--scroll-area-inset-top,0px)_+_min(var(--scroll-area-overflow-y-start,0px),var(--scroll-area-fade))),black_calc(100%_-_min(var(--scroll-area-overflow-y-end,0px),var(--scroll-area-fade))),transparent),linear-gradient(to_left,black_var(--table-pinned-start,0px),transparent_var(--table-pinned-start,0px),black_calc(var(--table-pinned-start,0px)_+_min(var(--table-hidden-start,var(--scroll-area-overflow-x-start,0px)),var(--scroll-area-fade))),black_calc(100%_-_var(--table-pinned-end,0px)_-_min(var(--table-hidden-end,var(--scroll-area-overflow-x-end,0px)),var(--scroll-area-fade))),transparent_calc(100%_-_var(--table-pinned-end,0px)),black_calc(100%_-_var(--table-pinned-end,0px)))]",
]);
