import { act, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { renderToString } from "react-dom/server";
import { prefersReducedMotion, subscribeReducedMotion } from "./reduced-motion";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("can be read and subscribed on the server", () => {
  vi.stubGlobal("window", undefined);
  expect(prefersReducedMotion()).toBe(false);
  expect(() => subscribeReducedMotion(() => {})()).not.toThrow();
  expect(prefersReducedMotion(null)).toBe(false);
});

it("handles a window with no matchMedia", () => {
  const view = {} as Window;
  expect(prefersReducedMotion(view)).toBe(false);
  expect(() => subscribeReducedMotion(() => {}, view)()).not.toThrow();
});

it("reads the owning window instead of the global window", () => {
  const matchMedia = vi.fn(() => ({ matches: true }));
  expect(prefersReducedMotion({ matchMedia } as unknown as Window)).toBe(true);
  expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
});

it("updates live subscribers, cleans up, and keeps server rendering deterministic", () => {
  const media = new EventTarget() as MediaQueryList;
  let reduced = true;
  Object.defineProperty(media, "matches", { get: () => reduced });
  vi.spyOn(window, "matchMedia").mockReturnValue(media);
  const remove = vi.spyOn(media, "removeEventListener");
  function Preference() {
    const value = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
    return <output>{String(value)}</output>;
  }
  expect(renderToString(<Preference />)).toContain("false");
  const { unmount } = render(<Preference />);
  expect(screen.getByRole("status")).toHaveTextContent("true");
  act(() => { reduced = false; media.dispatchEvent(new Event("change")); });
  expect(screen.getByRole("status")).toHaveTextContent("false");
  unmount();
  expect(remove).toHaveBeenCalledWith("change", expect.any(Function));
});
