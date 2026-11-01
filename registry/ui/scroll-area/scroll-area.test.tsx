import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { ScrollArea, ScrollAreaScrollbar } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders the children in a viewport the caller can reach by ref", () => {
    const viewportRef = createRef<HTMLDivElement>();
    render(
      <ScrollArea className="h-40" viewportClassName="list-viewport" viewportRef={viewportRef}>
        <p>Row</p>
      </ScrollArea>,
    );

    const viewport = viewportRef.current!;
    expect(viewport).toHaveClass("list-viewport", "flex-auto");
    expect(viewport).toContainElement(screen.getByText("Row"));
    expect(viewport.parentElement).toHaveClass("h-40");
  });

  it("puts orientation and scrollbar visibility on the root", () => {
    const { container } = render(
      <ScrollArea orientation="both" scrollbar="always">
        Content
      </ScrollArea>,
    );
    const root = container.firstElementChild!;

    expect(root).toHaveAttribute("data-orientation", "both");
    expect(root).toHaveAttribute("data-scrollbar", "always");
  });

  it("masks the overflowing edges by default, unless turned off", () => {
    const plainRef = createRef<HTMLDivElement>();
    const fadedRef = createRef<HTMLDivElement>();
    render(
      <>
        <ScrollArea fade={false} viewportRef={plainRef}>Plain</ScrollArea>
        <ScrollArea viewportRef={fadedRef}>Faded</ScrollArea>
      </>,
    );

    expect(plainRef.current!.className).not.toContain("mask-image");
    expect(fadedRef.current!.className).toContain("var(--scroll-area-overflow-y-start,0px)");
    expect(fadedRef.current!.className).toContain("[mask-composite:intersect]");
  });

  it("sizes content to its children only when the horizontal axis scrolls", () => {
    const verticalRef = createRef<HTMLDivElement>();
    const horizontalRef = createRef<HTMLDivElement>();
    render(
      <>
        <ScrollArea viewportRef={verticalRef}>
          <span>Vertical</span>
        </ScrollArea>
        <ScrollArea orientation="horizontal" viewportRef={horizontalRef}>
          <span>Horizontal</span>
        </ScrollArea>
      </>,
    );

    expect(screen.getByText("Vertical").parentElement).toBe(verticalRef.current);
    expect(screen.getByText("Horizontal").parentElement).not.toBe(horizontalRef.current);
    expect(screen.getByText("Horizontal").parentElement).toHaveStyle({ minWidth: "fit-content" });
  });

  it("re-measures overflow when the viewport's children change", async () => {
    const viewportRef = createRef<HTMLDivElement>();
    const { rerender } = render(
      <ScrollArea className="h-40" viewportRef={viewportRef}>
        <p>Row one</p>
        <p>Row two</p>
      </ScrollArea>,
    );
    const onScroll = vi.fn();
    viewportRef.current!.addEventListener("scroll", onScroll);

    rerender(
      <ScrollArea className="h-40" viewportRef={viewportRef}>
        <p>Row one</p>
      </ScrollArea>,
    );
    await waitFor(() => expect(onScroll).toHaveBeenCalled());
  });
});

describe("Scroll Area state-based classes", () => {
  it("merges root and viewport classes and updates them when scrolling and overflow change", async () => {
    const rootRef = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    render(
      <ScrollArea
        ref={rootRef}
        viewportRef={viewportRef}
        className={({ hasOverflowY }) => hasOverflowY ? "root-overflows" : "root-fits"}
        viewportClassName={({ scrolling }) => scrolling ? "viewport-scrolling" : "viewport-idle"}
      >
        <p>Content</p>
      </ScrollArea>,
    );
    expect(rootRef.current).toHaveClass("root-fits", "flex", "overflow-hidden");
    expect(viewportRef.current).toHaveClass("viewport-idle", "flex-auto");
    const viewport = viewportRef.current!;
    Object.defineProperties(viewport, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 200 },
    });
    fireEvent.wheel(viewport, { deltaY: 40 });
    viewport.scrollTop = 40;
    fireEvent.scroll(viewport);
    await waitFor(() => expect(rootRef.current).toHaveClass("root-overflows"));
    await waitFor(() => expect(viewport).toHaveClass("viewport-scrolling"));
    expect(viewport.className).toContain("mask-image");
    Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: 100 });
    viewport.scrollTop = 0;
    fireEvent.scroll(viewport);
    await waitFor(() => expect(rootRef.current).toHaveClass("root-fits"));
  });

  it("passes live orientation and hover state to custom track and thumb classes", async () => {
    const { container } = render(
      <BaseScrollArea.Root data-testid="custom-scroll-root">
        <BaseScrollArea.Viewport><span>Content</span></BaseScrollArea.Viewport>
        <ScrollAreaScrollbar
          keepMounted
          orientation="horizontal"
          className={({ orientation, hovering }) => "track-" + orientation + (hovering ? " track-hovered" : "")}
          thumbClassName={({ orientation }) => "thumb-" + orientation}
        />
      </BaseScrollArea.Root>,
    );
    const track = container.querySelector(".track-horizontal")!;
    expect(track).toHaveClass("flex", "touch-none");
    expect(container.querySelector(".thumb-horizontal")).toHaveClass("rounded-full");
    fireEvent.pointerEnter(screen.getByTestId("custom-scroll-root"), { pointerType: "mouse" });
    await waitFor(() => expect(track).toHaveClass("track-hovered"));
  });
});
