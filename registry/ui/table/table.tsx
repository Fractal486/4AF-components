"use client";

import { ChevronUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  tableCellVariants,
  tableHeadVariants,
  tableRowVariants,
  tableSelectCellVariants,
  tableSortButtonVariants,
  tableSortChevronVariants,
  tableVariants,
  tableWrapperVariants,
  type TableVariants,
} from "./table.variants";

/**
 * A table.
 *
 * There is no Base UI primitive here and there shouldn't be: `<table>` already carries
 * every semantic a data table needs — the row and column relationships, the header
 * associations, the announcement of position — and no headless library improves on HTML it
 * can only re-describe. What *is* a primitive is the Checkbox in the selection column,
 * which is Base UI's, indeterminate state and all.
 *
 * So the parts here are thin: they carry the design foundation's borders and density and
 * little else. The one thing this component genuinely owns is **selection**, because that
 * is the part a consumer would otherwise write again every time — the select-all that has
 * to go indeterminate when the selection is partial, and stay in step with rows checked
 * one at a time.
 *
 * The rows don't grow a cell for the checkbox: `selectable` on the root adds the column,
 * and each `TableRow` fills in its own cell on whichever side of the header line it finds
 * itself. Writing that cell by hand in every row is the version of this API where one row
 * eventually goes missing and the whole column shifts.
 *
 * `"use client"` covers the whole file, including the parts that hold no state. They would
 * be server components on their own, but the selection state has to live with them, and
 * splitting a table across two files to save a few bytes on `<td>` is the worse trade.
 */

export type TableSortDirection = "asc" | "desc";

export interface TableSort {
  /** The `sortKey` of the column doing the sorting. */
  column: string;
  direction: TableSortDirection;
}

interface TableContextValue {
  selectable: boolean;
  size: TableVariants["size"];
  bordered: TableVariants["bordered"];
  selected: readonly string[];
  allSelected: boolean;
  someSelected: boolean;
  selectAllLabel: string;
  sort: TableSort | null;
  toggleRow: (value: string, next: boolean) => void;
  toggleAll: (next: boolean) => void;
  toggleSort: (column: string) => void;
}

const TableContext = createContext<TableContextValue>({
  selectable: false,
  size: "md",
  bordered: false,
  selected: [],
  allSelected: false,
  someSelected: false,
  selectAllLabel: "Select all rows",
  sort: null,
  toggleRow: () => {},
  toggleAll: () => {},
  toggleSort: () => {},
});

/**
 * Which side of the header line a row is on. A row can't work this out from its own props —
 * a `<thead>` and a `<tbody>` hold identical `<tr>`s — so the section tells it, and the row
 * uses it to choose between a select-all `<th>`, a per-row `<td>`, and (in a footer) an
 * empty one that exists only to keep the columns lined up.
 */
type TableSection = "header" | "body" | "footer";

const TableSectionContext = createContext<TableSection>("body");

export interface TableProps extends Omit<ComponentProps<"table">, "className">, TableVariants {
  className?: string;
  /** Class for the scroll container the table sits in. */
  wrapperClassName?: string;
  /**
   * Draw the grid: a frame around the table and a rule between every pair of columns. The
   * row rules are there either way — this is the vertical half of the grid plus the edges.
   */
  bordered?: boolean;
  /** Add the checkbox column on the left. */
  selectable?: boolean;
  /**
   * The row values the select-all covers.
   *
   * Explicit rather than collected from the rows as they mount, and the difference shows up
   * the moment the table is paginated: select-all should apply to the page in front of you,
   * not to every row that exists, and only the caller knows which of those it is rendering.
   */
  rows?: readonly string[];
  /** Selected row values, controlled. */
  value?: readonly string[];
  /** Selected row values, uncontrolled. */
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** Names the select-all checkbox. */
  selectAllLabel?: string;
  /** The column doing the sorting, controlled. `null` is unsorted. */
  sort?: TableSort | null;
  /** The column doing the sorting, uncontrolled. */
  defaultSort?: TableSort | null;
  /**
   * Fired with the next state of the three-step cycle: ascending, descending, then back to
   * `null`. The table owns the control and the state; the rows are yours to order, because
   * only you know what the values in them actually are.
   */
  onSortChange?: (sort: TableSort | null) => void;
}

