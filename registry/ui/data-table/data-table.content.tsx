"use client";

import { Children, isValidElement, useEffect, type ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { DataTable as ComposedDataTable, DataTableHead, DataTableRow, TableHeader, TableBody, TableCell, TableCaption } from "./data-table.parts";
import { useDataTableContext, useDataTableOptions, type DataTableColumnMeta } from "./data-table.model";

export interface DataTableContentProps<TData extends RowData = RowData> {
  /** Caption and/or footer composition, rendered alongside the generated header and body. */
  children?: ReactNode;
  getRowLabel?: (row: TData) => string;
  rowActions?: (row: TData) => ReactNode;
}
export function DataTableContent<TData extends RowData>(props: DataTableContentProps<TData>) {
  const table = useDataTableContext<TData>();
  // Data and columns update through the provider; user interactions update the store.
  return <table.Subscribe selector={(state) => state}>{() => <ContentRows {...props} />}</table.Subscribe>;
}
function ContentRows<TData extends RowData>({ children, getRowLabel, rowActions }: DataTableContentProps<TData>) {
  const table = useDataTableContext<TData>();
  const options = useDataTableOptions();
  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const pageIndex = table.state.pagination.pageIndex;
  useEffect(() => {
    // A negative count means the server has not supplied the number of pages yet.
    if (pageCount >= 0 && pageIndex > Math.max(0, pageCount - 1)) table.setPageIndex(Math.max(0, pageCount - 1));
  }, [table, pageIndex, pageCount]);
  const extras = Children.toArray(children);
  const isCaption = (node: ReactNode) => isValidElement(node) && node.type === TableCaption;
  const selected = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  return (
    <ComposedDataTable
      {...options}
      columnLayouts={table.getVisibleLeafColumns().map((column) => {
        const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
        return { align: meta?.align, pinned: meta?.pinned };
      })}
      rows={rows.filter((row) => row.getCanSelect()).map((row) => row.id)}
      disabledRows={rows.filter((row) => !row.getCanSelect()).map((row) => row.id)}
      value={selected}
      onValueChange={(ids) => {
        // Preserve retained/off-page selections, then apply additions with the model's
        // per-row rule. This also covers shift ranges, drag ranges, and select-all.
        let next = ids.filter((id) => selected.includes(id));
        for (const id of ids) {
          if (selected.includes(id)) continue;
          const row = table.getRow(id);
          if (!row.getCanSelect()) continue;
          if (!row.getCanMultiSelect()) next = [];
          next.push(id);
        }
        table.setRowSelection(Object.fromEntries(next.map((id) => [id, true])));
        options.onValueChange?.(next);
      }}
      sort={undefined}
      sorting={table.state.sorting.map((sort) => ({ column: sort.id, direction: sort.desc ? "desc" : "asc" }))}
    >
      {extras.filter(isCaption)}
      <TableHeader>
        {table.getHeaderGroups().map((group) => <DataTableRow key={group.id}>
          {group.headers.map((header) => {
            const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
            return <DataTableHead key={header.id} colSpan={header.colSpan}
              align={meta?.align} pinned={meta?.pinned} className={meta?.className}
              onSort={header.column.getToggleSortingHandler()}
              sortKey={!header.isPlaceholder && header.column.getCanSort() && !header.subHeaders.length ? header.column.id : undefined}>
              {header.isPlaceholder ? null : <table.FlexRender header={header} />}
            </DataTableHead>;
          })}
        </DataTableRow>)}
      </TableHeader>
      <TableBody>
        {rows.map((row) => <DataTableRow key={row.id} value={row.id} disabled={!row.getCanSelect()}
          selectLabel={getRowLabel ? "Select " + getRowLabel(row.original) : "Select row " + row.id}
          actions={rowActions?.(row.original)}>
          {row.getVisibleCells().map((cell) => {
            const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
            const Cell = meta?.rowHeader ? DataTableHead : TableCell;
            return <Cell key={cell.id} align={meta?.align} pinned={meta?.pinned} className={meta?.className}>
              <table.FlexRender cell={cell} />
            </Cell>;
          })}
        </DataTableRow>)}
      </TableBody>
      {extras.filter((node) => !isCaption(node))}
    </ComposedDataTable>
  );
}
