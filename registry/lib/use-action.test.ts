import { act, renderHook } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useAction } from "./use-action";

afterEach(() => vi.useRealTimers());

describe("useAction", () => {
  it.each([0, 1000])("reports success after unmount with pendingDelay=%i without restarting timers", async (pendingDelay) => {
    vi.useFakeTimers();
    let finish!: () => void;
    const action = () => new Promise<void>((resolve) => { finish = resolve; });
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result, unmount } = renderHook(() => useAction({ action, onSuccess, onError, pendingDelay }));

    let run!: Promise<void>;
    act(() => { run = result.current.run(); });
    unmount();
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      finish();
      await run;
    });

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, 1000])("reports failure after unmount with pendingDelay=%i without restarting timers", async (pendingDelay) => {
    vi.useFakeTimers();
    let fail!: (error: Error) => void;
    const error = new Error("offline");
    const action = () => new Promise<void>((_, reject) => { fail = reject; });
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result, unmount } = renderHook(() => useAction({ action, onSuccess, onError, pendingDelay }));

    let run!: Promise<void>;
    act(() => { run = result.current.run(); });
    unmount();

    await act(async () => {
      fail(error);
      await run;
    });

    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
