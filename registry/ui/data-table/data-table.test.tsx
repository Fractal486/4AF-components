import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "@/registry/ui/button/button";
import { DropdownMenuItem } from "@/registry/ui/dropdown-menu/dropdown-menu";
import {
  DataTable,
  DataTableHead,
  DataTableRow,
  DataTableRowActions,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
} from "./data-table";

const PEOPLE = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "alan", name: "Alan Turing" },
  { id: "grace", name: "Grace Hopper" },
];

function People(props: Partial<React.ComponentProps<typeof DataTable>>) {
  return (
    <DataTable rows={PEOPLE.map((person) => person.id)} {...props}>
      <TableHeader>
        <DataTableRow>
          <DataTableHead>Name</DataTableHead>
        </DataTableRow>
      </TableHeader>
      <TableBody>
        {PEOPLE.map((person) => (
          <DataTableRow
            key={person.id}
            value={person.id}
            selectLabel={`Select ${person.name}`}
            actions={<button type="button">{`Actions for ${person.name}`}</button>}
          >
            <TableCell>{person.name}</TableCell>
          </DataTableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}

const selectAll = () => screen.getByRole("checkbox", { name: "Select all rows" });
const rowBox = (name: string) => screen.getByRole("checkbox", { name: `Select ${name}` });

describe("DataTable", () => {
  it("adds one checkbox per row plus the select-all, from a single prop", () => {
    render(<People selectable />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(PEOPLE.length + 1);
    expect(selectAll()).toBeInTheDocument();
    expect(rowBox("Ada Lovelace")).toBeInTheDocument();
  });

  it("has no selection column until it is asked for one", () => {
    render(<People />);

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
    expect(screen.getAllByRole("cell")).toHaveLength(PEOPLE.length);
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
      <People
        selectable
        rows={["ada"]}
        defaultValue={["ada", "offscreen"]}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(selectAll());

    expect(onValueChange).toHaveBeenLastCalledWith(["offscreen"]);
  });

  it("does not bubble selection or action interactions to a clickable row", () => {
    const onRowClick = vi.fn();
    const onRowKeyDown = vi.fn();

    render(
      <DataTable selectable actionColumn rows={["ada"]}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow
            value="ada"
            selectLabel="Select Ada Lovelace"
            actions={<button type="button">Open menu</button>}
            onClick={onRowClick}
            onKeyDown={onRowKeyDown}
          >
            <TableCell>Ada Lovelace</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    fireEvent.click(rowBox("Ada Lovelace"));
    fireEvent.keyDown(rowBox("Ada Lovelace"), { key: "Enter" });
    // Opening a row's menu is not clicking the row.
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(onRowClick).not.toHaveBeenCalled();
    expect(onRowKeyDown).not.toHaveBeenCalled();
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

  it("accepts xs-sized buttons in the selection action row", () => {
    const { container } = render(
      <People
        selectable
        selectionBar
        defaultValue={["ada"]}
        selectionActions={<Button size="xs">Clear</Button>}
      />,
    );

    const actions = container.querySelector('[data-slot="data-table-selection-actions"]')!;
    const button = screen.getByRole("button", { name: "Clear" });

    expect(actions).toHaveClass("flex", "items-center", "gap-1");
    expect(button).toHaveAttribute("data-size", "xs");
    expect(button).toHaveClass("h-6", "px-2.5");
  });

  it("adds a named actions column, revealed by hover or focus", () => {
    const { container } = render(<People actionColumn />);

    // Visually empty, but the column still has to be named or the cells under it are
    // unexplained.
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions for Ada Lovelace" })).toBeInTheDocument();

    const reveal = container.querySelector('[data-slot="data-table-row-actions"]')!;
    expect(reveal).toHaveClass("opacity-0");
    expect(reveal.className).toContain("group-hover/row:opacity-100");
    // A keyboard user can't hover to find it, so focus has to bring it back — but only
    // *visible* focus. Dismissing the menu by pointer restores focus to the trigger without
    // marking it visible; on `focus-within` that left the ⋯ stranded on screen, revealed by the
    // restored focus and dimmed because nothing was hovering it.
    expect(reveal.className).toContain("group-has-focus-visible/row:opacity-100");
    expect(reveal.className).not.toContain("group-focus-within");
    // Nor can a touch pointer, which has no hover at all.
    expect(reveal.className).toContain("[@media(hover:none)]:opacity-100");
  });

  it("does not light up the actions of every selected row", () => {
    const { container } = render(<People selectable actionColumn defaultValue={["ada", "alan"]} />);

    // Ticking rows sets up a bulk action; it says nothing about which row's own menu you want.
    // Holding the column up for each one would grow the noise with the size of the selection.
    const reveal = container.querySelector('[data-slot="data-table-row-actions"]')!;
    expect(reveal.className).not.toContain("group-data-[selected]/row:opacity-100");
    expect(screen.getByText("Ada Lovelace").closest("tr")).toHaveAttribute("data-selected");
  });

  it("keeps the actions header under the selection bar, not over it", () => {
    render(<People selectable selectionBar actionColumn defaultValue={["ada"]} />);

    const selectAllCell = document.querySelector("thead th")!;
    // Not the last cell in the row — the selection bar's own `<th>` is appended after it.
    const actionsCell = screen.getByText("Actions").closest("th")!;

    // The select-all lifts itself over the bar on purpose: its checkbox is how the selection
    // gets cleared, so it has to stay reachable.
    expect(selectAllCell.className).toContain("z-10");
    // The actions header holds nothing but a screen-reader label. Lifting it would park an
    // opaque empty box over the right end of the bar — exactly where `selectionActions` sit.
    expect(actionsCell.className).not.toContain("z-10");
    expect(actionsCell.className).not.toContain("relative");
  });

  it("renames the actions column when the default doesn't fit", () => {
    render(<People actionColumn actionColumnLabel="Row actions" />);

    expect(screen.getByRole("columnheader", { name: "Row actions" })).toBeInTheDocument();
  });

  it("leaves the actions column out until it is asked for", () => {
    render(<People />);

    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actions for Ada Lovelace" }),
    ).not.toBeInTheDocument();
  });

  it("gives the row menu one trigger the call site does not have to redecide", async () => {
    render(
      <DataTable size="md" actionColumn rows={["ada"]}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow
            value="ada"
            actions={
              <DataTableRowActions label="Actions for Ada Lovelace">
                <DropdownMenuItem>Rename</DropdownMenuItem>
              </DataTableRowActions>
            }
          >
            <TableCell>Ada Lovelace</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    // Named for the row, not "More actions" — that is what the required `label` is for.
    const trigger = screen.getByRole("button", { name: "Actions for Ada Lovelace" });
    // 30px at the comfortable density, decided once here rather than at every call site.
    expect(trigger).toHaveAttribute("data-size", "icon-sm");
    // Plain, not ghost: the row already washes on hover, and a second surface under the glyph
    // reads as a control stacked on a control.
    expect(trigger).toHaveAttribute("data-variant", "plain");
    // But `plain` is `text-foreground`, so the colour is ours. The row's hover reveals the
    // glyph; only the glyph's own hover lifts it.
    expect(trigger).toHaveClass("text-muted-foreground");
    expect(trigger.className).toContain("hover:text-foreground");
    expect(trigger.className).toContain("data-[popup-open]:text-foreground");

    fireEvent.click(trigger);
    expect(await screen.findByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
    // The menu portals its popup, so focus leaves the row entirely. Base UI's state attribute
    // is what holds the reveal open in its place — without it, moving the pointer away would
    // fade out the trigger of the menu standing open in front of you.
    expect(trigger).toHaveAttribute("data-popup-open");
  });

  it("scales the row menu trigger with the table's density", () => {
    render(
      <DataTable size="sm" actionColumn rows={["ada"]}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow value="ada" actions={<DataTableRowActions label="Actions for Ada" />}>
            <TableCell>Ada Lovelace</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    expect(screen.getByRole("button", { name: "Actions for Ada" })).toHaveAttribute(
      "data-size",
      "icon-xs",
    );
  });

  it("keeps the actions visible while their menu stands open", () => {
    const { container } = render(<People actionColumn />);

    // `:has()` on the cell's contents, because the open trigger is the only thing left in the
    // row once the popup has portalled away.
    const reveal = container.querySelector('[data-slot="data-table-row-actions"]')!;
    expect(reveal.className).toContain("has-[[data-popup-open]]:opacity-100");
  });

  it("keeps placeholder rows in column with both gutters", () => {
    const { container } = render(<People selectable actionColumn loading loadingRows={3} />);

    expect(container.querySelector("table")).toHaveAttribute("aria-busy", "true");

    const bodyRows = [...container.querySelectorAll("tbody tr")];
    expect(bodyRows).toHaveLength(3);
    // One placeholder for the declared column, plus an empty cell at each gutter — the same
    // three cells the header row has, so a loading table doesn't shift sideways.
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(bodyRows[0]!.children).toHaveLength(3);
    expect(container.querySelectorAll("thead th")).toHaveLength(3);

    // Nothing to select yet, and an indeterminate box over placeholders would claim otherwise.
    expect(selectAll()).toBeDisabled();
  });

  it("draws no vertical rule beside either gutter column", () => {
    const { container } = render(<People selectable actionColumn bordered />);

    const row = screen.getByText("Ada Lovelace").closest("tr")!;
    const cells = [...row.children];

    // The checkbox column is against the frame; the actions column has nothing behind it to
    // divide, since the ⋯ is hidden until the row is hovered. A rule either side of those would
    // be fencing off an empty strip.
    expect(cells[0]!.className).not.toContain("border-l");
    expect(cells[cells.length - 1]!.className).not.toContain("border-l");
    // The data columns still carry theirs.
    expect(cells[1]!.className).toContain("not-first:border-l");

    // And the header row matches, so the grid lines up top to bottom.
    const headerCells = [...container.querySelectorAll("thead th")];
    expect(headerCells[0]!.className).not.toContain("border-l");
    expect(screen.getByText("Actions").closest("th")!.className).not.toContain("border-l");
  });

  it("keeps a valueless row's columns aligned, without a checkbox in it", () => {
    render(
      <DataTable selectable rows={["ada"]}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow>
            <TableCell>No results</TableCell>
          </DataTableRow>
        </TableBody>
        <TableFooter>
          <DataTableRow>
            <TableCell>0 people</TableCell>
          </DataTableRow>
        </TableFooter>
      </DataTable>,
    );

    // Only the select-all: the empty-state row and the footer row each get the column's
    // cell so the columns stay lined up, but neither gets a checkbox.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByText("No results").closest("tr")?.children).toHaveLength(2);
    expect(screen.getByText("0 people").closest("tr")?.children).toHaveLength(2);
  });

  it("cycles a sortable column through ascending, descending and back out", () => {
    const onSortChange = vi.fn();
    render(
      <DataTable onSortChange={onSortChange}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead sortKey="name">Name</DataTableHead>
            <DataTableHead>Role</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow>
            <TableCell>Ada Lovelace</TableCell>
            <TableCell>Engineer</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    const header = screen.getByRole("columnheader", { name: "Name" });
    const control = screen.getByRole("button", { name: "Name" });
    expect(control).toHaveClass("rounded-[6px]");
    expect(header).toHaveAttribute("aria-sort", "none");
    expect(control.querySelector("svg")).toHaveClass("lucide-chevrons-up-down");

    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "name", direction: "asc" });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(control.querySelector("svg")).toHaveClass("lucide-chevron-up");

    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "name", direction: "desc" });
    expect(header).toHaveAttribute("aria-sort", "descending");

    // The third press has to put it back: a table that can be sorted but never unsorted
    // loses the order it was authored in.
    fireEvent.click(control);
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(header).toHaveAttribute("aria-sort", "none");
    expect(control.querySelector("svg")).toHaveClass("lucide-chevrons-up-down");
  });

  it("leaves a column without a sortKey unsortable", () => {
    render(
      <DataTable>
        <TableHeader>
          <DataTableRow>
            <DataTableHead sortKey="name">Name</DataTableHead>
            <DataTableHead>Role</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow>
            <TableCell>Ada Lovelace</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("columnheader", { name: "Role" })).not.toHaveAttribute("aria-sort");
  });

  it("moves the sort to another column at ascending, not wherever the last one was", () => {
    render(
      <DataTable defaultSort={{ column: "name", direction: "desc" }}>
        <TableHeader>
          <DataTableRow>
            <DataTableHead sortKey="name">Name</DataTableHead>
            <DataTableHead sortKey="role">Role</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody>
          <DataTableRow>
            <TableCell>Ada Lovelace</TableCell>
            <TableCell>Engineer</TableCell>
          </DataTableRow>
        </TableBody>
      </DataTable>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));

    expect(screen.getByRole("columnheader", { name: "Role" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "none");
  });

  it("disables the sort controls while loading", () => {
    render(
      <DataTable loading>
        <TableHeader>
          <DataTableRow>
            <DataTableHead sortKey="name">Name</DataTableHead>
          </DataTableRow>
        </TableHeader>
        <TableBody />
      </DataTable>,
    );

    expect(screen.getByRole("button", { name: "Name" })).toBeDisabled();
  });
});
