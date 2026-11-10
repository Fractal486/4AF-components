import { act, cleanup, render, screen } from "@testing-library/react";
import { HeroBackdrop } from "./hero-backdrop";

vi.mock("next/dynamic", () => ({
  default: () => function Preview() { return <div data-testid="preview" />; },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function idleQueue() {
  let run: () => void = () => { throw new Error("No idle callback scheduled"); };
  const request = vi.fn((callback: () => void) => { run = callback; return 42; });
  const cancel = vi.fn();
  vi.stubGlobal("requestIdleCallback", request);
  vi.stubGlobal("cancelIdleCallback", cancel);
  return { request, cancel, flush: () => act(() => run()) };
}

it("reserves the frame and waits for load, then idle time before rendering the preview", () => {
  vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
  const idle = idleQueue();
  const { container } = render(<HeroBackdrop artworkClassName="aspect-square" />);
  expect(container.querySelector("[data-hero-artwork]")).toHaveClass("aspect-square", "w-full");
  expect(screen.queryByTestId("preview")).not.toBeInTheDocument();
  expect(idle.request).not.toHaveBeenCalled();

  act(() => window.dispatchEvent(new Event("load")));
  expect(idle.request).toHaveBeenCalledExactlyOnceWith(expect.any(Function), { timeout: 1000 });
  expect(screen.queryByTestId("preview")).not.toBeInTheDocument();
  idle.flush();
  expect(screen.getByTestId("preview")).toBeInTheDocument();
});

it("schedules immediately when hydration happens after load and cancels on unmount", () => {
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  const idle = idleQueue();
  const { unmount } = render(<HeroBackdrop />);
  expect(idle.request).toHaveBeenCalledOnce();
  unmount();
  expect(idle.cancel).toHaveBeenCalledWith(42);
});

it("removes the load listener when navigation happens before load", () => {
  vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
  const idle = idleQueue();
  const { unmount } = render(<HeroBackdrop />);
  unmount();
  act(() => window.dispatchEvent(new Event("load")));
  expect(idle.request).not.toHaveBeenCalled();
});

it("loads on a later task when idle callbacks are unavailable", () => {
  vi.useFakeTimers();
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  vi.stubGlobal("requestIdleCallback", undefined);
  render(<HeroBackdrop />);
  expect(screen.queryByTestId("preview")).not.toBeInTheDocument();
  act(() => vi.runOnlyPendingTimers());
  expect(screen.getByTestId("preview")).toBeInTheDocument();
});

it("cancels the fallback task on unmount", () => {
  vi.useFakeTimers();
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  vi.stubGlobal("requestIdleCallback", undefined);
  const { unmount } = render(<HeroBackdrop />);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
