"use client";

import type { RowData } from "@tanstack/react-table";
import { cn } from "@/registry/lib/cn";
import { DataTable as ComposedDataTable, type DataTableProps as ComposedDataTableProps } from "./data-table.parts";
import { DataTableOptionsContext, type DataTableInstance } from "./data-table.model";
import { dataTableRootVariants } from "./data-table.variants";
import { DataTableAnnouncer } from "./data-table.controls";

export interface DataTableProps<TData extends RowData = RowData> extends ComposedDataTableProps {
  /** Omit to keep composing native rows yourself. Supply useDataTable's instance for data-driven parts. */
  table?: DataTableInstance<TData>;
  /** The outer wrapper around the toolbar, content and pagination in data mode. */
  containerClassName?: string;
}
export function DataTable<TData extends RowData>({ table, containerClassName, children, ...props }: DataTableProps<TData>) {
  if (!table) return <ComposedDataTable {...props}>{children}</ComposedDataTable>;
  return (
    <table.AppTable>
      <DataTableOptionsContext.Provider value={props}>
        <div data-slot="data-table" dir={props.dir} className={cn(dataTableRootVariants(), containerClassName)}>
          {children}
          <DataTableAnnouncer />
        </div>
      </DataTableOptionsContext.Provider>
    </table.AppTable>
  );
}
export { DataTableRow, DataTableHead, DataTableRowActions, TableBody, TableCaption, TableCell, TableFooter, TableHeader,
  type DataTableRowProps, type DataTableHeadProps, type DataTableRowActionsProps, type TableSort, type TableSortDirection } from "./data-table.parts";
export { useDataTable, useDataTableContext, createDataTableColumns,
  type UseDataTableOptions, type DataTableInstance, type DataTableColumnMeta } from "./data-table.model";
export { DataTableContent, type DataTableContentProps } from "./data-table.content";
export { DataTableToolbar, DataTableSearch, DataTableFilter, DataTableViewOptions, DataTablePagination,
  type DataTableFilterProps, type DataTableFilterOption, type DataTableSearchProps, type DataTableViewOptionsProps, type DataTablePaginationProps } from "./data-table.controls";
