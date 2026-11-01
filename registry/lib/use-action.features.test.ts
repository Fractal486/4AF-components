import { act, renderHook } from "@testing-library/react";
import type { PointerEvent } from "react";
import { useAction, type ActionStatus } from "./use-action";

afterEach(() => vi.useRealTimers());

describe("useAction feedback controls", () => {
  it("uses separate success and error reset times", async () => {
    vi.useFakeTimers();
    let fail = false;
    const { result } = renderHook(() => useAction({
      action: () => { if (fail) throw new Error("Offline"); },
      revertAfter: { success: 100, error: 400 },
    }));
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.status).toBe("idle");
    fail = true;
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(399));
    expect(result.current.status).toBe("error");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("pauses the remaining error time until both hover and focus leave", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAction({ action: () => { throw new Error("Offline"); }, revertAfter: 400 }));
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.buttonProps.onPointerEnter({ pointerType: "mouse" } as PointerEvent<HTMLElement>));
    act(() => result.current.buttonProps.onFocus());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.buttonProps.onPointerLeave());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("error");
    act(() => result.current.buttonProps.onBlur());
    act(() => vi.advanceTimersByTime(299));
    expect(result.current.status).toBe("error");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("does not hold errors for touch hover or hold success while focused", async () => {
    vi.useFakeTimers();
    let fail = true;
    const { result } = renderHook(() => useAction({ action: () => { if (fail) throw "Offline"; }, revertAfter: 100 }));
    act(() => result.current.buttonProps.onPointerEnter({ pointerType: "touch" } as PointerEvent<HTMLElement>));
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.status).toBe("idle");
    fail = false;
    act(() => result.current.buttonProps.onFocus());
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.status).toBe("idle");
  });

  it("keeps external status authoritative and reports reset requests", () => {
    vi.useFakeTimers();
    const onStatusChange = vi.fn();
    const { result, rerender } = renderHook(({ status }: { status: ActionStatus }) => useAction({ status, onStatusChange, revertAfter: 100 }), { initialProps: { status: "success" as ActionStatus } });
    act(() => vi.advanceTimersByTime(100));
    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("idle");
    expect(result.current.status).toBe("success");
    rerender({ status: "idle" });
    expect(result.current.status).toBe("idle");
  });

  it("blocks actions while externally pending", async () => {
    const action = vi.fn();
    const { result } = renderHook(() => useAction({ status: "pending", action }));
    await act(() => result.current.run());
    expect(action).not.toHaveBeenCalled();
  });

  it("does not restart the reset timer when callback identities change", async () => {
    vi.useFakeTimers();
    const latest = vi.fn();
    const { result, rerender } = renderHook(({ changed }) => useAction({ action: () => {}, onStatusChange: changed ? latest : () => {}, revertAfter: 100 }), { initialProps: { changed: false } });
    await act(() => result.current.run());
    act(() => vi.advanceTimersByTime(60));
    rerender({ changed: true });
    act(() => vi.advanceTimersByTime(40));
    expect(result.current.status).toBe("idle");
    expect(latest).toHaveBeenCalledExactlyOnceWith("idle");
  });

  it.each([false, true])("ignores an old request after reset and a fresh run (reject=%s)", async (reject) => {
    vi.useFakeTimers();
    let finish!: () => void;
    let fail!: (reason: unknown) => void;
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const action = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; })).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAction({ action, onSuccess, onError, pendingDelay: 100 }));
    let old!: Promise<void>;
    act(() => { old = result.current.run(); });
    act(() => result.current.reset());
    expect(vi.getTimerCount()).toBe(0);
    await act(() => result.current.run());
    expect(result.current.status).toBe("success");
    await act(async () => { if (reject) fail(new Error("Old failure")); else finish(); await old; });
    expect(result.current.status).toBe("success");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains a function rejection as data without invoking it", async () => {
    const failure = vi.fn();
    const { result } = renderHook(() => useAction({ action: () => { throw failure; } }));
    await act(() => result.current.run());
    expect(result.current.error).toBe(failure);
    expect(failure).not.toHaveBeenCalled();
  });

  it("keeps the previous error available during a delayed retry", async () => {
    vi.useFakeTimers();
    const failure = new Error("Offline");
    let finish!: () => void;
    const action = vi.fn().mockRejectedValueOnce(failure).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useAction({ action, pendingDelay: 100 }));
    await act(() => result.current.run());
    let retry!: Promise<void>;
    act(() => { retry = result.current.run(); });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(failure);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.status).toBe("pending");
    await act(async () => { finish(); await retry; });
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeUndefined();
  });
});
