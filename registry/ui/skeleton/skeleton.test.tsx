import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Skeleton, SkeletonText } from "./skeleton";

describe("Skeleton", () => {
  it("is square by default, with corners opt-in", () => {
    const { container } = render(<Skeleton className="h-4 w-2/3" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]')!;
    // Text placeholders should not acquire a card's rounded corners by default.
    expect(skeleton.className).not.toContain("rounded");
    expect(skeleton).toHaveClass("data-[state=loading]:animate-pulse", "data-[state=loading]:bg-muted", "h-4", "w-2/3");
  });

  it("takes a radius from the call site", () => {
    const { container } = render(<Skeleton className="size-10 rounded-full" />);
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("rounded-full");
  });

  it("stops pulsing under reduced motion rather than collapsing the loop", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("motion-reduce:data-[state=loading]:animate-none");
  });

  it("hides standalone placeholders from assistive technology and interaction", () => {
    render(<Skeleton data-testid="placeholder"><button>Placeholder action</button></Skeleton>);
    expect(screen.getByTestId("placeholder")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("placeholder")).toHaveAttribute("inert");
    expect(screen.getByTestId("placeholder")).not.toHaveAttribute("aria-busy");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps real content mounted, inaccessible while loading, and reveals it when ready", () => {
    const { rerender } = render(<Skeleton loading data-testid="wrapper"><input aria-label="Name" defaultValue="Alex" /></Skeleton>);
    const wrapper = screen.getByTestId("wrapper");
    const content = wrapper.querySelector('[data-slot="skeleton-content"]');
    const input = wrapper.querySelector("input");
    expect(wrapper).toHaveAttribute("aria-busy", "true");
    expect(content).toHaveAttribute("inert");
    expect(content).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<Skeleton loading={false} data-testid="wrapper"><input aria-label="Name" defaultValue="Alex" /></Skeleton>);
    expect(screen.getByRole("textbox", { name: "Name" })).toBe(input);
    expect(content).not.toHaveAttribute("inert");
    expect(content).not.toHaveAttribute("aria-hidden");
    expect(wrapper).not.toHaveAttribute("aria-busy");
    expect(wrapper).toHaveAttribute("data-revealed");
    rerender(<Skeleton loading data-testid="wrapper"><input aria-label="Name" defaultValue="Alex" /></Skeleton>);
    expect(wrapper).not.toHaveAttribute("data-revealed");
    expect(content).toHaveAttribute("inert");
  });

  it("does not fade content that starts ready and supports inline rendering and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(<p>Balance <Skeleton ref={ref} render={<span />} loading={false}><strong>$12</strong></Skeleton></p>);
    expect(ref.current?.tagName).toBe("SPAN");
    expect(ref.current).not.toHaveAttribute("data-revealed");
    expect(ref.current).toHaveAttribute("data-loading", "false");
    expect(screen.getByText("$12")).toBeVisible();
  });
});

describe("SkeletonText", () => {
  it.each([[undefined, 3], [3.9, 3], [0, 1], [-2, 1], [NaN, 1], [Infinity, 1], [100, 50]])("normalizes line count %s to %s", (lines, expected) => {
    const { container } = render(<SkeletonText lines={lines} />);
    expect(container.querySelectorAll('[data-slot="skeleton-text-line"]')).toHaveLength(expected);
    expect(container.querySelectorAll('[data-short]')).toHaveLength(expected > 1 ? 1 : 0);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