export function Table({
  className,
  wrapperClassName,
  size = "md",
  bordered = false,
  selectable = false,
  rows,
  value,
  defaultValue,
  onValueChange,
  selectAllLabel = "Select all rows",
  sort,
  defaultSort = null,
  onSortChange,
  children,
  ...props
}: TableProps) {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue ?? []);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : uncontrolled;

  const commit = useCallback(
    (next: string[]) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const toggleRow = useCallback(
    (rowValue: string, next: boolean) => {
      // Filtered rather than spliced, so a value that somehow got in twice cannot survive an
      // uncheck, and what is left keeps the order it was selected in.
      commit(next ? [...selected, rowValue] : selected.filter((item) => item !== rowValue));
    },
    [commit, selected],
  );

  // Memoised on `rows` itself: `rows ?? []` mints a new array every render, which would
  // give `toggleAll` a new identity every render, which would give the context a new one —
  // and re-render every cell in the table on every keystroke happening anywhere above it.
  const [uncontrolledSort, setUncontrolledSort] = useState<TableSort | null>(defaultSort);
  const sortIsControlled = sort !== undefined;
  const activeSort = sortIsControlled ? sort : uncontrolledSort;

  const toggleSort = useCallback(
    (column: string) => {
      // Three steps and then out: ascending, descending, unsorted. The third press has to
      // exist — without it a table can be sorted but never put back, and the order it was
      // authored in is usually meaningful.
      const next: TableSort | null =
        activeSort?.column !== column
          ? { column, direction: "asc" }
          : activeSort.direction === "asc"
            ? { column, direction: "desc" }
            : null;

      if (!sortIsControlled) setUncontrolledSort(next);
      onSortChange?.(next);
    },
    [activeSort, sortIsControlled, onSortChange],
  );

  const coverage = useMemo(() => rows ?? [], [rows]);
  const selectedCount = coverage.filter((row) => selected.includes(row)).length;
  const allSelected = coverage.length > 0 && selectedCount === coverage.length;
  const someSelected = selectedCount > 0;

  const toggleAll = useCallback(
    (next: boolean) => {
      if (next) {
        // A union, not a replacement: a selected row that is not on this page — the previous
        // page of a paginated table — is not the select-all's to throw away.
        commit([...selected, ...coverage.filter((row) => !selected.includes(row))]);
      } else {
        commit(selected.filter((item) => !coverage.includes(item)));
      }
    },
    [commit, coverage, selected],
  );

  const context = useMemo<TableContextValue>(
    () => ({
      selectable,
      size,
      bordered,
      selected,
      allSelected,
      someSelected,
      selectAllLabel,
      sort: activeSort,
      toggleRow,
      toggleAll,
      toggleSort,
    }),
    [
      selectable,
      size,
      bordered,
      selected,
      allSelected,
      someSelected,
      selectAllLabel,
      activeSort,
      toggleRow,
      toggleAll,
      toggleSort,
    ],
  );

  return (
    <TableContext.Provider value={context}>
      {/* The scroll container is not optional. A table sizes itself to its content and will
          push a page sideways rather than wrap, so something has to catch the overflow —
          and it has to be a wrapper, because `overflow` on the table doesn't apply to the
          table's own layout box. */}
      <div
        data-slot="table-wrapper"
        className={cn(tableWrapperVariants({ bordered }), wrapperClassName)}
      >
        <table
          data-slot="table"
          data-size={size}
          data-bordered={bordered || undefined}
          data-selectable={selectable || undefined}
          className={cn(tableVariants(), className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <TableSectionContext.Provider value="header">
      <thead data-slot="table-header" className={className} {...props} />
    </TableSectionContext.Provider>
  );
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody
        data-slot="table-body"
        // The last row's rule would otherwise land on the table's own bottom edge, where it
        // reads as a stray line under the data rather than as a separator between rows.
        className={cn("[&>tr:last-child]:border-0", className)}
        {...props}
      />
    </TableSectionContext.Provider>
  );
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <TableSectionContext.Provider value="footer">
      <tfoot
        data-slot="table-footer"
        className={cn("border-t border-border font-medium [&>tr]:border-0", className)}
        {...props}
      />
    </TableSectionContext.Provider>
  );
}

