import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DesktopPreview } from "./wireframe";

afterEach(() => vi.unstubAllGlobals());

it("scales the desktop viewport on resize without changing its layout dimensions", () => {
  let resize: ResizeObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const { unmount } = render(<DesktopPreview mobile={false}><button>Demo</button></DesktopPreview>);
  const viewport = screen.getByRole("button").parentElement!;
  const setWidth = (width: number) => act(() => resize(
    [{ contentRect: { width } } as ResizeObserverEntry],
    {} as ResizeObserver,
  ));
  expect(viewport).toHaveStyle({ width: `${960 / 0.9}px`, height: `${640 / 0.9}px` });
  // At the normal preview size the UI is only slightly smaller than native size.
  setWidth(960);
  expect(viewport).toHaveStyle({ transform: "scale(0.9)" });
  setWidth(720);
  expect(viewport).toHaveStyle({ transform: "scale(0.675)" });
  setWidth(1800);
  expect(viewport).toHaveStyle({ transform: "scale(0.9)" });
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it.each([
  { screenWidth: "desktop", phone: false, layout: 1 },
  { screenWidth: "phone", phone: true, layout: 0.7 },
])("lays the phone window out for a $screenWidth screen and scales it to fit", ({ phone, layout }) => {
  let resize: ResizeObserverCallback;
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: phone && query === "(max-width: 767px)",
    addEventListener() {},
    removeEventListener() {},
  }));
  render(<DesktopPreview mobile><button>Mobile</button></DesktopPreview>);
  const viewport = screen.getByRole("button").parentElement!;
  expect(viewport).toHaveAttribute("data-slot", "mobile-demo-viewport");
  // A desktop gets a true phone; a phone-width screen lays it out smaller and enlarges it.
  expect(viewport).toHaveStyle({ width: `${390 * layout}px`, height: `${844 * layout}px` });
  const setWidth = (width: number) => act(() => resize(
    [{ contentRect: { width } } as ResizeObserverEntry],
    {} as ResizeObserver,
  ));
  const at = (width: number) => `scale(${Math.min(1, width / 390) / layout})`;
  setWidth(390);
  expect(viewport).toHaveStyle({ transform: at(390) });
  setWidth(800);
  expect(viewport).toHaveStyle({ transform: at(390) });
  // A smaller frame shrinks the whole UI rather than keeping full-size controls in it.
  setWidth(195);
  expect(viewport).toHaveStyle({ transform: at(195) });
});
