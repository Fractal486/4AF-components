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
 * Presentational semantic table parts: densities, borders, a scroll container, a pinned
 * header, and loading placeholders. Native table elements own row/header semantics.
 * Selection, sort controls, and row actions live in the companion
 * [data-table](../data-table/data-table.tsx), which composes these parts.
 *
 * `"use client"` is required for shared context; these parts hold no interactive state.
 */

interface TableContextValue {
  size: TableVariants["size"];
  outline: boolean;
  verticalLines: boolean;
  horizontalLines: boolean;
  stickyHeader: boolean;
  loading: boolean;
  loadingRows: number;
  columns: number;
  Row: ComponentType<ComponentProps<"tr">>;
}

const TableContext = createContext<TableContextValue>({
  size: "sm",
  outline: false,
  verticalLines: false,
  horizontalLines: true,
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

export interface TableProps
  extends Omit<ComponentProps<"table">, "className">,
    Pick<TableVariants, "size"> {
  className?: string;
  /**
   * Row density. `sm` is the default because the usual reason to reach for a table is to see
   * many rows at once; `md` is the comfortable reading table you opt into.
   */
  size?: TableVariants["size"];
  /** Class for the scroll container the table sits in. */
  wrapperClassName?: string;
  /** Draw a rounded frame around the table, on its scroll container. @default false */
  outline?: boolean;
  /** Draw a rule between every pair of columns. @default false */
  verticalLines?: boolean;
  /** Draw a rule between rows and under the header. @default true */
  horizontalLines?: boolean;
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
  outline = false,
  verticalLines = false,
  horizontalLines = true,
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
      outline,
      verticalLines,
      horizontalLines,
      stickyHeader,
      loading,
      loadingRows,
      // Counted from the header the caller wrote, so a placeholder row is the same shape as a
      // real one. Gutter columns aren't in the tally: the row adds those cells itself.
      columns,
      Row: rowComponent,
    }),
    [size, outline, verticalLines, horizontalLines, stickyHeader, loading, loadingRows, columns, rowComponent],
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
          className={cn(tableWrapperVariants({ outline }), wrapperClassName)}
        >
          <table
            data-slot="table"
            data-size={size}
            data-outline={outline || undefined}
            data-vertical-lines={verticalLines || undefined}
            data-horizontal-lines={horizontalLines || undefined}
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
  const { horizontalLines } = useContext(TableContext);

  return (
    <TableSectionContext.Provider value="footer">
      <tfoot
        data-slot="table-footer"
        // Its cells carry the rule above the footer and drop the one below it, for the same
        // reason: in this border model a row group can't draw either.
        className={cn(
          // The footer's top rule is the same separator as every other rule in the table, and
          // follows `horizontalLines` like them. Its rows are the header's height at both
          // densities: a totals row is meta-text about the data, like the header, not one more
          // record — so at `md` it doesn't take a data row's 44px.
          "font-medium [&>tr>*]:h-9 [&>tr>*]:border-b-0",
          horizontalLines && "[&>tr>*]:border-t",
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
  const { size, verticalLines, horizontalLines, stickyHeader } = useContext(TableContext);

  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        tableHeadVariants({
          size,
          horizontal: horizontalLines,
          vertical: verticalLines,
          pinned: stickyHeader,
        }),
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  const { size, verticalLines, horizontalLines } = useContext(TableContext);

  return (
    <td
      data-slot="table-cell"
      className={cn(
        tableCellVariants({ size, horizontal: horizontalLines, vertical: verticalLines }),
        className,
      )}
      {...props}
    />
  );
}
