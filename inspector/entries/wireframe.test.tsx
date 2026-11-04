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

it("leaves the mobile frame outside desktop scaling", () => {
  const { container } = render(<DesktopPreview mobile><button>Mobile</button></DesktopPreview>);
  expect(container.firstElementChild).toBe(screen.getByRole("button"));
});
