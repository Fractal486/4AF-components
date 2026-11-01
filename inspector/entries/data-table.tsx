"use client";

import { Copy, Pin, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import {
  DataTable, DataTableContent, DataTableToolbar, DataTableSearch, DataTableFilter, DataTableViewOptions, DataTablePagination,
  DataTableHead, DataTableRow, DataTableRowActions, TableCaption, TableCell, TableFooter,
  useDataTable, useDataTableContext, createDataTableColumns, type DataTableColumnMeta,
} from "@/registry/ui/data-table/data-table";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/registry/ui/dropdown-menu/dropdown-menu";
import { bool, defineEntry, multi, select } from "../schema";

const SIZES = ["sm", "md"] as const;
const RELEASES = [
  { id: "4.2.0", version: "4.2.0", channel: "stable", downloads: 18_204, published: "12 Mar" },
  { id: "4.2.0-rc.1", version: "4.2.0-rc.1", channel: "preview", downloads: 942, published: "5 Mar" },
  { id: "4.1.3", version: "4.1.3", channel: "stable", downloads: 26_781, published: "18 Feb" },
  { id: "4.1.2", version: "4.1.2", channel: "stable", downloads: 9_310, published: "2 Feb" },
  { id: "4.1.1", version: "4.1.1", channel: "stable", downloads: 14_502, published: "21 Jan" },
  { id: "4.1.0", version: "4.1.0", channel: "stable", downloads: 31_044, published: "9 Jan" },
  { id: "4.1.0-beta.2", version: "4.1.0-beta.2", channel: "preview", downloads: 610, published: "2 Jan" },
  { id: "4.0.7", version: "4.0.7", channel: "stable", downloads: 22_118, published: "14 Dec" },
] as const;


const NUMBER = new Intl.NumberFormat("en-GB");
type Release = (typeof RELEASES)[number];
const DATA = [...RELEASES];
const EMPTY: Release[] = [];
const NO_FILTERS: { id: string; value: unknown }[] = [];
const helper = createDataTableColumns<Release>();
const getRowId = (release: Release) => release.id;
/** One release candidate stays unselectable, so the disabled row state is always on show. */
const DISABLED_ROW = "4.2.0-rc.1";
const CHANNELS = [{ value: "stable", label: "Stable" }, { value: "preview", label: "Preview" }];

export const dataTableEntry = defineEntry({
  slug: "data-table",
  name: "Data Table",
  controls: {
    size: select(SIZES, "sm"),
    wrap: bool(false, "Wrap text"),
    pinned: bool(false, "Pinned columns"),
    search: bool(true, "Search"),
    filters: bool(false, "Column filter"),
    visibility: bool(true, "Column visibility"),
    pagination: bool(true, "Pagination"),
    selectable: bool(true, "Checkbox column"),
    selectionBar: bool(true, "Selection action row", (values) => !values.selectable),
    actionColumn: bool(true, "Row actions column"),
    lines: multi(["horizontal", "vertical", "outline"], ["horizontal"], "Lines"),
    loading: bool(false, "Loading"),
    empty: bool(false, "Empty"),
    footer: bool(false, "Footer"),
    caption: bool(true, "Caption"),
  },
  render(values) { return <DataTableDemo {...values} />; },
});

function DataTableDemo({ size, wrap, pinned, search, filters, visibility, pagination, selectable, selectionBar, actionColumn, lines, loading, empty, footer, caption }: {
  size: "sm" | "md"; wrap: boolean; pinned: boolean;
  search: boolean; filters: boolean; visibility: boolean; pagination: boolean; selectable: boolean;
  selectionBar: boolean; actionColumn: boolean; lines: readonly string[]; loading: boolean; empty: boolean; footer: boolean; caption: boolean;
}) {
  const [query, setQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: unknown }[]>([]);
  const columns = useMemo(() => helper.columns([
    helper.accessor("version", { header: "Version", enableHiding: false, meta: { rowHeader: true, pinned: pinned ? "start" : undefined } }),
    helper.accessor("channel", { header: "Channel", cell: ({ getValue }) => <Badge size="sm" variant="outline" status={getValue() === "stable" ? "neutral" : "warning"}>{getValue()}</Badge> }),
    helper.accessor((release) => release.channel === "stable" ? "Maintenance fixes and performance improvements" : "Early access for compatibility testing", { id: "notes", header: "Notes", enableSorting: false }),
    helper.accessor("downloads", { header: "Downloads", cell: ({ getValue }) => NUMBER.format(getValue()), meta: { align: "end" } }),
    helper.accessor("published", { header: "Published", sortFn: (a, b) => DATA.indexOf(a.original) - DATA.indexOf(b.original), meta: { align: "end", pinned: pinned ? "end" : undefined } }),
  ]), [pinned]);
  const table = useDataTable({
    data: empty ? EMPTY : DATA, columns, getRowId,
    manualPagination: !pagination,
    state: { globalFilter: search ? query : "", columnFilters: filters ? columnFilters : NO_FILTERS },
    onGlobalFilterChange: setQuery,
    onColumnFiltersChange: setColumnFilters,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    enableRowSelection: (row) => row.id !== DISABLED_ROW,
  });
  return <div className="w-full max-w-xl self-start">
    <DataTable table={table} size={size} wrap={wrap} className={pinned ? "min-w-3xl" : undefined}
      selectable={selectable} selectionBar={selectionBar} actionColumn={actionColumn}
      outline={lines.includes("outline")} horizontalLines={lines.includes("horizontal")} verticalLines={lines.includes("vertical")}
      loading={loading}
      selectionActions={<><CopyButton size="xs" variant="ghost" value={() => table.getSelectedRowModel().rows.map((row) => row.original.version).join("\n")}>Copy</CopyButton><Button size="xs" variant="ghost" onClick={() => table.resetRowSelection(true)}>Clear</Button></>}>
      {(search || filters || visibility) && <DataTableToolbar>
        {search && <DataTableSearch placeholder="Search releases…" />}
        {filters && <DataTableFilter column="channel" options={CHANNELS} />}
        {visibility && <DataTableViewOptions className="ms-auto" />}
      </DataTableToolbar>}
      <DataTableContent<Release> getRowLabel={(release) => release.version} rowActions={(release) => <ReleaseActions release={release} />}>
        {caption && <TableCaption>Release history</TableCaption>}
        {footer && <ReleaseFooter />}
      </DataTableContent>
      {pagination && <DataTablePagination pageSizes={[5, 10, 20]} />}
    </DataTable>
  </div>;
}
function ReleaseFooter() {
  const table = useDataTableContext<Release>();
  return <table.Subscribe selector={(state) => [state.rowSelection, state.globalFilter, state.columnFilters, state.columnVisibility]}>{() => {
    const filtered = table.getFilteredRowModel().rows;
    const selected = filtered.filter((row) => row.getIsSelected());
    const counted = selected.length ? selected : filtered;
    const channels = new Set(counted.map((row) => row.original.channel)).size;
    const latest = DATA.find((release) => counted.some((row) => row.id === release.id))?.published;
    const summary: Record<string, React.ReactNode> = {
      version: selected.length ? selected.length + " selected" : counted.length + " releases",
      channel: channels + (channels === 1 ? " channel" : " channels"),
      notes: "Total downloads",
      downloads: NUMBER.format(counted.reduce((sum, row) => sum + row.original.downloads, 0)),
      published: latest ? "Latest: " + latest : "—",
    };
    return <TableFooter><DataTableRow>{table.getVisibleLeafColumns().map((column) => {
      const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
      const Cell = meta?.rowHeader ? DataTableHead : TableCell;
      return <Cell key={column.id} pinned={meta?.pinned} align={meta?.align}>{summary[column.id]}</Cell>;
    })}</DataTableRow></TableFooter>;
  }}</table.Subscribe>;
}

/**
 * The row menu. `DataTableRowActions` owns the trigger — glyph, size, variant, press wiring —
 * so the demo only decides what is in the menu and what it is called. The items are inert: this
 * page is here to show the control, not to run a release process.
 */
function ReleaseActions({ release }: { release: Release }) {
  return (
    <DataTableRowActions label={`Actions for ${release.version}`}>
      <DropdownMenuItem>
        <Pin />
        Pin release
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Copy />
        Copy version
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <Trash2 />
        Yank
      </DropdownMenuItem>
    </DataTableRowActions>
  );
}
