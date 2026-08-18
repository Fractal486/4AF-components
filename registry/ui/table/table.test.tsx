import { fireEvent, render, screen } from "@testing-library/react";
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
