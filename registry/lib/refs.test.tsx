import { vi } from "vitest";
import { composeRefs } from "./refs";

describe("composeRefs", () => {
  it("runs React 19 callback cleanup and clears object refs", () => {
    const node = document.createElement("button");
    const callbackCleanup = vi.fn();
    const callback = vi.fn(() => callbackCleanup);
    const objectRef = { current: null as HTMLButtonElement | null };
    const composed = composeRefs<HTMLButtonElement>(callback, objectRef);

    const cleanup = (composed as (value: HTMLButtonElement | null) => void | (() => void))(node);

    expect(callback).toHaveBeenCalledWith(node);
    expect(objectRef.current).toBe(node);
    expect(cleanup).toBeTypeOf("function");

    cleanup?.();
    expect(callbackCleanup).toHaveBeenCalledOnce();
    expect(objectRef.current).toBeNull();
  });

  it("clears legacy callback refs with null", () => {
    const callback = vi.fn();
    const composed = composeRefs<HTMLDivElement>(callback);
    const cleanup = (composed as (value: HTMLDivElement | null) => void | (() => void))(
      document.createElement("div"),
    );

    cleanup?.();
    expect(callback).toHaveBeenLastCalledWith(null);
  });
});
