"use client";

import { createContext, useContext } from "react";
import {
  columnFilteringFeature, columnVisibilityFeature, constructFilterFn, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, createTableHook, createTableHookContexts,
  filterFn_includesString, globalFilteringFeature, rowPaginationFeature, rowSelectionFeature,
  rowSortingFeature, sortFn_alphanumeric, sortFn_basic, sortFn_datetime, sortFn_text,
  tableFeatures, type RowData,
} from "@tanstack/react-table";
import type { DataTableProps } from "./data-table.parts";

/**
 * Text matches case-insensitively; a list keeps rows whose value is one of its entries.
 * List entries compare as strings, since a filter menu's option values are strings.
 */
const filterFn_match = constructFilterFn({
  filter: (value: unknown, filter: unknown) => Array.isArray(filter)
    ? filter.some((entry) => String(entry) === String(value ?? ""))
    : value != null && String(value).toLowerCase().includes(String(filter).toLowerCase()),
  autoRemove: (value: unknown) => value == null || value === "" || (Array.isArray(value) && value.length === 0),
});
const features = tableFeatures({
  rowSortingFeature, sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnFilteringFeature, globalFilteringFeature, filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, match: filterFn_match },
  rowPaginationFeature, paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature, columnVisibilityFeature,
});
const contexts = createTableHookContexts<typeof features>();
const hook = createTableHook({
  features, ...contexts, globalFilterFn: "includesString",
  defaultColumn: { sortDescFirst: false, filterFn: "match" },
});
export type UseDataTableOptions<TData extends RowData> = Parameters<typeof hook.useAppTable<TData>>[0];
export type DataTableInstance<TData extends RowData = RowData> = ReturnType<typeof hook.useAppTable<TData>>;
/** A stable data/column model with sorting, filtering, pagination and selection wired together. */
export function useDataTable<TData extends RowData>(options: UseDataTableOptions<TData>) {
  return hook.useAppTable<TData>({
    ...options,
    initialState: { ...options.initialState, pagination: { pageIndex: 0, pageSize: 10, ...options.initialState?.pagination } },
  });
}
export const createDataTableColumns = hook.createAppColumnHelper;
export const useDataTableContext = hook.useTableContext;
export interface DataTableColumnMeta {
  label?: string;
  align?: "start" | "center" | "end";
  pinned?: "start" | "end";
  rowHeader?: boolean;
  className?: string;
}
export function columnLabel(column: { id: string; columnDef: { header?: unknown; meta?: unknown } }) {
  return (column.columnDef.meta as DataTableColumnMeta | undefined)?.label
    ?? (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id);
}
export const DataTableOptionsContext = createContext<DataTableProps>({});
export function useDataTableOptions() { return useContext(DataTableOptionsContext); }
