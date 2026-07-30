import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen, waitFor } from "@testing-library/react";
import { Slider } from "./slider";

describe("Slider", () => {
  it("clamps an out-of-range default value to the usable range", () => {
    render(<Slider aria-label="Volume" defaultValue={40} max={10} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("max", "10");
    expect(slider).toHaveAttribute("aria-valuenow", "10");
  });

  it("keeps its visual thumb and full-width fill aligned with Base UI in RTL without layout animation", async () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <Slider aria-label="Volume" value={20} />
      </DirectionProvider>,
    );

    await waitFor(() => expect(container.querySelector('[data-slot="slider-thumb"]')).toBeInTheDocument());
    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveStyle({ left: "0px" });
    expect(container.querySelector('[data-slot="slider-fill"]')).toHaveClass("inset-0");
    expect(container.querySelector('[data-slot="slider-fill"]')).toHaveStyle({
      clipPath: expect.stringContaining("inset"),
    });
  });

  it("places an off-range final step at its real percentage", () => {
    const { container } = render(
      <Slider aria-label="Amount" min={0} max={10} step={3} showValue={false} />,
    );

    const tickPositions = Array.from(container.querySelectorAll("span"))
      .map((element) => element.style.left)
      .filter(Boolean);
    expect(tickPositions).toEqual(["0%", "30%", "60%", "90%"]);
  });
});
