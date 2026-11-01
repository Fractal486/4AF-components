import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { ActionToggle, type ActionToggleActions } from "./action-toggle";

afterEach(() => vi.useRealTimers());

describe("ActionToggle feedback controls", () => {
  it("keeps external feedback independent from pressed state and blocks pending clicks", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(<ActionToggle pressed status="pending" onPressedChange={onPressedChange}>Follow</ActionToggle>);
    const toggle = screen.getByRole("button", { name: "Follow" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("aria-busy", "true");
    fireEvent.click(toggle);
    expect(onPressedChange).not.toHaveBeenCalled();
    rerender(<ActionToggle pressed status="success" onPressedChange={onPressedChange}>Follow</ActionToggle>);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).not.toHaveAttribute("aria-busy");
    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("shows and announces the actual rejection without changing the toggle", async () => {
    const failure = new Error("Network unavailable");
    const errorLabel = vi.fn((error: unknown) => (error as Error).message);
    const { container } = render(<ActionToggle defaultPressed action={() => { throw failure; }} labels={{ pressed: "Following", error: errorLabel }}>Follow</ActionToggle>);
    const toggle = screen.getByRole("button", { name: "Following" });
    expect(errorLabel).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(toggle));
    expect(errorLabel).toHaveBeenCalledWith(failure);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(toggle).toHaveAccessibleName("Network unavailable"));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("Network unavailable");
  });

  it("holds an external error until hover and focus both leave, composing caller handlers", () => {
    vi.useFakeTimers();
    const onStatusChange = vi.fn();
    const enter = vi.fn(), leave = vi.fn(), focus = vi.fn(), blur = vi.fn();
    render(<ActionToggle defaultPressed status="error" error={new Error("Offline")}
      onStatusChange={onStatusChange} labels={{ error: error => (error as Error).message }} revertAfter={400}
      onPointerEnter={enter} onPointerLeave={leave} onFocus={focus} onBlur={blur}>Follow</ActionToggle>);
    const toggle = screen.getByRole("button", { name: "Offline" });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerEnter(toggle, { pointerType: "mouse" });
    fireEvent.focus(toggle);
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.pointerLeave(toggle);
    act(() => vi.advanceTimersByTime(1000));
    expect(onStatusChange).not.toHaveBeenCalled();
    fireEvent.blur(toggle);
    act(() => vi.advanceTimersByTime(299));
    expect(onStatusChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("idle");
    expect(toggle).toHaveAttribute("data-status", "error");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    for (const handler of [enter, leave, focus, blur]) expect(handler).toHaveBeenCalledOnce();
  });

  it.each([false, true])("resets a pending action without committing its late result (reject=%s)", async (reject) => {
    const actions = createRef<ActionToggleActions>();
    const element = createRef<HTMLButtonElement>();
    const onPressedChange = vi.fn(), onError = vi.fn();
    let finish!: () => void, fail!: (error: Error) => void;
    const action = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; })).mockResolvedValue(undefined);
    render(<ActionToggle ref={element} actionsRef={actions} defaultPressed action={action} onPressedChange={onPressedChange} onError={onError}>Follow</ActionToggle>);
    const toggle = screen.getByRole("button");
    expect(element.current).toBe(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("data-status", "pending");
    act(() => actions.current!.reset());
    expect(toggle).toHaveAttribute("data-status", "idle");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await act(async () => { if (reject) fail(new Error("Old error")); else finish(); });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-status", "idle");
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(toggle));
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenCalledExactlyOnceWith(false);
    act(() => actions.current!.reset());
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("requests a controlled feedback reset without changing the parent's state", () => {
    const actions = createRef<ActionToggleActions>();
    const onStatusChange = vi.fn();
    render(<ActionToggle actionsRef={actions} status="error" pressed onStatusChange={onStatusChange}>Following</ActionToggle>);
    act(() => actions.current!.reset());
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("idle");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button")).toHaveAttribute("data-status", "error");
  });
});