export interface TableRowProps extends ComponentProps<"tr"> {
  /**
   * What this row is called in the selection. A row in a selectable table needs one to be
   * selectable at all; a row without one still gets the column's empty cell, which is how a
   * "no results" row avoids knocking every column out of line.
   */
  value?: string;
  /**
   * Names this row's checkbox. Give it the row's subject — "Select Ada Lovelace" — because
   * "Select row" repeated down a column tells a screen reader user nothing about which row
   * they are on.
   */
  selectLabel?: string;
}

export function TableRow({
  className,
  value,
  selectLabel = "Select row",
  children,
  ...props
}: TableRowProps) {
  const {
    selectable,
    size,
    bordered,
    selected,
    allSelected,
    someSelected,
    selectAllLabel,
    toggleRow,
    toggleAll,
  } = useContext(TableContext);
  const section = useContext(TableSectionContext);
  const isSelected = value !== undefined && selected.includes(value);

  return (
    <tr
      data-slot="table-row"
      // `data-selected`, and deliberately not `aria-selected`: that attribute is only
      // meaningful on a row inside a `grid` or `treegrid`, and on a plain `table` row it is
      // invalid rather than merely unhelpful. The checkbox already announces the state,
      // which is the honest place for it to live.
      data-selected={isSelected || undefined}
      className={cn(tableRowVariants(), className)}
      {...props}
    >
      {selectable && section === "header" && (
        <th scope="col" className={tableSelectCellVariants({ size, bordered })}>
          <span className="flex items-center">
            <Checkbox
              size="sm"
              aria-label={selectAllLabel}
              checked={allSelected}
              // A partial selection is indeterminate, and pressing it from there checks —
              // which is what the control's own semantics say a press does, and what a
              // keyboard user has been told will happen. Clearing instead would be a
              // second, invisible rule.
              indeterminate={someSelected && !allSelected}
              onCheckedChange={toggleAll}
            />
          </span>
        </th>
      )}

      {selectable && section !== "header" && (
        <td className={tableSelectCellVariants({ size, bordered })}>
          {value !== undefined && (
            <span className="flex items-center">
              <Checkbox
                size="sm"
                aria-label={selectLabel}
                checked={isSelected}
                onCheckedChange={(next) => toggleRow(value, next)}
              />
            </span>
          )}
        </td>
      )}

      {children}
    </tr>
  );
}

export interface TableHeadProps extends ComponentProps<"th"> {
  /**
   * Makes the column sortable and names it in `TableSort.column`. Omit it for a column that
   * can't be ordered — an actions column, a thumbnail — and it stays a plain header.
   */
  sortKey?: string;
}

export function TableHead({
  className,
  scope = "col",
  sortKey,
  children,
  ...props
}: TableHeadProps) {
  const { size, bordered, sort, toggleSort } = useContext(TableContext);
  const reduceMotion = useReducedMotion();
  const active = sortKey !== undefined && sort?.column === sortKey;

  return (
    <th
      data-slot="table-head"
      scope={scope}
      // On the `<th>`, because that is where `aria-sort` is defined — for a column header,
      // not for a control inside one. The button and the chevron both read their state back
      // off it rather than carrying a second copy of it.
      aria-sort={
        sortKey === undefined
          ? undefined
          : active
            ? sort?.direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
      }
      className={cn(tableHeadVariants({ size, bordered }), sortKey && "group/sort", className)}
      {...props}
    >
      {sortKey === undefined ? (
        children
      ) : (
        <button
          type="button"
          data-slot="table-sort"
          className={tableSortButtonVariants()}
          onClick={() => toggleSort(sortKey)}
        >
          {children}
          {/* The Select trigger's chevron, down to the numbers: same spring, same
              reduced-motion collapse, so the two flip identically. Up is the resting pose
              here rather than down — an unsorted column is offering ascending, and the
              descending state is that same glyph turned over. */}
          <motion.span
            aria-hidden="true"
            className="inline-flex"
            animate={{ rotate: active && sort?.direction === "desc" ? 180 : 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
            }
          >
            <ChevronUp className={tableSortChevronVariants()} />
          </motion.span>
        </button>
      )}
    </th>
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  const { size, bordered } = useContext(TableContext);

  return (
    <td
      data-slot="table-cell"
      className={cn(tableCellVariants({ size, bordered }), className)}
      {...props}
    />
  );
}
