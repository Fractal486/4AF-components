"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { Button } from "@/registry/ui/button/button";
import { Input, type InputProps } from "@/registry/ui/input/input";
import { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectSortTrigger, SelectTrigger, SelectValue, type SelectSortTriggerProps } from "@/registry/ui/select/select";
import { columnLabel, useDataTableContext, useDataTableOptions } from "./data-table.model";
import { dataTableToolbarVariants, dataTablePaginationVariants, dataTablePaginationControlsVariants, dataTableSearchVariants } from "./data-table.variants";

export function DataTableToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="data-table-toolbar" className={cn(dataTableToolbarVariants(), className)} {...props} />;
}
export interface DataTableSearchProps extends Omit<InputProps, "value" | "defaultValue" | "onValueChange"> {
  /** Omit for whole-table search; name a column for an individual filter. */
  column?: string;
  clearLabel?: string;
}
export function DataTableSearch(props: DataTableSearchProps) {
  const table = useDataTableContext();
  return <table.Subscribe selector={(state) => [state.globalFilter, state.columnFilters]}>{() => <SearchField {...props} />}</table.Subscribe>;
}
function SearchField({ column, clearLabel = "Clear search", placeholder = "Search…", "aria-label": label = "Search table", onChange, onKeyDown, disabled, className, ref, ...props }: DataTableSearchProps) {
  const table = useDataTableContext();
  const { loading } = useDataTableOptions();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  const value = String((column ? table.getColumn(column)?.getFilterValue() : table.state.globalFilter) ?? "");
  const change = (value: string) => {
    if (column) table.getColumn(column)?.setFilterValue(value);
    else table.setGlobalFilter(value);
    table.setPageIndex(0);
  };
  return <div data-slot="data-table-search" className={dataTableSearchVariants()}><Input ref={mergedRef} type="search" className={className}
    placeholder={placeholder} aria-label={label} disabled={disabled || loading} value={value} startIcon={<Search />}
    endAction={value ? <Button size="icon-xs" variant="plain" aria-label={clearLabel} disabled={disabled || loading}
      onClick={() => { change(""); inputRef.current?.focus(); }}><X /></Button> : undefined}
    onChange={(event) => { onChange?.(event); if (!event.defaultPrevented) change(event.currentTarget.value); }}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && event.key === "Escape" && value) { event.preventDefault(); event.stopPropagation(); change(""); }
    }} {...props} /></div>;
}
export interface DataTableViewOptionsProps extends SelectSortTriggerProps {
  groupLabel?: string;
  getLabel?: (column: ReturnType<ReturnType<typeof useDataTableContext>["getAllLeafColumns"]>[number]) => ReactNode;
}
export function DataTableViewOptions(props: DataTableViewOptionsProps) {
  const table = useDataTableContext();
  return <table.Subscribe selector={(state) => state.columnVisibility}>{() => <ViewOptions {...props} />}</table.Subscribe>;
}
/** A multiple Select over the hideable columns; the last visible column cannot be unchecked. */
function ViewOptions({ label = "View", groupLabel = "Columns", getLabel = columnLabel, icon = <SlidersHorizontal />, showValue = false, disabled, ...props }: DataTableViewOptionsProps) {
  const table = useDataTableContext();
  const { size = "sm", loading } = useDataTableOptions();
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const shown = columns.filter((column) => column.getIsVisible()).map((column) => column.id);
  const visible = table.getVisibleLeafColumns().length;
  return <Select<string, true> multiple size={size ?? undefined} value={shown} disabled={disabled || loading || !columns.length}
    items={columns.map((column) => ({ value: column.id, label: getLabel(column) }))}
    onValueChange={(ids) => { const next = new Set(ids); columns.forEach((column) => column.toggleVisibility(next.has(column.id))); }}>
    {/* A combobox is not named by its contents, so the visible label names it. */}
    <SelectSortTrigger label={label} icon={icon} showValue={showValue} aria-label={typeof label === "string" ? label : undefined} {...props} />
    <SelectContent align="end" data-slot="data-table-view-options">
      <SelectGroup><SelectGroupLabel>{groupLabel}</SelectGroupLabel>
        {columns.map((column) => <SelectItem key={column.id} value={column.id}
          disabled={visible === 1 && column.getIsVisible()}>{getLabel(column)}</SelectItem>)}
      </SelectGroup>
    </SelectContent>
  </Select>;
}
export interface DataTableFilterOption {
  value: string;
  label?: ReactNode;
}
export interface DataTableFilterProps extends SelectSortTriggerProps {
  /** The column to filter. */
  column: string;
  /** Omit to list the column's distinct values. */
  options?: readonly DataTableFilterOption[];
  clearLabel?: ReactNode;
}
export function DataTableFilter(props: DataTableFilterProps) {
  const table = useDataTableContext();
  return <table.Subscribe selector={(state) => state.columnFilters}>{() => <Filter {...props} />}</table.Subscribe>;
}
/** A multiple Select on the sort/filter trigger; the column keeps rows matching any checked value. */
function Filter({ column: id, options: provided, label, clearLabel, disabled, ...props }: DataTableFilterProps) {
  const table = useDataTableContext();
  const { size = "sm", loading } = useDataTableOptions();
  const column = table.getColumn(id);
  const name = label ?? (column ? columnLabel(column) : id);
  const raw = column?.getFilterValue();
  const selected = Array.isArray(raw) ? raw.map(String) : [];
  const options: readonly DataTableFilterOption[] = provided ?? [...new Set(table.getCoreRowModel().rows.map((row) => String(row.getValue(id) ?? "")))]
    .filter(Boolean).sort().map((value) => ({ value }));
  return <Select<string, true> multiple size={size ?? undefined} value={selected} disabled={disabled || loading || !column}
    items={options.map((option) => ({ value: option.value, label: option.label ?? option.value }))}
    onValueChange={(values) => { column?.setFilterValue(values?.length ? values : undefined); table.setPageIndex(0); }}>
    <SelectSortTrigger label={name} aria-label={typeof name === "string" ? name : undefined} {...props} />
    <SelectContent clearable clearLabel={clearLabel} data-slot="data-table-filter">
      {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label ?? option.value}</SelectItem>)}
    </SelectContent>
  </Select>;
}
export interface DataTablePaginationProps extends ComponentProps<"div"> {
  pageSizes?: readonly number[];
  showSelection?: boolean;
  labels?: Partial<{ rowsPerPage: string; firstPage: string; previousPage: string; nextPage: string; lastPage: string }>;
  formatSelection?: (selected: number, total: number) => ReactNode;
  formatRows?: (total: number) => ReactNode;
  formatPage?: (page: number, count: number) => ReactNode;
}
const PAGE_SIZES = [10, 20, 50, 100];
const LABELS = { rowsPerPage: "Rows per page", firstPage: "First page", previousPage: "Previous page", nextPage: "Next page", lastPage: "Last page" };
export function DataTablePagination(props: DataTablePaginationProps) {
  const table = useDataTableContext();
  return <table.Subscribe selector={(state) => [state.pagination, state.rowSelection, state.globalFilter, state.columnFilters]}>{() => <Pagination {...props} />}</table.Subscribe>;
}
function Pagination({ pageSizes = PAGE_SIZES, showSelection, labels: overrides, formatSelection = (selected, total) => selected + " of " + total + " rows selected", formatRows = (total) => total + " rows", formatPage = (page, count) => "Page " + page + (count < 0 ? "" : " of " + count), className, ...props }: DataTablePaginationProps) {
  const table = useDataTableContext();
  const { size = "sm", selectable, loading } = useDataTableOptions();
  const labels = { ...LABELS, ...overrides };
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = table.getPageCount();
  const count = pageCount < 0 ? -1 : Math.max(1, pageCount);
  const total = table.options.manualPagination ? table.getRowCount() : table.getFilteredRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const sizes = [...new Set([...pageSizes.filter((size) => Number.isInteger(size) && size > 0), pageSize])].sort((a, b) => a - b);
  return <div data-slot="data-table-pagination" className={cn(dataTablePaginationVariants(), className)} {...props}>
    <span>{(showSelection ?? selectable) ? formatSelection(selected, total) : formatRows(total)}</span>
    <div className={dataTablePaginationControlsVariants()}>
      <Select size={size ?? "sm"} value={pageSize} onValueChange={(value) => { if (value !== null) table.setPageSize(value); }} disabled={loading} items={sizes.map((size) => ({ value: size, label: String(size) }))}>
        <SelectTrigger aria-label={labels.rowsPerPage} label={labels.rowsPerPage} variant="plain"><SelectValue /></SelectTrigger>
        <SelectContent>{sizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent>
      </Select>
      <span aria-live="polite" aria-atomic>{formatPage(pageIndex + 1, count)}</span>
      <span className="flex items-center gap-1">
        <Button variant="plain" size="icon-xs" aria-label={labels.firstPage} disabled={loading || !table.getCanPreviousPage()} onClick={() => table.firstPage()}><ChevronsLeft className="rtl:rotate-180" /></Button>
        <Button variant="plain" size="icon-xs" aria-label={labels.previousPage} disabled={loading || !table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeft className="rtl:rotate-180" /></Button>
        <Button variant="plain" size="icon-xs" aria-label={labels.nextPage} disabled={loading || !table.getCanNextPage()} onClick={() => table.nextPage()}><ChevronRight className="rtl:rotate-180" /></Button>
        <Button variant="plain" size="icon-xs" aria-label={labels.lastPage} disabled={loading || count < 0 || !table.getCanNextPage()} onClick={() => table.lastPage()}><ChevronsRight className="rtl:rotate-180" /></Button>
      </span>
    </div>
  </div>;
}
export function DataTableAnnouncer() {
  const table = useDataTableContext();
  return <table.Subscribe selector={(state) => [state.sorting, state.globalFilter, state.columnFilters]}>{() => <Announcer />}</table.Subscribe>;
}
function Announcer() {
  const table = useDataTableContext();
  const sorting = table.state.sorting;
  const sortKey = JSON.stringify(sorting);
  const filters = JSON.stringify([table.state.globalFilter ?? "", table.state.columnFilters]);
  const count = table.getFilteredRowModel().rows.length;
  const previous = useRef({ sortKey, filters });
  const [message, setMessage] = useState("");
  useEffect(() => {
    const before = previous.current;
    previous.current = { sortKey, filters };
    if (before.sortKey === sortKey && before.filters === filters) return;
    const text = before.sortKey !== sortKey
      ? (sorting.length ? "Sorted by " + sorting.map((item) => (table.getColumn(item.id) ? columnLabel(table.getColumn(item.id)!) : item.id) + ", " + (item.desc ? "descending" : "ascending")).join("; then ") : "Sorting cleared")
      : count + (count === 1 ? " result" : " results");
    const timer = setTimeout(() => setMessage(text), before.sortKey !== sortKey ? 0 : 400);
    return () => clearTimeout(timer);
  }, [table, sortKey, filters, count, sorting]);
  return <span data-slot="data-table-announcer" className="sr-only" role="status" aria-live="polite" aria-atomic>{message}</span>;
}
