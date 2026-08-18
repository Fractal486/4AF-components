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
export const tableWrapperVariants = cva("w-full overflow-x-auto", {
  variants: {
    bordered: {
      true: "rounded-md border border-border",
      false: "",
    },
  },
  defaultVariants: { bordered: false },
});

/**
 * The `<table>` itself. `border-collapse` so the row rules meet cleanly at the cell
 * boundaries rather than doubling, and `caption-bottom` because a caption below the data
 * reads as a note about it, while one above competes with the column headers.
 */
export const tableVariants = cva("w-full caption-bottom border-collapse text-sm");

/**
 * Row density, and the only axis this component has. `md` is a comfortable reading table;
 * `sm` is the one you reach for when the point is to see many rows at once.
 */
export const tableRowVariants = cva([
  // A real border, not a shadow. The design foundation is explicit that table cells are
  // where borders belong: the job here is separation between rows, not lifting one off
  // the page.
  "border-b border-border",
  "transition-[background-color] duration-(--duration-fast) ease-out",
  // `not-data-[selected]` rather than trusting source order: a hover rule and a
  // data-attribute rule have identical specificity, so which one won a selected-and-hovered
  // row would come down to whatever order Tailwind happened to emit them in. Scoping the
  // hover out of the selected case settles it in the class list instead.
  "hover:not-data-[selected]:bg-muted/60",
  "data-[selected]:bg-muted",
]);

export const tableHeadVariants = cva(
  [
    // Muted and small: a column header names the data, it isn't part of it. `whitespace-nowrap`
    // because a wrapped header changes the height of the whole header row.
    "text-left align-middle font-medium whitespace-nowrap text-muted-foreground",
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
    },
    defaultVariants: { size: "md", bordered: false },
  },
);

export const tableCellVariants = cva(["align-middle text-foreground"], {
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
 * The selection column. `w-px` collapses it to its content — a checkbox plus padding — so
 * it takes the narrowest column the table can give it and the data columns keep the rest.
 */
export const tableSelectCellVariants = cva("w-px align-middle", {
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
  },
  defaultVariants: { size: "md", bordered: false },
});

/**
 * The caption. A `<caption>` can only be a child of its table, so with a frame drawn it
 * necessarily sits inside one — which means it needs the padding the cells have, or it ends
 * up touching the border it is enclosed by.
 */
export const tableCaptionVariants = cva("mt-3 text-xs text-subtle-foreground", {
  variants: {
    bordered: {
      true: "px-3 pb-3",
      false: "",
    },
  },
  defaultVariants: { bordered: false },
});

export type TableVariants = VariantProps<typeof tableCellVariants>;
