"use client";

import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import {
  tableCellVariants,
  tableCaptionVariants,
  tableHeadVariants,
  tableHeaderRowVariants,
  tableRowVariants,
  tableVariants,
  tableWrapperVariants,
  type TableVariants,
} from "./table.variants";

/**
 * A table, and nothing more than a table.
 *
 * There is no Base UI primitive here and there shouldn't be: `<table>` already carries every
 * semantic a table needs — the row and column relationships, the header associations, the
 * announcement of position — and no headless library improves on HTML it can only
 * re-describe.
 *
 * So the parts here are thin by design. They own the design foundation's borders, densities,
 * the scroll container the table has to live in, the pinned header, and placeholder rows.
 * They own **no controls and no state**: nothing here sorts, selects, or opens a menu.
 *
 * That line is the whole point of the split. Selection is a state machine — a select-all that
 * goes indeterminate on a partial selection and stays in step with rows checked one at a
 * time — and sorting is a three-step cycle with a control and an `aria-sort` contract. Both
 * live in `data-table`, which composes these parts rather than reimplementing them. A table
 * that is only presenting rows should not have to carry either, or the Checkbox and Motion
 * they bring with them.
 *
 * `"use client"` covers the file because of the context these parts share. They hold no state
 * of their own.
 */

interface TableContextValue {
  size: TableVariants["size"];
  bordered: TableVariants["bordered"];
  stickyHeader: boolean;
  loading: boolean;
  loadingRows: number;
  columns: number;
  Row: ComponentType<ComponentProps<"tr">>;
}

const TableContext = createContext<TableContextValue>({
  size: "sm",
  bordered: false,
  stickyHeader: true,
  loading: false,
  loadingRows: 5,
  columns: 0,
  Row: TableRow,
});

/** The table's density, borders and pinning, for parts composing on top of these. */
export function useTableContext() {
  return useContext(TableContext);
}

/**
 * Which side of the header line a row is on. A row can't work this out from its own props —
 * a `<thead>` and a `<tbody>` hold identical `<tr>`s — so the section tells it. The base row
 * uses it to decide whether to pin; `DataTableRow` uses it to choose between a select-all
 * `<th>`, a per-row `<td>`, and (in a footer) an empty one that only keeps the columns lined
 * up.
 */
export type TableSection = "header" | "body" | "footer";

const TableSectionContext = createContext<TableSection>("body");

/** Whether the calling row is in the header, the body or the footer. */
export function useTableSection() {
  return useContext(TableSectionContext);
}

export interface TableProps extends Omit<ComponentProps<"table">, "className">, TableVariants {
  className?: string;
  /**
   * Row density. `sm` is the default because the usual reason to reach for a table is to see
   * many rows at once; `md` is the comfortable reading table you opt into.
   */
  size?: TableVariants["size"];
  /** Class for the scroll container the table sits in. */
  wrapperClassName?: string;
  /**
   * Draw the grid: a frame around the table and a rule between every pair of columns. The
   * row rules are there either way — this is the vertical half of the grid plus the edges.
   */
  bordered?: boolean;
  /**
   * Pin the header row to the top of the scroll container. It only has somewhere to pin to
   * once that container is bounded, so give it a height through `wrapperClassName`.
   */
  stickyHeader?: boolean;
  /**
   * Fill the body with placeholder rows instead of its children, and mark the table busy.
   * The header keeps its labels — the columns are known before the data is.
   */
  loading?: boolean;
  /** How many placeholder rows to draw. @default 5 */
  loadingRows?: number;
  /**
   * The component placeholder rows are built from. `DataTable` sets this to its own row so a
   * loading table still grows the checkbox and actions columns, and the placeholders line up
   * with the header instead of sitting one column to the left of it.
   *
   * @default TableRow
   */
  rowComponent?: ComponentType<ComponentProps<"tr">>;
}

export function Table({
  className,
  wrapperClassName,
  size = "sm",
  bordered = false,
  stickyHeader = true,
  loading = false,
  loadingRows = 5,
  rowComponent = TableRow,
  children,
  ...props
}: TableProps) {
  const columns = useMemo(() => countColumns(children), [children]);

  const flattenedChildren = useMemo(() => flattenChildren(children), [children]);
  const firstChild = flattenedChildren[0];
  const captionElement =
    isValidElement<ComponentProps<"caption">>(firstChild) && firstChild.type === TableCaption
      ? firstChild
      : null;
  const tableChildren = captionElement ? flattenedChildren.slice(1) : flattenedChildren;

  const context = useMemo<TableContextValue>(
    () => ({
      size,
      bordered,
      stickyHeader,
      loading,
      loadingRows,
      // Counted from the header the caller wrote, so a placeholder row is the same shape as a
      // real one. Gutter columns aren't in the tally: the row adds those cells itself.
      columns,
      Row: rowComponent,
    }),
    [size, bordered, stickyHeader, loading, loadingRows, columns, rowComponent],
  );

  return (
    <TableContext.Provider value={context}>
      <div data-slot="table-container" className="w-full">
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
            aria-busy={loading || undefined}
            className={cn(tableVariants(), className)}
            {...props}
          >
            {captionElement && (
              <caption
                data-slot="table-caption-native"
                {...captionElement.props}
                className="sr-only"
              />
            )}
            {tableChildren}
          </table>
        </div>
        {captionElement && (
          <div
            data-slot="table-caption"
            aria-hidden="true"
            className={cn(tableCaptionVariants({ size }), captionElement.props.className)}
          >
            {captionElement.props.children}
          </div>
        )}
      </div>
    </TableContext.Provider>
  );
}

