import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ScrollArea } from "./scroll-area";

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

  it("masks the overflowing edges only when asked", () => {
    const plainRef = createRef<HTMLDivElement>();
    const fadedRef = createRef<HTMLDivElement>();
    render(
      <>
        <ScrollArea viewportRef={plainRef}>Plain</ScrollArea>
        <ScrollArea fade viewportRef={fadedRef}>
          Faded
        </ScrollArea>
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
});
