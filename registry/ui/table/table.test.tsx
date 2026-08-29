import { render, screen } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCaption,
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

function People(
  props: Partial<React.ComponentProps<typeof Table>> & { caption?: React.ReactNode },
) {
  const { caption, ...tableProps } = props;

  return (
    <Table {...tableProps}>
      {caption != null && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {PEOPLE.map((person) => (
          <TableRow key={person.id}>
            <TableCell>{person.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("renders a composable caption as the table's first semantic child", () => {
    const { container } = render(<People caption="People" />);

    const table = container.querySelector("table")!;
    const nativeCaption = table.querySelector('[data-slot="table-caption-native"]')!;
    const caption = container.querySelector('[data-slot="table-caption"]')!;

    expect(caption).toHaveTextContent("People");
    expect(caption).toHaveAttribute("data-slot", "table-caption");
    expect(caption.tagName).toBe("DIV");
    expect(nativeCaption).toHaveTextContent("People");
    expect(nativeCaption).toHaveClass("sr-only");
    expect(caption.closest('[data-slot="table-wrapper"]')).toBeNull();
    expect(caption.parentElement).toHaveAttribute("data-slot", "table-container");
    expect(table).toHaveClass("caption-bottom");
    // `text-xs`, matching the column headers: both are meta-text about the table, and a caption
    // set at the body's size competes with the rows it describes. 8px + a 16px line is 24px at
    // `sm` — it used to be 36px, exactly one row, which is why it read as an extra row.
    expect(caption).toHaveClass("mt-2", "text-xs", "text-muted-foreground");
    expect(caption).not.toHaveClass("text-sm");
    expect(table.firstElementChild).toBe(nativeCaption);
  });

  it("has no controls of its own — that is the entire point of the split", () => {
    render(<People />);

    // Nothing to press, nothing to check, nothing sorted. A control in this table is a
    // control that belongs in `data-table`.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");

    // And no columns have been inserted: one header cell, one body cell per row.
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
    expect(screen.getAllByRole("cell")).toHaveLength(PEOPLE.length);
  });

  it("names each row's group so a cell can react to the row's state", () => {
    render(<People />);

    // The actions column's reveal reads `group-hover/row`, so the name has to be here rather
    // than added by whatever composes on top.
    expect(screen.getByText("Ada Lovelace").closest("tr")).toHaveClass("group/row");
  });

  it("pins the header and gives the scroll container the library scrollbar", () => {
    const { container, rerender } = render(<People />);

    const wrapper = container.querySelector('[data-slot="table-wrapper"]')!;
    expect(wrapper.className).toContain("[scrollbar-width:thin]");
    expect(wrapper.className).toContain("[&::-webkit-scrollbar]:h-1.5");

    const headerRow = () => container.querySelector("thead tr")!;
    const headerCells = () => [...container.querySelectorAll("thead th")];

    // The row pins, not its cells: an overlay can only pin if its containing block does, and
    // DataTable's selection bar is laid over this row.
    expect(headerRow().className).toContain("sticky");
    // Above cell content that positions itself — a Badge's label sits at `relative z-10`,
    // which lands in the table's stacking context and wins a tie on source order.
    expect(headerRow().className).toContain("z-20");
    // Flush, not overhanging. A negative offset pins the header a pixel above the scrollport,
    // so it hops up and loses its top pixel on the first wheel notch.
    expect(headerRow().className).toContain("top-0");
    expect(headerRow().className).not.toContain("-top-px");

    // A pinned cell needs a fill, or the rows travelling underneath show through it — plus a
    // pixel of that fill above it, which is what closes the sub-pixel seam a sticky element
    // opens on a fractional scroll boundary. That is the job the negative offset used to do.
    expect(headerCells().every((cell) => cell.className.includes("bg-background"))).toBe(true);
    expect(
      headerCells().every((cell) =>
        cell.className.includes("shadow-[0_-1px_0_0_var(--color-background)]"),
      ),
    ).toBe(true);
    // Separated borders, or a pinned cell travels without its edge and the collapsed one it
    // left behind shows as a sliver at the top of the scrollport.
    expect(container.querySelector("table")!.className).toContain("border-separate");
    expect(headerCells().every((cell) => cell.className.includes("border-b"))).toBe(true);

    rerender(<People stickyHeader={false} />);

    expect(headerRow().className).not.toContain("sticky");
  });

  it("stands in for the rows while loading, in the shape the header declares", () => {
    const { container, rerender } = render(<People loading loadingRows={3} />);

    expect(container.querySelector("table")).toHaveAttribute("aria-busy", "true");
    // The header's own row is not a placeholder, so only the body's are counted.
    const bodyRows = () => [...container.querySelectorAll("tbody tr")];
    expect(bodyRows()).toHaveLength(3);
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    // One placeholder per declared column, and no extra cells: this table has no gutters.
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(bodyRows()[0]!.children).toHaveLength(1);
    expect(bodyRows()[0]).toHaveClass(
      "data-[slot=table-skeleton-row]:hover:bg-transparent",
      "dark:data-[slot=table-skeleton-row]:hover:bg-transparent",
    );
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("max-w-full");

    rerender(<People />);
    expect(container.querySelector("table")).not.toHaveAttribute("aria-busy");
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("builds placeholder rows from the registered row component", () => {
    // The hook DataTable uses to keep a loading table in column. A row that adds cells has to
    // be the row the skeletons are built from, or the placeholders sit one column to the left.
    function MarkedRow(props: React.ComponentProps<"tr">) {
      return (
        <TableRow {...props}>
          <TableCell data-testid="gutter" />
          {props.children}
        </TableRow>
      );
    }

    render(
      <Table loading loadingRows={2} rowComponent={MarkedRow}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>,
    );

    expect(screen.getAllByTestId("gutter")).toHaveLength(2);
  });

  it("separates a boundary rule from a separator rule", () => {
    const { container } = render(<People caption="People" />);

    const head = screen.getByRole("columnheader", { name: "Name" });
    const cell = screen.getByText("Ada Lovelace");

    // The boundary under the header: thicker, and at the full token. It is the only line in the
    // table meant to announce itself.
    expect(head.className).toContain("border-b-[1.5px]");
    expect(head.className).toContain("border-b-border");
    // The separator between rows: 1px, and quieter. At full strength every line carried the same
    // weight and the header's rule read as one more row rule.
    expect(cell.className).toContain("border-b");
    expect(cell.className).toContain("border-border/60");
    expect(cell.className).not.toContain("border-b-[1.5px]");

    // The header's own verticals stay on the separator tier — only its bottom edge is lifted.
    expect(head.className).toContain("border-border/60");
    expect(container.querySelector("tfoot")).toBeNull();
  });

  it("gives the footer the same boundary rule as the header", () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>1 person</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    // Totals divided from data is the same kind of division as labels from data.
    const footer = container.querySelector("tfoot")!;
    expect(footer.className).toContain("[&>tr>*]:border-t-[1.5px]");
    expect(footer.className).toContain("[&>tr>*]:border-t-border");
  });

  it("draws the grid only when asked, and never past the last column", () => {
    const { container, rerender } = render(<People />);

    const wrapper = () => container.querySelector('[data-slot="table-wrapper"]')!;
    const cells = () => [...container.querySelectorAll("th, td")];

    expect(wrapper()).not.toHaveClass("border");
    expect(cells().some((cell) => cell.className.includes("border-l"))).toBe(false);

    rerender(<People bordered />);

    // The frame is the wrapper's, because `border-collapse` ignores `border-radius` and a
    // border on the table itself could only ever be square.
    expect(wrapper()).toHaveClass("border", "rounded-md");
    // Every cell carries the rule on its leading edge, and `not-first` keeps it off the row's
    // left edge where the frame already is.
    expect(cells().every((cell) => cell.className.includes("not-first:border-l"))).toBe(true);
    // The verticals take the separator tier from the base rather than restating a colour —
    // which is what leaves the header's bottom edge as the only boundary in the grid.
    expect(cells().every((cell) => cell.className.includes("border-border/60"))).toBe(true);
  });

  it("scales only the caption's gap with density, never its type", () => {
    const { container, rerender } = render(<People size="md" caption="People" />);

    const caption = () => container.querySelector('[data-slot="table-caption"]')!;
    expect(caption()).toHaveClass("mt-3", "text-xs");

    rerender(<People size="sm" caption="People" />);
    expect(caption()).toHaveClass("mt-2", "text-xs");
  });

  it("defaults to the compact density", () => {
    const { container } = render(<People />);

    // `sm` by default: the usual reason to reach for a table is to see many rows at once.
    expect(container.querySelector("table")).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("h-9");
  });

  it("carries the density through to every part", () => {
    const { container } = render(
      <Table size="sm">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>1 person</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(container.querySelector("table")).toHaveAttribute("data-size", "sm");
    // At `sm` the header matches the row height: it carries the selection bar, whose `xs`
    // Buttons are 24px and were cramped in a 32px band beside a 16px checkbox.
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("h-9", "px-2.5");
    expect(screen.getByText("Ada Lovelace")).toHaveClass("h-9", "px-2.5");
  });

  it("keeps the md header a step under its row", () => {
    render(
      <Table size="md">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada Lovelace</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    // 36px against 44px. The row is 44 and not 48 so the two densities express one
    // relationship: 12px above and below a 20px line, rather than 14.
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("h-9", "px-3");
    expect(screen.getByText("Ada Lovelace")).toHaveClass("h-11", "px-3");
  });
});
