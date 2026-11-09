import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

it("keeps unaffected rows out of highlight and search renders", async () => {
  const user = userEvent.setup();
  const count = 40;
  const renders = Array.from({ length: count }, () => vi.fn(() => ""));
  render(<Select defaultOpen>
    <SelectTrigger aria-label="Options" />
    <SelectContent searchable>
      {renders.map((className, value) => <SelectItem key={value} value={value} className={className}>
        {`Option ${value}`}
      </SelectItem>)}
    </SelectContent>
  </Select>);
  const first = await screen.findByRole("option", { name: "Option 0" });
  await waitFor(() => expect(first).toHaveAttribute("data-panel-active"));
  await user.hover(screen.getByRole("option", { name: "Option 1" }));
  renders.forEach((renderRow) => renderRow.mockClear());
  await user.hover(screen.getByRole("option", { name: "Option 2" }));
  expect(renders[1]).toHaveBeenCalled();
  expect(renders[2]).toHaveBeenCalled();
  renders.forEach((renderRow, index) => {
    if (index !== 1 && index !== 2) expect(renderRow).not.toHaveBeenCalled();
  });

  renders.forEach((renderRow) => renderRow.mockClear());
  fireEvent.change(screen.getByRole("textbox", { name: "Search options" }), { target: { value: "Option" } });
  // Filtering still evaluates every option, but unchanged visible rows don't repaint.
  expect(renders.slice(3).every((renderRow) => renderRow.mock.calls.length === 0)).toBe(true);
  fireEvent.change(screen.getByRole("textbox", { name: "Search options" }), { target: { value: "Option 39" } });
  await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
  expect(screen.getByRole("option")).toHaveTextContent("Option 39");
});

it("updates memoized rows when caller props change and keeps their refs", async () => {
  const ref = createRef<HTMLElement>();
  const Example = ({ updated = false }) => <Select defaultOpen>
    <SelectTrigger aria-label="Options" />
    <SelectContent>
      <SelectItem ref={ref} value="a" disabled={updated} data-version={updated ? "new" : "old"}>
        {updated ? "Updated" : "Original"}
      </SelectItem>
    </SelectContent>
  </Select>;
  const { rerender } = render(<Example />);
  const row = await screen.findByRole("option", { name: "Original" });
  expect(ref.current).toBe(row);
  rerender(<Example updated />);
  expect(screen.getByRole("option", { name: "Updated" })).toBe(row);
  expect(row).toHaveAttribute("aria-disabled", "true");
  expect(row).toHaveAttribute("data-version", "new");
  expect(ref.current).toBe(row);
});
