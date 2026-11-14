import { render, screen, waitFor } from "@testing-library/react";
import { Activity, StrictMode } from "react";
import { Select, SelectContent, SelectItem, SelectSortTrigger, SelectTrigger, SelectValue } from "./select";

function RegisteredSelection({ kind }: { kind: "sort" | "value" }) {
  return (
    <Select defaultOpen defaultValue="active_paused">
      {kind === "sort" ? (
        <SelectSortTrigger label="Status" aria-label="Status" />
      ) : (
        <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
      )}
      {/* No items mapping or iconForValue fallback: the row owns both registrations. */}
      <SelectContent>
        <SelectItem value="active_paused" icon={<span data-testid="status-icon" />}>
          Active / paused
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function expectRegisteredSelection(kind: "sort" | "value") {
  const trigger = screen.getByRole("combobox", { name: "Status" });
  if (kind === "sort") {
    expect(trigger).toHaveTextContent("Active / paused");
    expect(trigger).not.toHaveTextContent("active_paused");
  } else {
    expect(trigger.querySelector('[data-testid="status-icon"]')).toBeInTheDocument();
  }
}

describe("Select item registration", () => {
  it.each(["sort", "value"] as const)("restores the %s trigger after StrictMode effect replay", async (kind) => {
    render(<StrictMode><RegisteredSelection kind={kind} /></StrictMode>);

    await waitFor(() => expectRegisteredSelection(kind));
  });

  it.each(["sort", "value"] as const)("restores the %s trigger after Activity hides and reveals it", async (kind) => {
    // Reuse the same children so only the effect lifecycle changes, not the item's props.
    const children = <RegisteredSelection kind={kind} />;
    const { rerender } = render(<Activity mode="visible">{children}</Activity>);
    await waitFor(() => expectRegisteredSelection(kind));

    rerender(<Activity mode="hidden">{children}</Activity>);
    expect(screen.queryByRole("combobox", { name: "Status" })).not.toBeInTheDocument();
    rerender(<Activity mode="visible">{children}</Activity>);

    await waitFor(() => expectRegisteredSelection(kind));
  });
});
