import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("captures, tracks, and releases a resize pointer", () => {
    render(<Textarea aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn();
    Object.assign(grip, { setPointerCapture, releasePointerCapture });

    fireEvent.pointerDown(grip, { pointerId: 7, clientY: 100 });
    expect(setPointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 150 });
    expect(textarea).toHaveStyle({ height: "150px" });

    fireEvent.pointerUp(grip, { pointerId: 7, clientY: 150 });
    expect(releasePointerCapture).toHaveBeenCalledWith(7);
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 190 });
    expect(textarea).toHaveStyle({ height: "150px" });
  });
});
