import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLayoutEffect, useState } from "react";
import {
  DataTable, DataTableContent, DataTableToolbar, DataTableSearch, DataTableFilter, DataTableViewOptions, DataTablePagination,
  DataTableHead, DataTableRow, TableHeader, TableBody, TableCell, TableCaption,
  createDataTableColumns, useDataTable, type DataTableInstance, type DataTablePaginationProps, type UseDataTableOptions,
} from "./data-table";

const PEOPLE = [
  { id: "b", name: "Bea", team: "Design", score: 2 },
  { id: "a", name: "Ada", team: "Engineering", score: 5 },
  { id: "d", name: "Dara", team: "Design", score: 5 },
  { id: "c", name: "Cy", team: "Engineering", score: 1 },
];
type Person = (typeof PEOPLE)[number];
const helper = createDataTableColumns<Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Name", enableHiding: false, meta: { rowHeader: true, pinned: "start" } }),
  helper.accessor("team", { header: "Team" }),
  helper.accessor("score", { header: "Score", meta: { align: "end", pinned: "end" } }),
]);
let model: DataTableInstance<Person>;
function People({ disabled = false, data = PEOPLE, controlled = false, options }: { disabled?: boolean; data?: Person[]; controlled?: boolean; options?: Partial<UseDataTableOptions<Person>> }) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});
  const table = useDataTable({ data, columns, getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    enableRowSelection: (row) => !disabled || row.id !== "a",
    ...options,
    ...(controlled ? { state: { sorting, rowSelection }, onSortingChange: setSorting, onRowSelectionChange: setRowSelection } : {}),
  });
  useLayoutEffect(() => { model = table; }, [table]);
  return <DataTable table={table} selectable>
    <DataTableToolbar><DataTableSearch /><DataTableSearch column="team" aria-label="Filter team" /><DataTableFilter column="score" aria-label="Filter score" /><DataTableViewOptions /></DataTableToolbar>
    <DataTableContent<Person> getRowLabel={(row) => row.name}><TableCaption>People directory</TableCaption></DataTableContent>
    <DataTablePagination pageSizes={[2, 4]} />
  </DataTable>;
}
function names() { return screen.queryAllByRole("rowheader").map((cell) => cell.textContent); }

const SERVER_PAGE = PEOPLE.slice(0, 2);
function ServerPeople({ pageCount, rowCount, ...paginationProps }: DataTablePaginationProps & { pageCount?: number; rowCount?: number }) {
  const table = useDataTable({ data: SERVER_PAGE, columns, getRowId: (row) => row.id,
    manualPagination: true, pageCount, rowCount,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
  });
  useLayoutEffect(() => { model = table; }, [table]);
  return <DataTable table={table}>
    <DataTableContent />
    <DataTablePagination {...paginationProps} />
  </DataTable>;
}

const groupedColumns = helper.columns([
  helper.group({ id: "person", header: "Person", columns: helper.columns([
    helper.accessor("name", { header: "Name", meta: { pinned: "start" } }),
    helper.group({ id: "details", header: "Details", columns: helper.columns([
      helper.accessor("team", { header: "Team" }),
      helper.accessor("score", { header: "Score", meta: { align: "end", pinned: "end" } }),
    ]) }),
  ]) }),
]);
const NO_PEOPLE: Person[] = [];
function GroupedPeople({ loading }: { loading: boolean }) {
  const table = useDataTable({ data: NO_PEOPLE, columns: groupedColumns });
  useLayoutEffect(() => { model = table; }, [table]);
  return <DataTable table={table} loading={loading} loadingRows={1} selectable actionColumn>
    <DataTableContent />
  </DataTable>;
}

