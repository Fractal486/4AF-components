import { cva } from "class-variance-authority";

/**
 * Everything the stateful table adds on top of the presentational one: the bar that covers
 * the header while rows are selected, the fade the labels do underneath it, the sort control,
 * and the actions column's hover reveal.
 *
 * The geometry these sit in — densities, gutter columns, the pinned header row that the bar
 * positions against — belongs to `table.variants.ts` and is imported, not restated.
 */

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
export const dataTableSelectionBarVariants = cva(
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
    defaultVariants: { size: "sm" },
  },
);

/**
 * The contents of a column header, which fade out under the selection bar and back in when it
 * leaves. On the same clock as the bar's own animation, so the two cross rather than one
 * finishing before the other starts.
 */
export const dataTableHeadContentVariants = cva(
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

/**
 * The button a sortable column header wears. `inline-flex` rather than `flex`, because an
 * inline-level box is still placed by the cell's `text-align` — so a right-aligned numeric
 * column keeps its header against the right edge without the call site having to say so a
 * second time in flex terms.
 *
 * Both this and the sort icon key off `aria-sort`, which lives on the `<th>`: that attribute
 * is defined for a column header, not for a button inside one, so the state is read from
 * the cell rather than duplicated onto the control.
 */
export const dataTableSortButtonVariants = cva([
  "inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] align-middle select-none",
  "transition-[color] duration-(--duration-fast) ease-out",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:cursor-default",
  // The header stays muted until it is the one doing the sorting, and then it reads at full
  // strength: a bright chevron beside a muted label looks like a stray glyph rather than
  // like a column that is active.
  "group-aria-[sort=ascending]/sort:text-foreground",
  "group-aria-[sort=descending]/sort:text-foreground",
]);

/**
 * The sort icon, dimmer than the label beside it so an unsorted column reads as *offering* a
 * sort rather than announcing one. Hovering the header lifts it to the label's weight —
 * that is the affordance — and sorting lifts it past that.
 */
export const dataTableSortIconVariants = cva([
  "size-3.5 shrink-0",
  "transition-[color] duration-(--duration-fast) ease-out",
  "text-subtle-foreground group-hover/sort:text-muted-foreground",
  "group-aria-[sort=ascending]/sort:text-foreground",
  "group-aria-[sort=descending]/sort:text-foreground",
]);

/**
 * Reveal actions on row hover, visible keyboard focus within the row, or an open menu.
 * Keep the open-menu condition because portal focus leaves the row. Use `focus-visible`
 * so pointer-restored focus alone does not reveal actions. Selection does not reveal them.
 *
 * Animate opacity on the contents, not the cell, to preserve column width and tab order.
 * Always show actions on devices without hover.
 */
export const dataTableRowActionsVariants = cva([
  "flex items-center justify-end opacity-0",
  "transition-[opacity] duration-(--duration-fast) ease-out",
  "group-hover/row:opacity-100 group-has-focus-visible/row:opacity-100",
  "has-[[data-popup-open]]:opacity-100",
  "[@media(hover:none)]:opacity-100",
]);

/**
 * The row's hover reveals the trigger in muted ink. The trigger's own hover, focus,
 * or open menu strengthens it to foreground ink.
 */
export const dataTableRowActionsTriggerVariants = cva([
  "text-muted-foreground transition-[color] duration-(--duration-fast) ease-out",
  "hover:text-foreground focus-visible:text-foreground",
  "data-[popup-open]:text-foreground",
]);
