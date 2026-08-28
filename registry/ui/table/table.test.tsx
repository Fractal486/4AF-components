import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const PEOPLE = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "alan", name: "Alan Turing" },
  { id: "grace", name: "Grace Hopper" },
];

function People(props: Partial<React.ComponentProps<typeof Table>>) {
  return (
    <Table rows={PEOPLE.map((person) => person.id)} {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {PEOPLE.map((person) => (
          <TableRow key={person.id} value={person.id} selectLabel={`Select ${person.name}`}>
            <TableCell>{person.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const selectAll = () => screen.getByRole("checkbox", { name: "Select all rows" });
const rowBox = (name: string) => screen.getByRole("checkbox", { name: `Select ${name}` });

describe("Table", () => {
  it("has no selection column until it is asked for one", () => {
    render(<People />);

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    // One header cell and one body cell per row — nothing has been inserted.
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
    expect(screen.getAllByRole("cell")).toHaveLength(PEOPLE.length);
  });

  it("adds one checkbox per row plus the select-all, from a single prop", () => {
    render(<People selectable />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(PEOPLE.length + 1);
    expect(selectAll()).toBeInTheDocument();
    expect(rowBox("Ada Lovelace")).toBeInTheDocument();
  });

  it("selects a row uncontrolled and reports it", () => {
    const onValueChange = vi.fn();
    render(<People selectable onValueChange={onValueChange} />);

    fireEvent.click(rowBox("Alan Turing"));

    expect(onValueChange).toHaveBeenCalledWith(["alan"]);
    expect(rowBox("Alan Turing")).toHaveAttribute("aria-checked", "true");
    // Styling and tests hook off the attribute, not off a conditional class.
    expect(screen.getByText("Alan Turing").closest("tr")).toHaveAttribute("data-selected");
  });

  it("does not bubble selection interactions to a clickable row", () => {
    const onRowClick = vi.fn();
    const onRowKeyDown = vi.fn();

    render(
      <Table selectable rows={["ada"]}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            value="ada"
            selectLabel="Select Ada Lovelace"
            onClick={onRowClick}
            onKeyDown={onRowKeyDown}
          >
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    fireEvent.click(rowBox("Ada Lovelace"));
    fireEvent.keyDown(rowBox("Ada Lovelace"), { key: "Enter" });

    expect(onRowClick).not.toHaveBeenCalled();
    expect(onRowKeyDown).not.toHaveBeenCalled();
  });

  it("holds a controlled value until its owner moves it", () => {
    const onValueChange = vi.fn();
    render(<People selectable value={[]} onValueChange={onValueChange} />);

    fireEvent.click(rowBox("Ada Lovelace"));

    expect(onValueChange).toHaveBeenCalledWith(["ada"]);
    expect(rowBox("Ada Lovelace")).toHaveAttribute("aria-checked", "false");
  });

  it("goes indeterminate while the selection is partial", () => {
    render(<People selectable defaultValue={["ada"]} />);

    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");

    fireEvent.click(rowBox("Alan Turing"));
    fireEvent.click(rowBox("Grace Hopper"));

    expect(selectAll()).toHaveAttribute("aria-checked", "true");
  });

  it("checks every row from the select-all, and clears them from it", () => {
    const onValueChange = vi.fn();
    render(<People selectable onValueChange={onValueChange} />);

    fireEvent.click(selectAll());
    expect(onValueChange).toHaveBeenLastCalledWith(["ada", "alan", "grace"]);

    fireEvent.click(selectAll());
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("leaves selected rows it does not cover alone", () => {
    const onValueChange = vi.fn();
    // A paginated table: `rows` is the page in front of you, and the selection carries a row
    // from a page that isn't rendered. Select-all must not throw that away.
    render(
      <People selectable rows={["ada"]} defaultValue={["ada", "offscreen"]} onValueChange={onValueChange} />,
    );

    fireEvent.click(selectAll());

    expect(onValueChange).toHaveBeenLastCalledWith(["offscreen"]);
  });

  it("turns the header into an action row while a selection stands", async () => {
    const { rerender } = render(
      <People
        selectable
        selectionBar
        defaultValue={["ada", "alan"]}
        selectionActions={<button type="button">Export</button>}
      />,
    );

    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    // The select-all stays, because it is how the selection is cleared.
    expect(selectAll()).toBeInTheDocument();
    // The labels are covered rather than removed — still in the layout holding the column
    // widths, but out of the accessibility tree and out of the tab order.
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();

    // Clearing the selection hands the header back, once the bar has finished leaving.
    fireEvent.click(selectAll());
    fireEvent.click(selectAll());
    await waitFor(() => expect(screen.queryByText(/selected$/)).not.toBeInTheDocument());
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();

    // And it stays a plain header when the feature isn't asked for.
    rerender(<People selectable defaultValue={["ada"]} />);
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  it("pins the header and gives the scroll container the library scrollbar", () => {
    const { container, rerender } = render(<People selectable />);

    const wrapper = container.querySelector('[data-slot="table-wrapper"]')!;
    expect(wrapper.className).toContain("[scrollbar-width:thin]");
    expect(wrapper.className).toContain("[&::-webkit-scrollbar]:h-1.5");

    const headerRow = () => container.querySelector("thead tr")!;
    const headerCells = () => [...container.querySelectorAll("thead th")];

    // The row pins, not its cells: an overlay can only pin if its containing block does, and
    // the selection bar is laid over this row.
    expect(headerRow().className).toContain("sticky");
    // Above cell content that positions itself — a Badge's label sits at `relative z-10`,
    // which lands in the table's stacking context and wins a tie on source order.
    expect(headerRow().className).toContain("z-20");
    // Overhanging the scrollport by a pixel, so a fractional sticky boundary can't open a
    // seam above the header for the rows behind it to show through.
    expect(headerRow().className).toContain("-top-px");

    // Both the column header and the select-all cell need a fill, or the rows travelling
    // underneath show through the pinned row.
    expect(headerCells()).toHaveLength(2);
    expect(headerCells().every((cell) => cell.className.includes("bg-background"))).toBe(true);
    // Separated borders, or a pinned cell travels without its edge and the collapsed one it
    // left behind shows as a sliver at the top of the scrollport.
    expect(container.querySelector("table")!.className).toContain("border-separate");
    expect(headerCells().every((cell) => cell.className.includes("border-b"))).toBe(true);

    rerender(<People selectable stickyHeader={false} />);

    expect(headerRow().className).not.toContain("sticky");
  });

  it("stands in for the rows while loading, in the shape the header declares", () => {
    const { container, rerender } = render(<People selectable loading loadingRows={3} />);

    expect(container.querySelector("table")).toHaveAttribute("aria-busy", "true");
    // The header's own row is not a placeholder, so only the body's are counted.
    const bodyRows = () => [...container.querySelectorAll("tbody tr")];
    expect(bodyRows()).toHaveLength(3);
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    // One placeholder per declared column, plus the selection column's empty cell.
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(bodyRows()[0]!.children).toHaveLength(2);
    expect(bodyRows()[0]).toHaveClass(
      "data-[slot=table-skeleton-row]:hover:bg-transparent",
      "dark:data-[slot=table-skeleton-row]:hover:bg-transparent",
    );
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("max-w-full");

    // Nothing to order or select yet.
    expect(selectAll()).toBeDisabled();

    rerender(<People selectable />);
    expect(container.querySelector("table")).not.toHaveAttribute("aria-busy");
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("disables the sort controls while loading", () => {
    render(
      <Table loading>
        <TableHeader>
          <TableRow>
            <TableHead sortKey="name">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("button", { name: "Name" })).toBeDisabled();
  });

  it("cycles a sortable column through ascending, descending and back out", () => {
    const onSortChange = vi.fn();
    render(
      <Table onSortChange={onSortChange}>
        <TableHeader>
          <TableRow>
            <TableHead sortKey="name">Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
            <TableCell>Edit</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const header = screen.getByRole("columnheader", { name: "Name" });
    const control = screen.getByRole("button", { name: "Name" });
    expect(header).toHaveAttribute("aria-sort", "none");

    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "name", direction: "asc" });
    expect(header).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "name", direction: "desc" });
    expect(header).toHaveAttribute("aria-sort", "descending");

    // The third press has to put it back: a table that can be sorted but never unsorted
    // loses the order it was authored in.
    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(header).toHaveAttribute("aria-sort", "none");
  });

  it("leaves a column without a sortKey unsortable", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortKey="name">Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("columnheader", { name: "Actions" })).not.toHaveAttribute("aria-sort");
  });

  it("moves the sort to another column at ascending, not wherever the last one was", () => {
    render(
      <Table defaultSort={{ column: "name", direction: "desc" }}>
        <TableHeader>
          <TableRow>
            <TableHead sortKey="name">Name</TableHead>
            <TableHead sortKey="role">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));

    expect(screen.getByRole("columnheader", { name: "Role" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "none");
  });

  it("draws the grid only when asked, and never past the last column", () => {
    const { container, rerender } = render(<People selectable />);

    const wrapper = () => container.querySelector('[data-slot="table-wrapper"]')!;
    const cells = () => [...container.querySelectorAll("th, td")];

    expect(wrapper()).not.toHaveClass("border");
    expect(cells().some((cell) => cell.className.includes("border-r"))).toBe(false);

    rerender(<People selectable bordered />);

    // The frame is the wrapper's, because `border-collapse` ignores `border-radius` and a
    // border on the table itself could only ever be square.
    expect(wrapper()).toHaveClass("border", "rounded-md");
    // Every cell carries the rule, and `not-last` keeps it off the row's right edge where
    // the frame already is.
    expect(cells().every((cell) => cell.className.includes("not-last:border-r"))).toBe(true);
  });

  it("keeps a valueless row's columns aligned, without a checkbox in it", () => {
    render(
      <Table selectable rows={["ada"]}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>No results</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>0 people</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    // Only the select-all: the empty-state row and the footer row each get the column's
    // cell so the columns stay lined up, but neither gets a checkbox.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByText("No results").closest("tr")?.children).toHaveLength(2);
    expect(screen.getByText("0 people").closest("tr")?.children).toHaveLength(2);
  });
});