describe("Data Table model and controls", () => {
  it.each([false, true])("honors single selection for checkboxes, shift ranges, drag ranges, and select-all (controlled=%s)", (controlled) => {
    const { container } = render(<People controlled={controlled} options={{ enableMultiRowSelection: false }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Bea" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Ada" }));
    expect(model.state.rowSelection).toEqual({ a: true });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Dara" }));
    expect(model.state.rowSelection).toEqual({ d: true });
    act(() => { model.resetRowSelection(true); model.setPageSize(4); model.setPageIndex(0); });
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Bea" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Dara" }), { shiftKey: true });
    expect(model.state.rowSelection).toEqual({ d: true });
    act(() => model.resetRowSelection(true));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(Object.keys(model.state.rowSelection)).toHaveLength(1);
    act(() => model.resetRowSelection(true));
    fireEvent.pointerDown(screen.getByRole("checkbox", { name: "Select Bea" }), { button: 0, buttons: 1, pointerType: "mouse" });
    fireEvent.pointerEnter(container.querySelector('tbody tr:has([data-row-value="d"])')!, { buttons: 1, pointerType: "mouse" });
    expect(Object.keys(model.state.rowSelection)).toHaveLength(1);
    fireEvent.pointerUp(document);
    // Consume the click suppressed after a drag so it cannot affect another test.
    fireEvent.click(document.body);
    // A long sequence of full-table renders; under full-suite load it can exceed the 5s default.
  }, 15_000);

  it("uses row-specific multi-selection rules when adding a row", () => {
    render(<People options={{ enableMultiRowSelection: row => row.id !== "a" }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Bea" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Ada" }));
    expect(model.state.rowSelection).toEqual({ a: true });
  });

  it.each([false, true])("uses the model's descending-first and sorting-removal rules (controlled=%s)", (controlled) => {
    const customColumns = helper.columns([helper.accessor("name", { header: "Name", sortDescFirst: true, meta: { rowHeader: true } })]);
    render(<People controlled={controlled} options={{ columns: customColumns, enableSortingRemoval: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(model.state.sorting).toEqual([{ id: "name", desc: true }]);
    expect(names()).toEqual(["Dara", "Cy"]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(model.state.sorting).toEqual([{ id: "name", desc: false }]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(model.state.sorting).toEqual([{ id: "name", desc: true }]);
  });

  it("uses the model's multi-sort event and column limit", () => {
    render(<People options={{ isMultiSortEvent: event => Boolean((event as MouseEvent).ctrlKey), maxMultiSortColCount: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    fireEvent.click(screen.getByRole("button", { name: "Team" }), { ctrlKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Score" }), { ctrlKey: true });
    expect(model.state.sorting).toEqual([{ id: "team", desc: false }, { id: "score", desc: false }]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }), { shiftKey: true });
    expect(model.state.sorting).toEqual([{ id: "name", desc: false }]);
  });

  it("navigates unknown server pages and only clamps once the page count is known", () => {
    const { rerender } = render(<ServerPeople pageCount={-1} />);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(model.state.pagination.pageIndex).toBe(2);
    expect(screen.getByText("Page 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(model.state.pagination.pageIndex).toBe(1);
    rerender(<ServerPeople pageCount={1} />);
    expect(model.state.pagination.pageIndex).toBe(0);
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("uses server row totals in the summary and its custom formatters", () => {
    const { rerender } = render(<ServerPeople rowCount={100} />);
    expect(screen.getByText("100 rows")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 50")).toBeInTheDocument();
    const formatRows = vi.fn((total: number) => `${total} records`);
    rerender(<ServerPeople rowCount={100} formatRows={formatRows} />);
    expect(formatRows).toHaveBeenLastCalledWith(100);
    const formatSelection = vi.fn((selected: number, total: number) => `${selected} / ${total}`);
    rerender(<ServerPeople rowCount={100} showSelection formatSelection={formatSelection} />);
    expect(formatSelection).toHaveBeenLastCalledWith(0, 100);
  });

  it("sizes grouped loading and empty rows from visible leaf columns, including their layouts", () => {
    const { container, rerender } = render(<GroupedPeople loading />);
    const loadingCells = () => container.querySelectorAll('tbody [data-slot="table-cell"]');
    expect(loadingCells()).toHaveLength(3);
    expect(loadingCells()[0]).toHaveAttribute("data-pinned", "start");
    expect(loadingCells()[2]).toHaveAttribute("data-pinned", "end");
    expect(loadingCells()[2]).toHaveAttribute("data-align", "end");
    // Selection and action gutters are additional to the model's leaf columns.
    expect(container.querySelectorAll("tbody td")).toHaveLength(5);
    act(() => model.getColumn("team")?.toggleVisibility(false));
    expect(loadingCells()).toHaveLength(2);
    expect(loadingCells()[1]).toHaveAttribute("data-pinned", "end");
    rerender(<GroupedPeople loading={false} />);
    expect(screen.getByText("No results.").closest("td")).toHaveAttribute("colspan", "2");
    expect(container.querySelectorAll("tbody td")).toHaveLength(3);
    act(() => model.getColumn("team")?.toggleVisibility(true));
    expect(screen.getByText("No results.").closest("td")).toHaveAttribute("colspan", "3");
  });

  it("renders data, changes pages, and filters the entire data set from later pages", async () => {
    render(<People />);
    expect(names()).toEqual(["Bea", "Ada"]);
    expect(screen.getByRole("table")).toHaveAccessibleName("People directory");
    expect(document.querySelector('[data-slot="table-caption"]')?.closest("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(names()).toEqual(["Dara", "Cy"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search table" }), { target: { value: "Ada" } });
    await waitFor(() => expect(names()).toEqual(["Ada"]));
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 result"));
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Search table" }), { key: "Escape" });
    expect(names()).toEqual(["Bea", "Ada"]);
  });

  it("filters a column to the checked values from its filter trigger", async () => {
    const user = userEvent.setup();
    render(<People />);
    const trigger = screen.getByRole("combobox", { name: "Filter score" });
    expect(trigger).toHaveAttribute("data-placeholder");
    await user.click(trigger);
    // Options default to the column's distinct values.
    expect((await screen.findAllByRole("option")).map((item) => item.textContent)).toEqual(["1", "2", "5"]);
    await user.click(screen.getByRole("option", { name: "5" }));
    expect(names()).toEqual(["Ada", "Dara"]);
    await user.click(screen.getByRole("option", { name: "1" }));
    expect(names()).toEqual(["Ada", "Dara"]);
    expect(model.getColumn("score")?.getFilterValue()).toEqual(["5", "1"]);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(names()).toEqual(["Bea", "Ada"]);
    expect(model.getColumn("score")?.getFilterValue()).toBeUndefined();
  });

  it("combines global search with a column filter and supports clearing from its button", () => {
    render(<People />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter team" }), { target: { value: "Engineering" } });
    expect(names()).toEqual(["Ada", "Cy"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search table" }), { target: { value: "Cy" } });
    expect(names()).toEqual(["Cy"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Clear search" })[0]!);
    expect(names()).toEqual(["Ada", "Cy"]);
  });

  it.each([false, true])("sorts actual rows with secondary priorities and cycles back to unsorted (controlled=%s)", (controlled) => {
    render(<People controlled={controlled} />);
    act(() => model.setPageSize(4));
    fireEvent.click(screen.getByRole("button", { name: "Team" }));
    fireEvent.click(screen.getByRole("button", { name: "Score" }), { shiftKey: true });
    expect(model.state.sorting).toEqual([{ id: "team", desc: false }, { id: "score", desc: false }]);
    expect(names()).toEqual(["Bea", "Dara", "Cy", "Ada"]);
    fireEvent.click(screen.getByRole("button", { name: /Score/ }), { shiftKey: true });
    expect(names()).toEqual(["Dara", "Bea", "Ada", "Cy"]);
    fireEvent.click(screen.getByRole("button", { name: /Score/ }), { shiftKey: true });
    expect(model.state.sorting).toEqual([{ id: "team", desc: false }]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(names()).toEqual(["Ada", "Bea", "Cy", "Dara"]);
  });

  it("keeps the visibility panel open while hiding columns and preserves required columns", async () => {
    const user = userEvent.setup();
    render(<People />);
    await user.click(screen.getByRole("combobox", { name: "View" }));
    const team = await screen.findByRole("option", { name: "Team" });
    await user.click(team);
    expect(screen.queryByRole("columnheader", { name: "Team" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Score" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Name" })).not.toBeInTheDocument();
    await user.click(team);
    expect(screen.getByRole("columnheader", { name: "Team" })).toBeInTheDocument();
  });

  it("keeps off-page selection and excludes disabled rows from select-all and shift selection", () => {
    render(<People disabled />);
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(model.state.rowSelection).toEqual({ b: true });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(model.state.rowSelection).toEqual({ b: true, d: true, c: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(model.state.rowSelection).toEqual({ b: true });
    act(() => { model.resetRowSelection(true); model.setPageSize(4); });
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Bea" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Dara" }), { shiftKey: true });
    expect(model.state.rowSelection).toEqual({ b: true, d: true });
  });

  it("announces sorting and clamps the current page when data shrinks", async () => {
    const { rerender } = render(<People />);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sorted by Name, ascending"));
    fireEvent.click(screen.getByRole("button", { name: "Last page" }));
    rerender(<People data={[]} />);
    await waitFor(() => expect(screen.getByText("Page 1 of 1")).toBeInTheDocument());
    expect(screen.getByText("No results.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeDisabled();
  });

  it("supports multiple sorts and disabled checkboxes in hand-composed tables too", () => {
    const changed = vi.fn();
    render(<DataTable selectable rows={["a", "b"]} onSortingChange={changed}>
      <TableHeader><DataTableRow><DataTableHead sortKey="name">Name</DataTableHead><DataTableHead sortKey="score">Score</DataTableHead></DataTableRow></TableHeader>
      <TableBody>
        <DataTableRow value="a" disabled selectLabel="Select Ada"><TableCell>Ada</TableCell><TableCell>1</TableCell></DataTableRow>
        <DataTableRow value="b" selectLabel="Select Bea"><TableCell>Bea</TableCell><TableCell>2</TableCell></DataTableRow>
      </TableBody>
    </DataTable>);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    fireEvent.click(screen.getByRole("button", { name: "Score" }), { shiftKey: true });
    expect(changed).toHaveBeenLastCalledWith([{ column: "name", direction: "asc" }, { column: "score", direction: "asc" }]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Bea" })).toBeChecked();
  });
});
