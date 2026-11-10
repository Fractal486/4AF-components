import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ActionButton } from "./action-button";

afterEach(() => vi.useRealTimers());

describe("ActionButton feedback controls", () => {
  it("renders externally supplied states without requiring an action", async () => {
    const { rerender } = render(<ActionButton status="pending" labels={{ pending: "Saving", success: "Saved", error: "Failed" }}>Save</ActionButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    rerender(<ActionButton status="success" labels={{ success: "Saved" }}>Save</ActionButton>);
    expect(button).toHaveAttribute("data-status", "success");
    expect(button).not.toHaveAttribute("aria-busy");
    await waitFor(() => expect(button).toHaveAccessibleName("Saved"));
  });

  it("resolves and announces the rejection message only after failure", async () => {
    const reason = new Error("Card declined");
    const label = vi.fn((error: unknown) => error instanceof Error ? error.message : "Failed");
    const { container } = render(<ActionButton action={() => { throw reason; }} labels={{ error: label }}>Pay</ActionButton>);
    expect(label).not.toHaveBeenCalled();
    const button = screen.getByRole("button", { name: "Pay" });
    await act(async () => fireEvent.click(button));
    expect(label).toHaveBeenCalledWith(reason);
    expect(button).toHaveAccessibleName("Card declined");
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("Card declined");
  });

  it("accepts an external error and composes hover/focus handlers while holding it", () => {
    vi.useFakeTimers();
    const onStatusChange = vi.fn();
    const onPointerEnter = vi.fn(), onPointerLeave = vi.fn(), onFocus = vi.fn(), onBlur = vi.fn(), onKeyDown = vi.fn();
    render(<ActionButton status="error" error={new Error("Offline")} labels={{ error: error => (error as Error).message }}
      onStatusChange={onStatusChange} revertAfter={{ error: 100 }} onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}>Retry</ActionButton>);
    const button = screen.getByRole("button", { name: "Offline" });
    // jsdom has no keyboard modality; headless Chrome checks the real selector.
    const matches = button.matches.bind(button);
    button.matches = selector => selector === ":focus-visible" || matches(selector);
    fireEvent.pointerEnter(button, { pointerType: "mouse" });
    fireEvent.focus(button);
    fireEvent.keyDown(button, { key: "ArrowRight" });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerLeave(button);
    act(() => vi.advanceTimersByTime(500));
    expect(onStatusChange).not.toHaveBeenCalled();
    fireEvent.blur(button);
    act(() => vi.advanceTimersByTime(100));
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("idle");
    for (const handler of [onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown]) expect(handler).toHaveBeenCalledOnce();
  });
});