/**
 * The semantic caption slot. Keep it as the first child of `Table`, just as a native
 * `<caption>` must be the first child of `<table>`; `caption-bottom` makes it render below.
 */
export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  const { size } = useContext(TableContext);

  return (
    <caption
      data-slot="table-caption"
      className={cn(tableCaptionVariants({ size }), className)}
      {...props}
    />
  );
}

/**
 * How many data columns the caller declared, read off the header they wrote.
 *
 * Inspecting children is a last resort, and it earns its place here: a placeholder row has to
 * be the same shape as a real one, and the only other way to know that is a `columns` prop
 * duplicating what the `TableHead`s already say. Fragments are flattened first, since a mapped
 * or conditional set of headers arrives wrapped in one. Gutter columns are deliberately not
 * counted — the row adds those cells itself, in placeholder rows as well as real ones.
 */
function countColumns(children: ReactNode): number {
  for (const child of flattenChildren(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child) || child.type !== TableHeader) continue;

    for (const row of flattenChildren(child.props.children)) {
      if (isValidElement<{ children?: ReactNode }>(row)) {
        return flattenChildren(row.props.children).length;
      }
    }
  }

  return 0;
}

function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
}

/**
 * Placeholder widths, cycled by column rather than drawn at random: a table rendered on the
 * server and again on the client has to produce the same markup, and `Math.random()` in a
 * skeleton is the quiet way to a hydration mismatch.
 */
const SKELETON_WIDTHS = ["w-24", "w-16", "w-28", "w-20"];

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <TableSectionContext.Provider value="header">
      <thead data-slot="table-header" className={className} {...props} />
    </TableSectionContext.Provider>
  );
}

export function TableBody({ className, children, ...props }: ComponentProps<"tbody">) {
  const { loading, loadingRows, columns, Row } = useContext(TableContext);

  return (
    <TableSectionContext.Provider value="body">
      <tbody
        data-slot="table-body"
        // The last row's rule would otherwise land on the table's own bottom edge, where it
        // reads as a stray line under the data rather than as a separator between rows.
        // Reached through the cells, since `border-separate` gives a `<tr>` nothing to drop.
        className={cn("[&>tr:last-child>*]:border-b-0", className)}
        {...props}
      >
        {loading
          ? Array.from({ length: loadingRows }, (_, row) => (
              // Built from the registered row, so in a DataTable these grow the same gutter
              // cells a real row does — empty, since there is nothing yet to select or act on.
              <Row
                key={`skeleton-${row}`}
                data-slot="table-skeleton-row"
                className="data-[slot=table-skeleton-row]:hover:bg-transparent dark:data-[slot=table-skeleton-row]:hover:bg-transparent"
              >
                {Array.from({ length: columns }, (_, column) => (
                  <TableCell key={column}>
                    <Skeleton
                      className={cn("h-4 max-w-full", SKELETON_WIDTHS[column % SKELETON_WIDTHS.length])}
                    />
                  </TableCell>
                ))}
              </Row>
            ))
          : children}
      </tbody>
    </TableSectionContext.Provider>
  );
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <TableSectionContext.Provider value="footer">
      <tfoot
        data-slot="table-footer"
        // Its cells carry the rule above the footer and drop the one below it, for the same
        // reason: in this border model a row group can't draw either.
        className={cn(
          // The footer's top rule is a boundary, same as the header's bottom one: it divides
          // totals from data. Only the top edge is lifted — the cells keep the separator tier
          // for their verticals.
          "font-medium [&>tr>*]:border-t-[1.5px] [&>tr>*]:border-t-border [&>tr>*]:border-b-0",
          className,
        )}
        {...props}
      />
    </TableSectionContext.Provider>
  );
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  const { stickyHeader } = useContext(TableContext);
  const section = useContext(TableSectionContext);

  return (
    <tr
      data-slot="table-row"
      className={cn(
        tableRowVariants(),
        section === "header" && tableHeaderRowVariants({ pinned: stickyHeader }),
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  const { size, bordered, stickyHeader } = useContext(TableContext);

  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(tableHeadVariants({ size, bordered, pinned: stickyHeader }), className)}
      {...props}
    />
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
