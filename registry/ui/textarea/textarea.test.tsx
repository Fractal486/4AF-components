import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import { Textarea } from "./textarea";

function mockPointerCapture(grip: HTMLElement) {
  const pointers = new Set<number>();
  const setPointerCapture = vi.fn((id: number) => { pointers.add(id); });
  const releasePointerCapture = vi.fn((id: number) => { pointers.delete(id); });
  Object.assign(grip, { setPointerCapture, releasePointerCapture, hasPointerCapture: (id: number) => pointers.has(id) });
  return { setPointerCapture, releasePointerCapture };
}

describe("Textarea", () => {
  it("links supporting content and existing error text without moving the resize grip", () => {
    render(<>
      <Textarea autoResize={false} aria-label="Notes" description={<strong>Add some context.</strong>} aria-describedby="notes-error" />
      <span id="notes-error">Notes are required.</span>
    </>);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveAccessibleDescription("Notes are required. Add some context.");
    const grip = screen.getByRole("button", { name: "Resize" });
    expect(grip.parentElement).toBe(textarea.parentElement);
    expect(grip.parentElement).not.toContainElement(screen.getByText("Add some context."));
  });

  it("retains its ref, value and error association when the description is hidden", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const props = { "aria-label": "Notes", "aria-describedby": "notes-error", ref };
    const { rerender } = render(<Textarea autoResize={false} {...props} description="Add context." />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    fireEvent.change(textarea, { target: { value: "Keep this note" } });
    rerender(<Textarea autoResize={false} {...props} description={null} />);
    expect(ref.current).toBe(textarea);
    expect(textarea).toHaveValue("Keep this note");
    expect(textarea).toHaveAttribute("aria-describedby", "notes-error");
    expect(screen.queryByText("Add context.")).not.toBeInTheDocument();
  });

  it.each([{ disabled: true }, { resizable: false }])("ends an active resize when availability changes to %j", (props) => {
    const { rerender } = render(<Textarea autoResize={false} aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    const { releasePointerCapture } = mockPointerCapture(grip);

    fireEvent.pointerDown(grip, { button: 0, pointerId: 7, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 150 });
    rerender(<Textarea autoResize={false} aria-label="Notes" {...props} />);

    expect(releasePointerCapture).toHaveBeenCalledWith(7);
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 190 });
    expect(textarea).toHaveStyle({ height: "150px" });
  });

  it("ignores move and end events from another pointer during a resize", () => {
    render(<Textarea autoResize={false} aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    const { releasePointerCapture } = mockPointerCapture(grip);

    fireEvent.pointerDown(grip, { button: 0, pointerId: 7, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 8, clientY: 190 });
    fireEvent.pointerUp(grip, { pointerId: 8 });
    expect(textarea.style.height).toBe("");
    expect(releasePointerCapture).not.toHaveBeenCalled();

    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 150 });
    expect(textarea).toHaveStyle({ height: "150px" });
  });

  it.each(["pointercancel", "lostpointercapture"])("ends resizing on %s", (eventType) => {
    render(<Textarea autoResize={false} aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    mockPointerCapture(grip);

    fireEvent.pointerDown(grip, { button: 0, pointerId: 7, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 150 });
    expect(textarea).toHaveStyle({ height: "150px" });
    fireEvent(grip, new PointerEvent(eventType, { pointerId: 7 }));
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 190 });
    expect(textarea).toHaveStyle({ height: "150px" });
  });

  it("ignores non-primary mouse buttons", () => {
    render(<Textarea autoResize={false} aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    const { setPointerCapture } = mockPointerCapture(grip);

    fireEvent.pointerDown(grip, { button: 2, pointerId: 7, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 190 });
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(textarea.style.height).toBe("");
  });

  it("cleans up an active resize when unmounted", () => {
    const { unmount } = render(<Textarea autoResize={false} aria-label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    const { releasePointerCapture } = mockPointerCapture(grip);

    fireEvent.pointerDown(grip, { button: 0, pointerId: 7, clientY: 100 });
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 150 });
    unmount();

    expect(releasePointerCapture).toHaveBeenCalledWith(7);
    fireEvent.pointerMove(grip, { pointerId: 7, clientY: 190 });
    expect(textarea).toHaveStyle({ height: "150px" });
  });

  it("switches to a plain field while preserving native input behavior and its ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    const { rerender } = render(<Textarea autoResize={false} aria-label="Notes" ref={ref} />);
    const field = screen.getByRole("textbox", { name: "Notes" });
    expect(field).toHaveAttribute("data-variant", "default");
    expect(field).toHaveClass("border", "border-border");

    rerender(<Textarea autoResize={false} aria-label="Notes" variant="plain" ref={ref} onChange={onChange} />);
    expect(ref.current).toBe(field);
    expect(field).toHaveAttribute("data-variant", "plain");
    expect(field).toHaveClass("border-0", "shadow-none");
    expect(field).not.toHaveClass("border", "border-border");
    fireEvent.change(field, { target: { value: "A note" } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(field).toHaveValue("A note");
  });

  it.each(["default", "plain"] as const)("captures, tracks, and releases a resize pointer with %s styling", (variant) => {
    render(<Textarea autoResize={false} aria-label="Notes" variant={variant} />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    const grip = screen.getByRole("button", { name: "Resize" });
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });
    const { setPointerCapture, releasePointerCapture } = mockPointerCapture(grip);

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
