import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./table-of-contents";

let intersectionCallback: IntersectionObserverCallback | undefined;

class IntersectionObserverStub {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  intersectionCallback = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TableOfContents", () => {
  it("keeps the current section highlighted while prose sits between headings", async () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const firstHeading = document.createElement("h2");
    const secondHeading = document.createElement("h2");
    firstHeading.id = "first-section";
    secondHeading.id = "second-section";
    root.append(firstHeading, secondHeading);
    document.body.append(root);

    const firstTop = -120;
    const secondTop = 320;
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(firstHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: firstTop }) as DOMRect,
    );
    vi.spyOn(secondHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: secondTop }) as DOMRect,
    );

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContents
        rootRef={rootRef}
        items={[
          { id: firstHeading.id, title: "First section" },
          { id: secondHeading.id, title: "Second section" },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveClass(
      "overflow-y-auto",
      "overscroll-y-contain",
      "[overflow-anchor:none]",
      "[scrollbar-width:none]",
    );

    expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "Second section" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(container.querySelectorAll("svg path")[0]).toHaveAttribute("stroke-dasharray", "3 3");
    expect(container.querySelectorAll("svg path")[0]).toHaveAttribute("stroke-width", "1");
    expect(container.querySelectorAll("svg path")[1]).toHaveStyle({ opacity: "1" });
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDashoffset).toBe(
      "-4",
    );

    root.scrollTop = 620;
    fireEvent.scroll(root);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Second section" })).toHaveAttribute(
        "aria-current",
        "location",
      ),
    );
    expect(screen.getByRole("link", { name: "First section" })).not.toHaveAttribute("aria-current");
    expect(container.querySelectorAll("svg path")[1]).toHaveStyle({ opacity: "1" });

    root.remove();
  });

  it("keeps the single marker beside one heading when several headings are visible", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const firstHeading = document.createElement("h2");
    const secondHeading = document.createElement("h2");
    firstHeading.id = "first-visible";
    secondHeading.id = "second-visible";
    root.append(firstHeading, secondHeading);
    document.body.append(root);

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(firstHeading, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(secondHeading, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.dataset.tocId === secondHeading.id ? 30 : 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.dataset.tocId ? 24 : 0;
    });

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContents
        variant="single"
        rootRef={rootRef}
        items={[
          { id: firstHeading.id, title: "First visible" },
          { id: secondHeading.id, title: "Second visible" },
        ]}
      />,
    );

    act(() => {
      intersectionCallback?.(
        [
          { target: firstHeading, isIntersecting: true },
          { target: secondHeading, isIntersecting: true },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByRole("navigation", { name: "Table of contents" })).toHaveAttribute(
      "data-variant",
      "single",
    );
    expect(screen.getByRole("link", { name: "First visible" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "Second visible" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(container.querySelectorAll("svg path")[0]).toHaveAttribute("d", "M 1 4 L 1 50");
    expect(container.querySelectorAll("svg path")[1]).toHaveAttribute("d", "M 1 0 L 1 54");
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDasharray).toBe(
      "16 55",
    );
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDashoffset).toBe(
      "-4",
    );

    root.remove();
  });

  it("moves directly to a clicked heading during smooth scrolling", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const headings = ["first", "middle", "last"].map((id) => {
      const heading = document.createElement("h2");
      heading.id = id;
      root.append(heading);
      return heading;
    });
    document.body.append(root);

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    headings.forEach((heading, index) => {
      vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({
        top: index * 100,
      } as DOMRect);
    });
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return headings.findIndex((heading) => heading.id === this.dataset.tocId) * 30;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.dataset.tocId ? 24 : 0;
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(headings[2], "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContents
        variant="single"
        rootRef={rootRef}
        items={headings.map((heading) => ({ id: heading.id, title: heading.id }))}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "last" }));

    // Simulate the middle heading intersecting while the browser scrolls past it.
    act(() => {
      intersectionCallback?.(
        [{ target: headings[1], isIntersecting: true }] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("link", { name: "last" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDashoffset).toBe(
      "-64",
    );

    act(() => {
      root.dispatchEvent(new Event("scrollend"));
    });
    expect(screen.getByRole("link", { name: "last" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    root.remove();
  });

  it("keeps tracking when the browser has no scrollIntoView method", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const heading = document.createElement("h2");
    heading.id = "no-native-scroll";
    root.append(heading);
    document.body.append(root);
    Object.defineProperty(heading, "scrollIntoView", {
      configurable: true,
      value: undefined,
    });

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    render(
      <TableOfContents
        rootRef={rootRef}
        items={[{ id: heading.id, title: "No native scroll" }]}
      />,
    );

    expect(() => fireEvent.click(screen.getByRole("link", { name: "No native scroll" }))).not.toThrow();
    expect(screen.getByRole("link", { name: "No native scroll" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    root.remove();
  });

  it("keeps the span range while smooth scrolling crosses intermediate headings", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const headings = ["first-span", "middle-span", "last-span", "after-span"].map((id) => {
      const heading = document.createElement("h2");
      heading.id = id;
      root.append(heading);
      return heading;
    });
    document.body.append(root);
    Object.defineProperty(root, "clientHeight", { configurable: true, value: 320 });
    Object.defineProperty(root, "scrollHeight", { configurable: true, value: 500 });

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    headings.forEach((heading, index) => {
      vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({
        top: index * 100,
      } as DOMRect);
    });
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return headings.findIndex((heading) => heading.id === this.dataset.tocId) * 30;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.dataset.tocId ? 24 : 0;
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(headings[2], "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const { container } = render(
      <TableOfContents
        variant="span"
        rootRef={rootRef}
        items={headings.map((heading) => ({ id: heading.id, title: heading.id }))}
      />,
    );

    act(() => {
      intersectionCallback?.(
        [
          { target: headings[0], isIntersecting: true },
          { target: headings[1], isIntersecting: true },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });
    fireEvent.click(screen.getByRole("link", { name: "last-span" }));

    // Intermediate observer updates must not collapse the span marker to the clicked row.
    act(() => {
      intersectionCallback?.(
        headings.map((heading) => ({ target: heading, isIntersecting: true })) as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDasharray).toBe(
      "46 115",
    );
    expect((container.querySelectorAll("svg path")[1] as SVGPathElement).style.strokeDashoffset).toBe(
      "-64",
    );

    root.remove();
  });

  it("withholds the headings until the list is pointed at, in the hover variant", () => {
    render(
      <TableOfContents
        labels="hover"
        items={[
          { id: "first", title: "First section" },
          { id: "last", title: "Last section" },
        ]}
      />,
    );

    // The group is on the nav, not the row: one heading appearing under the pointer while
    // the rest stayed hidden would be a different component.
    expect(screen.getByRole("navigation")).toHaveClass("group/toc");

    const entry = screen.getByRole("link", { name: "First section" });
    expect(entry).toHaveClass("opacity-0", "group-hover/toc:opacity-100");
    // Keyboard focus reaches it too — but a mouse press does not, or clicking an
    // entry would hold the list open after the pointer left. A touch screen never hovers.
    expect(entry).toHaveClass(
      "group-has-[:focus-visible]/toc:opacity-100",
      "pointer-coarse:opacity-100",
    );
  });


  it("re-measures when the article grows under it", async () => {
    // The bug this covers: on a first open the images have not landed, so every heading is
    // measured too high. The list then runs ahead of the article — highlighting sections
    // the reader has not reached — and snaps backwards once the real positions arrive.
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

    const root = document.createElement("div");
    const firstHeading = document.createElement("h2");
    const secondHeading = document.createElement("h2");
    firstHeading.id = "grow-first";
    secondHeading.id = "grow-second";
    root.append(firstHeading, secondHeading);
    document.body.append(root);

    let scrollHeight = 1000;
    Object.defineProperty(root, "scrollHeight", { get: () => scrollHeight });
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    // Before the image lands the second heading sits at 200; after, it is pushed to 900.
    let secondTop = 200;
    vi.spyOn(firstHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: 0 }) as DOMRect,
    );
    vi.spyOn(secondHeading, "getBoundingClientRect").mockImplementation(
      () => ({ top: secondTop - root.scrollTop }) as DOMRect,
    );

    // Both held stable across renders, as a real caller's would be. Passing fresh objects
    // re-runs the tracking effect on every render, which re-measures as a side effect and
    // hides the very thing this covers.
    const rootRef = { current: root } as RefObject<HTMLElement | null>;
    const items = [
      { id: firstHeading.id, title: "First section" },
      { id: secondHeading.id, title: "Second section" },
    ];
    render(<TableOfContents rootRef={rootRef} items={items} />);

    // The article grows before the reader has scrolled anywhere near the second heading.
    secondTop = 900;
    scrollHeight = 2000;
    root.scrollTop = 400;
    fireEvent.scroll(root);

    // Against the stale offsets this would already be the second section.
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "First section" })).toHaveAttribute(
        "aria-current",
        "location",
      ),
    );
    expect(screen.getByRole("link", { name: "Second section" })).not.toHaveAttribute(
      "aria-current",
    );

    root.remove();
  });

});
