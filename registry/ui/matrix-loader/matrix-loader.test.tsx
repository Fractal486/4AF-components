import { render } from "@testing-library/react";
import { createRef } from "react";
import { MatrixLoader } from "./matrix-loader";

describe("MatrixLoader", () => {
  it("removes the grid, status, and ref while hidden and restores them when loading", () => {
    const ref = createRef<HTMLDivElement>();
    const { container, queryByRole, rerender } = render(<MatrixLoader ref={ref} loading={false} label="Working" />);
    expect(container).toBeEmptyDOMElement();
    expect(ref.current).toBeNull();
    rerender(<MatrixLoader ref={ref} loading label="Working" />);
    expect(queryByRole("status", { name: "Working" })).toBe(ref.current);
    expect(ref.current?.querySelectorAll("i")).toHaveLength(16);
    expect(ref.current).not.toHaveAttribute("loading");
    rerender(<MatrixLoader ref={ref} loading={false} label="Working" />);
    expect(container).toBeEmptyDOMElement();
    expect(queryByRole("status")).not.toBeInTheDocument();
    expect(ref.current).toBeNull();
    rerender(<MatrixLoader label="Working" />);
    expect(queryByRole("status", { name: "Working" })).toBeInTheDocument();
  });

  it("renders the selected pattern as a 4×4 grid", () => {
    const { container } = render(<MatrixLoader variant="hash" size="md" duration={2} />);
    const root = container.querySelector('[data-slot="matrix-loader"]');
    const dots = root?.querySelectorAll(":scope > i");

    expect(root).toHaveAttribute("data-variant", "hash");
    expect(root).toHaveAttribute("data-size", "md");
    expect(root?.getAttribute("style") ?? "").toContain("--matrix-cycle: 2s");
    expect(root).toHaveClass("grid-cols-4", "grid-rows-4");
    expect(dots).toHaveLength(16);
    // Hash gives every dot its own random start point and cycle length once mounted.
    const timings = Array.from(dots ?? [], (dot) => (dot as HTMLElement).style.animationDuration);
    expect(timings.every((value) => /^calc\(\d/.test(value))).toBe(true);
    expect(new Set(timings).size).toBeGreaterThan(1);
    expect((dots?.[0] as HTMLElement).style.animationDelay).toMatch(/^calc\(-/);
  });

  it("renders a 5×5 grid of round dots", () => {
    const { container } = render(<MatrixLoader grid={5} shape="dot" />);
    const root = container.querySelector('[data-slot="matrix-loader"]');

    expect(root).toHaveAttribute("data-grid", "5");
    expect(root).toHaveAttribute("data-shape", "dot");
    expect(root).toHaveClass("grid-cols-5", "grid-rows-5");
    expect(root?.querySelectorAll(":scope > i")).toHaveLength(25);
  });

  it("runs the newer patterns on their own keyframes and default cycle", () => {
    const { container } = render(<MatrixLoader variant="attention" grid={5} />);
    const root = container.querySelector('[data-slot="matrix-loader"]')!;
    const dots = root.querySelectorAll<HTMLElement>(":scope > i");

    expect(root.getAttribute("style")).toContain("--matrix-cycle: 1.8s");
    expect(getComputedStyle(dots[0]!).animationName).toBe("matrix-attention");
    // Rows sweep down: the second row starts 0.28s into the 1.8s cycle.
    expect(dots[5]?.style.animationDelay).toBe(`calc(${0.28 / 1.8} * var(--matrix-cycle))`);
  });

  it("composes backprop's forward and backward passes", () => {
    const { container } = render(<MatrixLoader variant="backprop" duration={2} />);
    const dot = container.querySelector<HTMLElement>('[data-slot="matrix-loader"] > i');

    expect(container.firstElementChild?.getAttribute("style") ?? "").toContain("--matrix-cycle: 2s");
    expect(getComputedStyle(dot!).animationName.split(", ")).toEqual(["matrix-backprop", "matrix-backprop"]);
    expect(dot?.style.animationDelay.split(", ")).toHaveLength(2);
  });

  it("provides an optional status name and hides unlabeled decoration", () => {
    const labeled = render(<MatrixLoader label="Loading results" />);
    expect(labeled.getByRole("status", { name: "Loading results" })).toBeInTheDocument();

    const unlabeled = render(<MatrixLoader />);
    expect(unlabeled.container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
