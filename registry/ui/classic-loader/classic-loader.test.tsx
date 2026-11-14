import { createRef } from "react";
import { fireEvent, render } from "@testing-library/react";
import { ClassicLoader } from "./classic-loader";

describe("ClassicLoader", () => {
  it("removes the spinner and status when not loading, then restores them", () => {
    const ref = createRef<HTMLElement>();
    const { container, queryByRole, rerender } = render(<ClassicLoader ref={ref} label="Working" loading={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(queryByRole("status")).not.toBeInTheDocument();
    expect(ref.current).toBeNull();
    rerender(<ClassicLoader ref={ref} label="Working" loading />);
    expect(queryByRole("status", { name: "Working" })).toBe(ref.current);
    expect(ref.current?.querySelectorAll("rect")).toHaveLength(12);
    expect(ref.current).not.toHaveAttribute("loading");
    rerender(<ClassicLoader ref={ref} label="Working" loading={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(ref.current).toBeNull();
    rerender(<ClassicLoader label="Working" />);
    expect(queryByRole("status", { name: "Working" })).toBeInTheDocument();
  });

  it("announces an optional status and otherwise remains decorative", () => {
    const { getByRole, container, rerender } = render(<ClassicLoader label="Loading results" />);
    expect(getByRole("status", { name: "Loading results" })).not.toHaveAttribute("aria-hidden");
    rerender(<ClassicLoader />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).not.toHaveAttribute("role");
  });

  it("starts with a staggered trail and updates speed without replacing bars", () => {
    const { container, rerender } = render(<ClassicLoader />);
    const root = container.firstElementChild!;
    const firstBar = root.querySelector("rect")!;
    expect(root.querySelectorAll("rect")).toHaveLength(12);
    expect(firstBar.style.animationDelay).toContain("(0 - 12) / 12");
    rerender(<ClassicLoader speed={0.5} />);
    expect(root).toHaveAttribute("data-state", "loading");
    expect((root as HTMLElement).style.getPropertyValue("--classic-cycle")).toBe("2.4s");
    expect(root.querySelector("rect")).toBe(firstBar);
    rerender(<ClassicLoader speed={2} />);
    expect((root as HTMLElement).style.getPropertyValue("--classic-cycle")).toBe("0.6s");
    expect(root.querySelector("rect")).toBe(firstBar);
  });

  it.each([0, -1, Infinity, NaN])("uses normal playback for invalid speed %s", (speed) => {
    const { container } = render(<ClassicLoader speed={speed} />);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--classic-cycle")).toBe("1.2s");
  });

  it("forwards refs, element props, and custom styles", () => {
    const ref = createRef<HTMLElement>();
    const { getByTestId } = render(
      <ClassicLoader ref={ref} data-testid="loader" size="lg" className="text-muted-foreground" style={{ color: "currentColor" }} />,
    );
    expect(ref.current).toBe(getByTestId("loader"));
    expect(ref.current).toHaveAttribute("data-size", "lg");
    expect(ref.current).toHaveClass("size-8", "text-muted-foreground");
    expect(ref.current?.style.color).toBe("currentcolor");
  });

  it("composes an alternate root, refs, classes, and events through Slot", () => {
    const ref = createRef<HTMLElement>();
    const childRef = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const childClick = vi.fn();
    const { getByRole } = render(
      <ClassicLoader asChild ref={ref} label="Working" onClick={onClick}>
        <div ref={childRef} className="text-muted-foreground" onClick={childClick} />
      </ClassicLoader>,
    );
    const root = getByRole("status", { name: "Working" });
    expect(root.tagName).toBe("DIV");
    expect(root.querySelectorAll("rect")).toHaveLength(12);
    expect(root).toHaveClass("text-muted-foreground");
    expect(ref.current).toBe(root);
    expect(childRef.current).toBe(root);
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalledOnce();
    expect(childClick).toHaveBeenCalledOnce();
  });
});
