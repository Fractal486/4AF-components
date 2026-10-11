"use client";

import { ChevronUp, ChevronsUpDown, Ellipsis } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  useTableContext,
  useTableSection,
  type TableProps,
} from "@/registry/ui/table/table";
// `ui/ui/` is not a typo: a sibling `.variants` file is imported through the alias in
// `tsconfig.json` so the registry build rewrites it to `@/components/ui/table.variants` in the
// target project. The plain `@/registry/ui/table/…` form resolves here and installs broken.
import { tableGutterCellVariants } from "@/registry/ui/ui/table.variants";
import {
  dataTableHeadContentVariants,
  dataTableRowActionsTriggerVariants,
  dataTableRowActionsVariants,
  dataTableSelectionBarVariants,
  dataTableSortButtonVariants,
  dataTableSortIconVariants,
} from "./data-table.variants";

/**
 * Selection, three-step sort controls, a selection action bar, and per-row actions,
 * composed from the presentational [table](../table/table.tsx) parts. This component owns
 * selection and sort state plus `aria-sort`; the caller orders the data.
 *
 * Set `selectable` and `actionColumn` on the root to add gutter cells consistently to
 * headers, body rows, and placeholders. Do not add those cells by hand.
 */

export type TableSortDirection = "asc" | "desc";

export interface TableSort {
  /** The `sortKey` of the column doing the sorting. */
  column: string;
  direction: TableSortDirection;
}

interface DataTableContextValue {
  selectable: boolean;
  selected: readonly string[];
  allSelected: boolean;
  someSelected: boolean;
  selectAllLabel: string;
  selectionBar: boolean;
  selectionActions: ReactNode;
  selectedCount: number;
  actionColumn: boolean;
  actionColumnLabel: string;
  sort: TableSort | null;
  toggleRow: (value: string, next: boolean) => void;
  toggleAll: (next: boolean) => void;
  toggleSort: (column: string) => void;
}

const DataTableContext = createContext<DataTableContextValue>({
  selectable: false,
  selected: [],
  allSelected: false,
  someSelected: false,
  selectAllLabel: "Select all rows",
  selectionBar: false,
  selectionActions: null,
  selectedCount: 0,
  actionColumn: false,
  actionColumnLabel: "Actions",
  sort: null,
  toggleRow: () => {},
  toggleAll: () => {},
  toggleSort: () => {},
});

