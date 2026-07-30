import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Slot } from "./slot";

describe("Slot", () => {
  it("lets a child cancel the slot handler", () => {
    const slotClick = vi.fn();
    const childClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <Slot onClick={slotClick}>
        <button onClick={childClick}>Cancel</button>
      </Slot>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(childClick).toHaveBeenCalledOnce();
    expect(slotClick).not.toHaveBeenCalled();
  });
});
