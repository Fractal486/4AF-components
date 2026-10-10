import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useCommandSearch } from "./command-palette.search";

describe("useCommandSearch cancellation", () => {
  afterEach(() => vi.useRealTimers());

  it.each(["clear", "disable"])("discards a successful ignored-abort response after %s", async (mode) => {
    vi.useFakeTimers();
    let resolveOld!: (value: string[]) => void;
    let oldSignal!: AbortSignal;
    const onSearch = vi.fn((_query: string, signal: AbortSignal) => {
      oldSignal = signal;
      return new Promise<string[]>((resolve) => { resolveOld = resolve; });
    });
    const { result, rerender } = renderHook(
      ({ query, enabled }) => useCommandSearch(query, onSearch, { enabled, debounce: 10 }),
      { initialProps: { query: "old", enabled: true } },
    );
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(onSearch).toHaveBeenCalledOnce();
    rerender({ query: mode === "clear" ? "" : "old", enabled: mode !== "disable" });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { resolveOld(["abandoned result"]); });
    rerender({ query: "new", enabled: true });
    expect(result.current).toEqual({ results: null, searching: true, error: null });
  });

  it("retains accepted results while an active query is refined", async () => {
    vi.useFakeTimers();
    const source = vi.fn(async () => ["accepted result"]);
    const { result, rerender } = renderHook(
      (query) => useCommandSearch(query, source, { debounce: 10 }),
      { initialProps: "old" },
    );
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(result.current.searching).toBe(false);
    rerender("new");
    expect(result.current).toEqual({ results: ["accepted result"], searching: true, error: null });
  });
});
