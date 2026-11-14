import { createRef, type CSSProperties } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { DataTable, DataTableHead, DataTableRow } from "../data-table/data-table";

describe("Table layout features", () => {
  it("switches wrapping without forwarding an invalid native attribute", () => {
    const { rerender } = render(<Table wrap><TableBody><TableRow><TableCell>Long text</TableCell></TableRow></TableBody></Table>);
    expect(screen.getByRole("table")).toHaveAttribute("data-wrap", "");
    expect(screen.getByRole("table")).not.toHaveAttribute("wrap");
    rerender(<Table><TableBody><TableRow><TableCell>Long text</TableCell></TableRow></TableBody></Table>);
    expect(screen.getByRole("table")).not.toHaveAttribute("data-wrap");
  });

  it("distinguishes column headings from body row headings, including when the header is sticky", () => {
    render(<Table>
      <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableHead>Ada</TableHead></TableRow></TableBody>
    </Table>);
    const column = screen.getByRole("columnheader", { name: "Name" });
    const row = screen.getByRole("rowheader", { name: "Ada" });
    expect(column).toHaveAttribute("scope", "col");
    expect(row).toHaveAttribute("scope", "row");
    expect(column).toHaveClass("text-xs", "text-muted-foreground", "bg-(--table-bg)");
    expect(row).toHaveClass("py-1.5", "text-foreground", "font-medium");
    expect(row).not.toHaveClass("text-xs", "text-muted-foreground", "bg-(--table-bg)");
    expect(row).not.toHaveAttribute("data-pinned");
  });

  it.each(["start", "center", "end", "left", "right", "justify"] as const)("supports %s alignment on headings and data cells", (align) => {
    render(<Table><TableHeader><TableRow><TableHead align={align}>Total</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell align={align}>123</TableCell></TableRow></TableBody></Table>);
    expect(screen.getByRole("columnheader")).toHaveAttribute("data-align", align);
    expect(screen.getByRole("cell")).toHaveAttribute("data-align", align);
    if (align === "start" || align === "end") expect(screen.getByRole("cell")).not.toHaveAttribute("align");
  });

  it("forwards cell refs, events and pin offsets while exposing logical pinned edges", () => {
    const ref = createRef<HTMLTableCellElement>();
    const onClick = vi.fn();
    const style = { "--table-pin-offset": "120px" } as CSSProperties;
    const { unmount } = render(<Table dir="rtl"><TableHeader><TableRow><TableHead pinned="end">Total</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell ref={ref} pinned="end" style={style} onClick={onClick}>123</TableCell></TableRow></TableBody></Table>);
    expect(ref.current).toBe(screen.getByRole("cell"));
    expect(ref.current).toHaveAttribute("data-pinned", "end");
    expect(ref.current).not.toHaveAttribute("pinned");
    expect(ref.current?.style.getPropertyValue("--table-pin-offset")).toBe("120px");
    expect(screen.getByRole("table").closest('[data-slot="table-container"]')).toHaveAttribute("dir", "rtl");
    fireEvent.click(ref.current!);
    expect(onClick).toHaveBeenCalledOnce();
    unmount();
    expect(ref.current).toBeNull();
  });

  it("carries alignment and pinning from header columns into loading rows", () => {
    const style = { "--table-pin-offset": "80px", color: "red" } as CSSProperties;
    const { container } = render(<Table loading loadingRows={2}>
      <TableHeader><TableRow><><TableHead pinned="start" style={style}>Name</TableHead><TableHead align="end" pinned="end">Total</TableHead></></TableRow></TableHeader>
      <TableBody />
    </Table>);
    for (const row of container.querySelectorAll('tbody tr')) {
      expect(row.children[0]).toHaveAttribute("data-pinned", "start");
      expect((row.children[0] as HTMLElement).style.getPropertyValue("--table-pin-offset")).toBe("80px");
      expect((row.children[0] as HTMLElement).style.color).toBe("");
      expect(row.children[1]).toHaveAttribute("data-pinned", "end");
      expect(row.children[1]).toHaveAttribute("data-align", "end");
    }
  });

  it("keeps Data Table row headings accessible while selection covers column labels", () => {
    const onSortChange = vi.fn();
    render(<DataTable selectable selectionBar rows={["ada"]} onSortChange={onSortChange}>
      <TableHeader><DataTableRow><DataTableHead pinned="start" sortKey="name">Name</DataTableHead><DataTableHead align="end">Total</DataTableHead></DataTableRow></TableHeader>
      <TableBody><DataTableRow value="ada" selectLabel="Select Ada"><DataTableHead scope="row" pinned="start">Ada</DataTableHead><TableCell align="end">123</TableCell></DataTableRow></TableBody>
    </DataTable>);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(onSortChange).toHaveBeenCalledWith({ column: "name", direction: "asc" });
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("data-pinned", "start");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Ada" }));
    const rowHeading = screen.getByRole("rowheader", { name: "Ada" });
    expect(rowHeading).not.toHaveAttribute("inert");
    expect(rowHeading).not.toHaveAttribute("aria-hidden");
    expect(screen.getByText("Name").closest("th")).toHaveAttribute("inert");
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });
});
