import { DirectionProvider } from "@base-ui/react/direction-provider";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getSliderControlWidth, getSliderFillOffset } from "./slider-geometry";
import { Slider } from "./slider";

describe("Slider", () => {
  it("keeps the knob one size step smaller at rest", () => {
    const { container, rerender } = render(
      <Slider aria-label="Volume" thumb="knob" size="md" />,
    );

    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveClass("size-4");

    rerender(<Slider aria-label="Volume" thumb="knob" size="sm" />);
    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveClass("size-3");
  });

  it("shows a live value tooltip above the thumb when enabled", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Slider aria-label="Volume" defaultValue={40} showValueTooltip />,
    );

    const slider = screen.getByRole("slider");
    expect(container.querySelector("[data-base-ui-tooltip-trigger]")).toHaveClass("h-5", "w-1.5");
    await user.tab();
    const valueTooltip = () =>
      document.querySelector('[data-base-ui-focusable][data-side="top"]');

    expect(slider).toHaveFocus();
    await waitFor(() => expect(valueTooltip()).toHaveTextContent("40"));

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(valueTooltip()).toHaveTextContent("41"));
  });

  it("keeps the live value tooltip open when dragging leaves the thumb", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={40} showValueTooltip />,
    );

    const thumb = container.querySelector("[data-base-ui-tooltip-trigger]");
    expect(thumb).toBeInTheDocument();
    await user.hover(thumb!);

    const valueTooltip = () =>
      document.querySelector('[data-base-ui-focusable][data-side="top"]');
    await waitFor(() => expect(valueTooltip()).toHaveTextContent("40"));

    if (!HTMLElement.prototype.hasPointerCapture) {
      Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
        configurable: true,
        value: () => false,
      });
    }
    fireEvent.pointerDown(thumb!);
    fireEvent.pointerLeave(thumb!);
    await waitFor(() => expect(valueTooltip()).toHaveTextContent("40"));

    fireEvent.pointerUp(thumb!, { clientX: 200, clientY: 200 });
    await waitFor(() => expect(valueTooltip()).not.toBeInTheDocument());
  });

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

  it("keeps the fill correction tied to the animated thumb position", () => {
    expect(getSliderFillOffset(40, false, 20)).toBeCloseTo(2);
    expect(getSliderFillOffset(80, false, 20)).toBeCloseTo(-6);
    expect(getSliderFillOffset(80, true, 20)).toBeCloseTo(6);
    expect(getSliderFillOffset(80, false, 20, 14)).toBeCloseTo(8);
    expect(getSliderFillOffset(80, false, 20, 14, 14)).toBeCloseTo(5.6);
    expect(getSliderFillOffset(0, false, 20, 14, 14, true)).toBe(28);
    expect(getSliderFillOffset(100, true, 20, 14, 14, true)).toBe(28);
    expect(getSliderFillOffset(0, false, 20)).toBe(0);
    expect(getSliderFillOffset(100, false, 20)).toBe(0);
  });

  it("measures layout width instead of transformed visual bounds", () => {
    const control = document.createElement("div");
    Object.defineProperty(control, "offsetWidth", { configurable: true, value: 286 });
    Object.defineProperty(control, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ width: 271.7 }),
    });

    expect(getSliderControlWidth(control)).toBe(286);
  });
});
