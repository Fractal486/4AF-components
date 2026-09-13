import { render } from "@testing-library/react";
import { MatrixLoader } from "./matrix-loader";

describe("MatrixLoader", () => {
  it("renders the selected pattern as a 4×4 grid", () => {
    const { container } = render(<MatrixLoader variant="twinkle" size="md" duration={2} />);
    const root = container.querySelector('[data-slot="matrix-loader"]');
    const dots = root?.querySelectorAll(":scope > i");

    expect(root).toHaveAttribute("data-variant", "twinkle");
    expect(root).toHaveAttribute("data-size", "md");
    expect(root?.getAttribute("style") ?? "").toContain("--matrix-cycle: 2s");
    expect(root).toHaveClass("grid-cols-4", "grid-rows-4");
    expect(dots).toHaveLength(16);
    expect(dots?.[0]?.getAttribute("style") ?? "").toContain("--matrix-delay: 0.375");
  });

  it("provides an optional status name and hides unlabeled decoration", () => {
    const labeled = render(<MatrixLoader label="Loading results" />);
    expect(labeled.getByRole("status", { name: "Loading results" })).toBeInTheDocument();

    const unlabeled = render(<MatrixLoader />);
    expect(unlabeled.container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
