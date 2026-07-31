import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { Progress } from "./progress";

describe("Progress", () => {
  it("normalizes an invalid range without producing a non-finite transform", () => {
    const { container } = render(<Progress value={10} min={10} max={10} />);
    const root = container.querySelector('[role="progressbar"]');
    const indicator = container.querySelector('[role="progressbar"] [style]');

    expect(root).toHaveAttribute("aria-valuemin", "10");
    expect(root).toHaveAttribute("aria-valuemax", "11");
    expect(indicator?.getAttribute("style") ?? "").not.toMatch(/NaN|Infinity/);
  });

  it("reveals the fill from the inline start in RTL", () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <Progress value={25} />
      </DirectionProvider>,
    );

    const indicator = container.querySelector('[role="progressbar"] [style]');
    expect(indicator).toHaveStyle({ transform: "translateX(75%)" });
  });
});
