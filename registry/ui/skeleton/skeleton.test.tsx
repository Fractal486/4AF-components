import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("is square by default, with corners opt-in", () => {
    const { container } = render(<Skeleton className="h-4 w-2/3" />);

    const skeleton = container.querySelector('[data-slot="skeleton"]')!;
    // A placeholder stands in for content; it should not read as a card. The radius used to be
    // baked in here, which quietly made it the shape of every text line in the library.
    expect(skeleton.className).not.toContain("rounded");
    expect(skeleton).toHaveClass("animate-pulse", "bg-muted", "h-4", "w-2/3");
  });

  it("takes a radius from the call site", () => {
    const { container } = render(<Skeleton className="size-10 rounded-full" />);

    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("rounded-full");
  });

  it("stops pulsing under reduced motion rather than collapsing the loop", () => {
    // A looping indicator collapsed to ~0 strobes, which is worse than the motion it avoids.
    const { container } = render(<Skeleton />);

    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass(
      "motion-reduce:animate-none",
    );
  });
});
