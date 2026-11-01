import { Field } from "@base-ui/react/field";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { LoaderProvider } from "@/registry/lib/loader";
import { Switch } from "./switch";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function geometry(control: HTMLElement) {
  Object.defineProperty(control, "clientWidth", { configurable: true, value: 36 });
  Object.defineProperty(control.querySelector("[data-slot=switch-thumb]"), "offsetWidth", { configurable: true, value: 16 });
  control.style.padding = "2px";
  const captured = new Set<number>();
  Object.assign(control, {
    setPointerCapture: vi.fn((id: number) => captured.add(id)),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: vi.fn((id: number) => captured.delete(id)),
  });
}

function drag(control: HTMLElement, delta: number, end = "pointerup") {
  fireEvent.pointerDown(control, { pointerId: 1, isPrimary: true, pointerType: "mouse", button: 0, clientX: 100 });
  fireEvent.pointerMove(control, { pointerId: 1, pointerType: "mouse", buttons: 1, clientX: 100 + delta });
  fireEvent(control, new PointerEvent(end, { bubbles: true, pointerId: 1, clientX: 100 + delta }));
}

describe("Switch saving", () => {
  afterEach(() => vi.useRealTimers());

  it("changes optimistically, delays the inherited loader, blocks repeats, and commits success", async () => {
    vi.useFakeTimers();
    const save = deferred();
    const change = vi.fn(() => save.promise);
    render(<LoaderProvider loader={<span data-testid="custom-loader" />}><Switch aria-label="Sync" onCheckedChange={change} /></LoaderProvider>);
    const control = screen.getByRole("switch");
    control.focus();
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(control).toHaveAttribute("aria-busy", "true");
    expect(control).toHaveFocus();
    expect(screen.queryByTestId("custom-loader")).toBeNull();
    act(() => vi.advanceTimersByTime(399));
    expect(screen.queryByTestId("custom-loader")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("custom-loader")).toBeInTheDocument();
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: "Enter" });
    expect(change).toHaveBeenCalledOnce();
    await act(async () => save.resolve());
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(control).not.toHaveAttribute("aria-busy");
    expect(screen.queryByTestId("custom-loader")).toBeNull();
  });

  it("rolls back failures and reports the actual rejection", async () => {
    const save = deferred();
    const onError = vi.fn();
    render(<Switch aria-label="Sync" defaultChecked onCheckedChange={() => save.promise} onError={onError} />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    const error = new Error("Offline");
    await act(async () => save.reject(error));
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(control).toHaveAttribute("data-error");
    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    expect(screen.getByRole("status")).toHaveTextContent("Could not save change.");
  });

  it.each([false, true])("returns to the latest controlled value after settlement (failure=%s)", async (failure) => {
    const save = deferred();
    const { rerender } = render(<Switch aria-label="Sync" checked={false} onCheckedChange={() => save.promise} />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
    rerender(<Switch aria-label="Sync" checked={false} onCheckedChange={() => save.promise} />);
    await act(async () => failure ? save.reject(new Error("Offline")) : save.resolve());
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("honors canceled async changes without entering a pending state", async () => {
    const save = deferred();
    const onError = vi.fn();
    render(<Switch onError={onError} onCheckedChange={(_, details) => { details.cancel(); return save.promise; }} />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).not.toHaveAttribute("data-pending");
    await act(async () => save.reject(new Error("Canceled")));
    expect(onError).not.toHaveBeenCalled();
  });

  it("handles a thrown callback without committing the change", () => {
    const onError = vi.fn();
    const error = new Error("Failed");
    render(<Switch onCheckedChange={() => { throw error; }} onError={onError} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("resets the form and ignores an outstanding result, including an external form", async () => {
    const save = deferred();
    render(<><form id="settings" data-testid="form" /><Switch form="settings" name="sync" onCheckedChange={() => save.promise} /></>);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    await act(async () => { fireEvent.reset(screen.getByTestId("form")); });
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(control).not.toHaveAttribute("data-pending");
    await act(async () => save.resolve());
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("keeps a wrapping label unchanged while announcing saving and failure", async () => {
    const save = deferred();
    render(<label><Switch onCheckedChange={() => save.promise} />Sync</label>);
    const control = screen.getByRole("switch", { name: "Sync" });
    fireEvent.click(control);
    expect(control).toHaveAccessibleName("Sync");
    expect(screen.getByRole("status")).toHaveTextContent("Saving");
    await act(async () => save.reject(new Error("Offline")));
    expect(control).toHaveAccessibleName("Sync");
    expect(screen.getByRole("status")).toHaveTextContent("Could not save change.");
  });

  it("ignores late failures after unmount", async () => {
    const save = deferred();
    const onError = vi.fn();
    const { unmount } = render(<Switch onCheckedChange={() => save.promise} onError={onError} />);
    fireEvent.click(screen.getByRole("switch"));
    unmount();
    await act(async () => save.reject(new Error("Offline")));
    expect(onError).not.toHaveBeenCalled();
  });
});

describe("Switch drag and composition", () => {
  it("does not turn an outside release before capture into a hover drag", () => {
    const change = vi.fn();
    render(<Switch onCheckedChange={change} />);
    const control = screen.getByRole("switch");
    geometry(control);
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: 100, clientY: 10 };
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientY: 50 });
    fireEvent.pointerLeave(control, { ...pointer, clientY: 50 });
    expect(control.setPointerCapture).not.toHaveBeenCalled();
    fireEvent.pointerUp(document.body, { ...pointer, buttons: 0, clientY: 50 });
    fireEvent.pointerMove(control, { ...pointer, buttons: 0, clientX: 112 });
    expect(control.setPointerCapture).not.toHaveBeenCalled();
    expect(control).not.toHaveAttribute("data-dragging");
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(change).not.toHaveBeenCalled();
    drag(control, 12);
    expect(change).toHaveBeenCalledOnce();
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it.each(["ltr", "rtl"] as const)("commits once past the midpoint and suppresses the trailing pointer click (%s)", (direction) => {
    const onCheckedChange = vi.fn();
    render(<Switch style={{ direction }} onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    geometry(control);
    drag(control, direction === "rtl" ? -12 : 12);
    expect(control).toHaveAttribute("aria-checked", "true");
    fireEvent.click(control, { detail: 1 });
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledOnce();
    drag(control, direction === "rtl" ? 12 : -12);
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it.each(["pointerup", "pointercancel", "lostpointercapture"])("does not toggle on a short or canceled drag (%s)", (end) => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole("switch");
    geometry(control);
    drag(control, end === "pointerup" ? 4 : 12, end);
    fireEvent.click(control, { detail: 1 });
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control).not.toHaveAttribute("data-dragging");
    // The next deliberate pointer press must not be swallowed after cancellation.
    fireEvent.pointerDown(control, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 });
    fireEvent.pointerUp(control, { pointerId: 1, clientX: 100 });
    fireEvent.click(control, { detail: 1 });
    expect(onCheckedChange).toHaveBeenCalledOnce();
  });

  it("honors canceled changes and inherited disabled/read-only states while dragging", () => {
    const change = vi.fn((_, details) => details.cancel());
    const { rerender } = render(<Switch onCheckedChange={change} />);
    let control = screen.getByRole("switch");
    geometry(control);
    drag(control, 12);
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(change).toHaveBeenCalledOnce();
    rerender(<Field.Root disabled><Switch onCheckedChange={change} /></Field.Root>);
    control = screen.getByRole("switch");
    geometry(control);
    drag(control, 12);
    expect(change).toHaveBeenCalledOnce();
    rerender(<Switch readOnly onCheckedChange={change} />);
    control = screen.getByRole("switch");
    geometry(control);
    drag(control, 12);
    expect(change).toHaveBeenCalledOnce();
  });

  it("forwards custom rendering, refs, state-aware classes, field errors, and decorative marks", () => {
    const ref = createRef<HTMLElement>();
    render(<Field.Root invalid><Field.Label>Sync</Field.Label>
      <Switch ref={ref} icons nativeButton render={<button data-testid="custom" />} className={(state) => state.checked ? "on" : "off"} />
    </Field.Root>);
    const control = screen.getByRole("switch", { name: "Sync" });
    expect(ref.current).toBe(control);
    expect(control.tagName).toBe("BUTTON");
    expect(control).toHaveClass("off");
    expect(control).toHaveAttribute("data-invalid");
    expect(control.querySelector("[data-slot=switch-icons]")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(control);
    expect(control).toHaveClass("on");
  });
});