export interface DataTableProps extends TableProps {
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
  /**
   * Turn the header row into an action row while anything is selected: the column labels
   * give way to a count, and `selectionActions` sits at the right end. Needs `selectable`.
   */
  selectionBar?: boolean;
  /** Buttons for the right end of the action row. */
  selectionActions?: ReactNode;
  /**
   * Add the per-row actions column on the right. On the root rather than inferred from the
   * rows, because the header and the placeholder rows have to grow the column too, and
   * neither of them can see what the body's rows were given.
   */
  actionColumn?: boolean;
  /**
   * Names the actions column for assistive technology. The header cell is visually empty —
   * a label over a column of icon buttons is noise — but an unnamed column is not.
   *
   * @default "Actions"
   */
  actionColumnLabel?: string;
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

export function DataTable({
  selectable = false,
  rows,
  value,
  defaultValue,
  onValueChange,
  selectAllLabel = "Select all rows",
  selectionBar = false,
  selectionActions,
  actionColumn = false,
  actionColumnLabel = "Actions",
  sort,
  defaultSort = null,
  onSortChange,
  children,
  ...tableProps
}: DataTableProps) {
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

  // Memoised on `rows` itself: `rows ?? []` mints a new array every render, which would give
  // `toggleAll` a new identity every render, which would give the context a new one — and
  // re-render every cell in the table on every keystroke happening anywhere above it.
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

  const context = useMemo<DataTableContextValue>(
    () => ({
      selectable,
      selected,
      allSelected,
      someSelected,
      selectAllLabel,
      selectionBar: selectionBar && selectable && selected.length > 0,
      selectionActions,
      // The whole selection, not just the part `rows` covers: with a page's worth of rows on
      // screen the count still has to speak for everything the user has picked.
      selectedCount: selected.length,
      actionColumn,
      actionColumnLabel,
      sort: activeSort,
      toggleRow,
      toggleAll,
      toggleSort,
    }),
    [
      selectable,
      selected,
      allSelected,
      someSelected,
      selectAllLabel,
      selectionBar,
      selectionActions,
      actionColumn,
      actionColumnLabel,
      activeSort,
      toggleRow,
      toggleAll,
      toggleSort,
    ],
  );

  return (
    <DataTableContext.Provider value={context}>
      <Table
        data-selectable={selectable || undefined}
        // So placeholder rows grow the same gutter cells a real row does and stay in column.
        rowComponent={DataTableRow}
        {...tableProps}
      >
        {children}
      </Table>
    </DataTableContext.Provider>
  );
}

export interface DataTableRowProps extends ComponentProps<"tr"> {
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
  /**
   * What goes in the actions column for this row — typically a `DropdownMenu` whose trigger is
   * an icon Button. Needs `actionColumn` on the root; without it there is no column to put
   * this in and it is ignored.
   */
  actions?: ReactNode;
}

export function DataTableRow({
  className,
  value,
  selectLabel = "Select row",
  actions,
  children,
  ...props
}: DataTableRowProps) {
  const { size, bordered, stickyHeader, loading } = useTableContext();
  const section = useTableSection();
  const {
    selectable,
    selected,
    allSelected,
    someSelected,
    selectAllLabel,
    selectionBar,
    selectionActions,
    selectedCount,
    actionColumn,
    actionColumnLabel,
    toggleRow,
    toggleAll,
  } = useContext(DataTableContext);
  const reduceMotion = useReducedMotion();
  const isSelected = value !== undefined && selected.includes(value);
  const isActionRow = section === "header" && selectionBar;

  return (
    <TableRow
      data-action-row={isActionRow || undefined}
      // Rows expose `data-selected` for styling; their checkboxes expose selection
      // to assistive technology.
      data-selected={isSelected || undefined}
      className={className}
      {...props}
    >
      {selectable && section === "header" && (
        <th
          scope="col"
          // Above the selection bar, which covers the rest of the row: the checkbox is how
          // the selection gets cleared, so it is the one control that must stay reachable.
          className={cn(
            tableGutterCellVariants({ section: "header", size, bordered, pinned: stickyHeader }),
            "relative z-10",
          )}
        >
          <span className="flex items-center">
            <Checkbox
              aria-label={selectAllLabel}
              // Nothing to select yet, and an indeterminate box over a body of placeholders
              // would be claiming otherwise.
              disabled={loading}
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
        <td
          className={tableGutterCellVariants({ section: "body", size, bordered })}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {value !== undefined && (
            <span className="flex items-center">
              <Checkbox
                aria-label={selectLabel}
                checked={isSelected}
                onCheckedChange={(next) => toggleRow(value, next)}
              />
            </span>
          )}
        </td>
      )}

      {children}

      {actionColumn && section === "header" && (
        <th
          scope="col"
          // Pointedly *not* `relative z-10`, unlike the select-all cell above. That cell lifts
          // itself over the selection bar because its checkbox is how the selection gets
          // cleared. This one holds nothing but a screen-reader label, and lifting it would
          // park an opaque empty box over the right end of the bar — which is exactly where
          // `selectionActions` sit. It stays under the bar and lets the actions through.
          className={tableGutterCellVariants({ section: "header", size, bordered, pinned: stickyHeader })}
        >
          {/* Visually empty — a label over a column of icon buttons is noise — but a column
              with no accessible name at all leaves the cells under it unexplained. */}
          <span className="sr-only">{actionColumnLabel}</span>
        </th>
      )}

      {actionColumn && section !== "header" && (
        <td
          className={tableGutterCellVariants({ section: "body", size, bordered })}
          // Same reasoning as the checkbox cell: opening a row's menu is not clicking the row,
          // and a table with a row-level handler shouldn't fire it on the way to the menu.
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {actions !== undefined && (
            <span data-slot="data-table-row-actions" className={dataTableRowActionsVariants()}>
              {actions}
            </span>
          )}
        </td>
      )}

      {/* Laid *over* the labels rather than replacing them: the columns keep their widths,
          nothing reflows as the selection comes and goes, and the bar has something to
          arrive on top of. An absolutely positioned cell is still a valid child of a row —
          it simply stops taking part in the column layout, which is the point. */}
      {section === "header" && (
        <AnimatePresence initial={false}>
          {isActionRow && (
            <motion.th
              key="selection-bar"
              data-slot="data-table-selection-bar"
              colSpan={Children.toArray(children).length || undefined}
              className={dataTableSelectionBarVariants({ size })}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              // The entrance run backwards, so the bar leaves the way it arrived and the
              // labels come back up through it.
              exit={{ opacity: 0, y: -8 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: duration.slow, ease: ease.out }
              }
            >
              {/* Polite, so the count is read after whatever the checkbox itself announced
                  rather than cutting across it. */}
              <span aria-live="polite">{selectedCount} selected</span>
              {selectionActions ? (
                <span data-slot="data-table-selection-actions" className="flex items-center gap-1">
                  {selectionActions}
                </span>
              ) : null}
            </motion.th>
          )}
        </AnimatePresence>
      )}
    </TableRow>
  );
}

export interface DataTableHeadProps extends ComponentProps<"th"> {
  /**
   * Makes the column sortable and names it in `TableSort.column`. Omit it for a column that
   * can't be ordered — a thumbnail, a status dot — and it stays a plain header that still
   * fades correctly under the selection bar.
   */
  sortKey?: string;
}

export function DataTableHead({ className, sortKey, children, ...props }: DataTableHeadProps) {
  const { loading } = useTableContext();
  const { selectionBar, sort, toggleSort } = useContext(DataTableContext);
  const reduceMotion = useReducedMotion();
  const active = sortKey !== undefined && sort?.column === sortKey;

  return (
    <TableHead
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
      // Covered by the selection bar, so out of the way entirely: a label that can still be
      // tabbed to and sorted from behind an opaque overlay is a control nobody can see.
      inert={selectionBar || undefined}
      aria-hidden={selectionBar || undefined}
      className={cn(sortKey && "group/sort", className)}
      {...props}
    >
      <span className={dataTableHeadContentVariants({ covered: selectionBar })}>
        {sortKey === undefined ? (
          children
        ) : (
          <button
            type="button"
            data-slot="data-table-sort"
            // The labels are known before the data is, so the header keeps them — but there
            // is nothing to order until the rows arrive.
            disabled={loading}
            className={dataTableSortButtonVariants()}
            onClick={() => toggleSort(sortKey)}
          >
            {children}
            {/* An unsorted column offers both directions. Once active, the chevron indicates
                the current direction; descending turns it over with the same spring and
                reduced-motion behavior as the rest of the table control. Returning to the
                unsorted icon is immediate, so the double-chevron never spins on the way in. */}
            <motion.span
              aria-hidden="true"
              className="inline-flex"
              animate={{ rotate: active && sort?.direction === "desc" ? 180 : 0 }}
              transition={
                reduceMotion || !active
                  ? { duration: 0 }
                  : { type: "spring", duration: 0.4, bounce: 0 }
              }
            >
              {active ? (
                <ChevronUp className={dataTableSortIconVariants()} />
              ) : (
                <ChevronsUpDown className={dataTableSortIconVariants()} />
              )}
            </motion.span>
          </button>
        )}
      </span>
    </TableHead>
  );
}

export interface DataTableRowActionsProps extends Omit<DropdownMenuContentProps, "children"> {
  /**
   * Names this row's menu, and required for that reason. "More actions" repeated down a column
   * tells a screen reader user nothing about which row they are on, so the label takes the
   * row's subject — `Actions for 4.2.0` — and the type is what makes you supply one.
   */
  label: string;
  /** The trigger's glyph. @default <Ellipsis /> */
  icon?: ReactNode;
  /** The menu's items. */
  children?: ReactNode;
}

/**
 * The row menu, as one control rather than five decisions.
 *
 * `actions` takes any node, so a row that wants two plain buttons or a link is free to pass
 * them. This is here for the case that is otherwise re-decided at every call site — the glyph,
 * the button size, the variant, the press wiring, the label — because a library that leaves
 * those to the caller has a different ⋯ button in every table within a month.
 *
 * The size follows the table's density rather than being a prop of its own: 24px in a compact
 * row, 30px in a comfortable one. Anything further from the default is a sign the row wants its
 * own trigger, which is what `actions` already allows.
 */
export function DataTableRowActions({
  label,
  icon,
  align = "end",
  children,
  ...props
}: DataTableRowActionsProps) {
  const { size } = useTableContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(triggerProps, state) => (
          <Button
            {...triggerProps}
            size={size === "sm" ? "icon-xs" : "icon-sm"}
            // Plain, not ghost: the glyph is already sitting in a row that washes on hover, and
            // a second surface under it reads as a control stacked on a control. The colour is
            // ours, because `plain` is `text-foreground` and the row's hover should reveal this
            // glyph without also lighting it up.
            variant="plain"
            className={dataTableRowActionsTriggerVariants()}
            // Base UI's own state, which is also what holds the reveal open: the trigger keeps
            // `data-popup-open` while the menu stands, and the cell reads it with `:has()`.
            pressed={state.open}
            // The menu opens on mousedown, which can interrupt Motion's pointer press as the
            // popup mounts. Drive the held scale off the state attribute instead.
            pressScale={false}
            aria-label={label}
          >
            {icon ?? <Ellipsis />}
          </Button>
        )}
      />
      <DropdownMenuContent align={align} {...props}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The layout parts are the base table's, unchanged, and re-exported so a data table is one
 * import. `DataTableRow` replaces `TableRow` and `DataTableHead` replaces `TableHead`; the
 * rest are the same components a plain table uses.
 *
 * Re-exported from the import above rather than with `export … from`, which the registry build
 * does not rewrite — it leaves the source path half-translated and the installed file fails to
 * resolve it.
 */
export { TableBody, TableCaption, TableCell, TableFooter, TableHeader };
