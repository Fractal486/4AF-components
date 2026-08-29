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
 * The actions column's reveal.
 *
 * On the contents, never on the cell: the column is `w-px` and sized by what it holds, so
 * hiding the cell itself would collapse the column and shift every other one each time the
 * pointer crossed a row.
 *
 * Opacity rather than `hidden` or `display: none`, because the control has to stay in the tab
 * order — visible focus inside the row is what brings it back for a keyboard user who can't
 * hover to find it.
 *
 * `focus-visible`, not `focus-within`, and the difference is the whole reason this is written
 * the long way. Dismissing the menu returns focus to the trigger, as it should; but a dismissal
 * by *pointer* restores that focus without the browser marking it visible. Keyed off
 * `focus-within`, a click anywhere outside the table left the ⋯ of whichever row you had last
 * opened stranded on screen — revealed by the focus, dimmed because nothing was hovering it.
 * `:has(*:focus-visible)` reveals it for the keyboard user and stays out of the pointer's way.
 *
 * Selection deliberately does *not* hold it up. Ticking a few rows would otherwise light up a
 * column of ⋯ buttons that have nothing to do with the bulk action being set up, and the noise
 * grows with the size of the selection. The pointer says which row you mean; the checkbox does
 * not.
 *
 * An open menu holds it up too, and that one is not a nicety: a menu portals its popup, so focus
 * leaves the row entirely — without this, moving the pointer off a row would fade out the very
 * trigger whose menu is standing open in front of you.
 *
 * The last clause is the one that matters most in practice. A pointer that can't hover has no
 * way to reveal anything, so on touch the column is simply always there.
 */
export const dataTableRowActionsVariants = cva([
  "flex items-center justify-end opacity-0",
  "transition-[opacity] duration-(--duration-fast) ease-out",
  "group-hover/row:opacity-100 group-has-focus-visible/row:opacity-100",
  "has-[[data-popup-open]]:opacity-100",
  "[@media(hover:none)]:opacity-100",
]);

/**
 * The row menu's trigger.
 *
 * Two separate signals, and conflating them is the mistake this exists to avoid: the *row's*
 * hover reveals the glyph, and the *glyph's* own hover lifts it. Button's `plain` variant is
 * `text-foreground`, so without this the ⋯ would arrive at full strength the instant the pointer
 * touched anywhere in the row — announcing itself as the thing you were reaching for when you
 * were most likely reaching past it.
 *
 * Muted on arrival, then foreground when the pointer is actually on it, when it takes focus, and
 * while its menu stands open.
 */
export const dataTableRowActionsTriggerVariants = cva([
  "text-muted-foreground transition-[color] duration-(--duration-fast) ease-out",
  "hover:text-foreground focus-visible:text-foreground",
  "data-[popup-open]:text-foreground",
]);
