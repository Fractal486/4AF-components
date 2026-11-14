import { act, createEvent, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { vi } from "vitest";
import { useTableOfContentsTracking } from "./table-of-contents-tracking";
import { TableOfContents } from "../ui/table-of-contents/table-of-contents";
import { TableOfContentsLines } from "../ui/table-of-contents-lines/table-of-contents-lines";

describe.each([
  ["TableOfContents", TableOfContents],
  ["TableOfContentsLines", TableOfContentsLines],
] as const)("%s link activation", (_, Component) => {
  function setup() {
    render(
      <>
        <h2 id="target-heading">Target heading</h2>
        <Component items={[{ id: "target-heading", title: "Target" }]} />
      </>,
    );
    const scrollIntoView = vi.fn();
    Object.assign(screen.getByRole("heading"), { scrollIntoView });
    return { link: screen.getByRole("link", { name: "Target" }), scrollIntoView };
  }

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])("preserves native navigation for %j", (options) => {
    const { link, scrollIntoView } = setup();
    const click = createEvent.click(link, options);
    fireEvent(link, click);

    expect(link).toHaveAttribute("href", "#target-heading");
    expect(click.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("still intercepts an ordinary click for smooth scrolling", () => {
    const { link, scrollIntoView } = setup();
    const click = createEvent.click(link, { button: 0 });
    fireEvent(link, click);

    expect(click.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: "smooth", block: "start" });
  });
});

it("coalesces content layout changes and keeps ordinary scrolling on cached offsets", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  let resize: (() => void) | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });

  const root = document.createElement("div");
  const image = document.createElement("img");
  root.append(image);
  let offset = 0;
  let headingReads = 0;
  const items = [0, 500].map((top, index) => {
    const heading = document.createElement("h2");
    heading.id = `tracked-heading-${index}`;
    heading.getBoundingClientRect = () => {
      headingReads++;
      return { top: top + offset - root.scrollTop } as DOMRect;
    };
    root.append(heading);
    return { id: heading.id };
  });
  root.getBoundingClientRect = () => ({ top: 0 } as DOMRect);
  // Moving headings need not change the document's total height.
  Object.defineProperty(root, "scrollHeight", { value: 2000 });
  root.scrollTop = 600;
  document.body.append(root);
  const rootRef = { current: root };
  const view = renderHook(() => useTableOfContentsTracking({ items, rootRef, settle: "pin" }));
  const flushFrame = () => act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(0);
  });

  try {
    expect(view.result.current.currentId).toBe(items[1]!.id);
    expect(headingReads).toBe(2);

    headingReads = 0;
    offset = 200;
    fireEvent.scroll(root);
    for (let index = 0; index < 6; index++) fireEvent.load(image);
    fireEvent.resize(window);
    resize!();
    expect(headingReads).toBe(0);
    expect(frames.size).toBe(1);
    flushFrame();
    expect(headingReads).toBe(2);
    expect(view.result.current.currentId).toBe(items[0]!.id);

    headingReads = 0;
    root.scrollTop = 800;
    fireEvent.scroll(root);
    flushFrame();
    expect(view.result.current.currentId).toBe(items[1]!.id);
    expect(headingReads).toBe(0);

    fireEvent.load(image);
    expect(frames.size).toBe(1);
    view.unmount();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalledOnce();
    fireEvent.load(image);
    fireEvent.resize(window);
    expect(frames.size).toBe(0);
  } finally {
    view.unmount();
    root.remove();
    vi.unstubAllGlobals();
  }
});
