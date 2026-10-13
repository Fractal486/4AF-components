import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("switches to a plain field while preserving native input behavior and its ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    const { rerender } = render(<Textarea aria-label="Notes" ref={ref} />);
    const field = screen.getByRole("textbox", { name: "Notes" });
    expect(field).toHaveAttribute("data-variant", "default");
    expect(field).toHaveClass("border", "border-border");

    rerender(<Textarea aria-label="Notes" variant="plain" ref={ref} onChange={onChange} />);
    expect(ref.current).toBe(field);
    expect(field).toHaveAttribute("data-variant", "plain");
    expect(field).toHaveClass("border-0", "shadow-none");
    expect(field).not.toHaveClass("border", "border-border");
    fireEvent.change(field, { target: { value: "A note" } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(field).toHaveValue("A note");
  });

  it.each(["default", "plain"] as const)("captures, tracks, and releases a resize pointer with %s styling", (variant) => {
    render(<Textarea aria-label="Notes" variant={variant} />);
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
