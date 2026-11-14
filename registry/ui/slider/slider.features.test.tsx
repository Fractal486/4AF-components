import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { Slider as BaseSlider } from "@base-ui/react/slider";
import { Field } from "@base-ui/react/field";
import { Slider } from "./slider";
import { shiftSliderRange } from "./slider-range-drag";

function rangeGeometry(container: HTMLElement, vertical = false) {
  const control = container.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
  control.setPointerCapture = vi.fn();
  control.hasPointerCapture = vi.fn(() => false);
  Object.defineProperty(control, vertical ? "offsetHeight" : "offsetWidth", { value: 200, configurable: true });
  vi.spyOn(control, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, vertical ? 40 : 200, vertical ? 200 : 40));
  const thumbs = container.querySelectorAll<HTMLElement>('[data-slot="slider-thumb-hit"]');
  thumbs.forEach((thumb, index) => vi.spyOn(thumb, "getBoundingClientRect").mockReturnValue(
    vertical ? new DOMRect(10, index === 0 ? 130 : 50, 20, 20) : new DOMRect(index === 0 ? 50 : 130, 10, 20, 20),
  ));
  container.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]').forEach((thumb, index) =>
    vi.spyOn(thumb, "getBoundingClientRect").mockReturnValue(
      vertical ? new DOMRect(12, index === 0 ? 139 : 59, 16, 2) : new DOMRect(index === 0 ? 59 : 139, 12, 2, 16),
    ));
  return control;
}

describe("Slider added capabilities", () => {
  it("blocks range gestures when disabled by its field, including during a press", () => {
    const change = vi.fn();
    const commit = vi.fn();
    const slider = <Slider defaultValue={[30, 70]} draggableRange step={10} onValueChange={change} onValueCommitted={commit} />;
    const { container, rerender } = render(<Field.Root disabled>{slider}</Field.Root>);
    const control = rangeGeometry(container);
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: 100, clientY: 20 };
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    screen.getAllByRole("slider").forEach(input => expect(input).toBeDisabled());
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: 120 });
    fireEvent.pointerUp(control, pointer);
    expect(control.setPointerCapture).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();

    rerender(<Field.Root>{slider}</Field.Root>);
    rangeGeometry(container);
    expect(change).not.toHaveBeenCalled();
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: 120 });
    expect(change).toHaveBeenCalledExactlyOnceWith([40, 80], expect.objectContaining({ reason: "drag", activeThumbIndex: -1 }));
    rerender(<Field.Root disabled>{slider}</Field.Root>);
    fireEvent.pointerMove(control, { ...pointer, clientX: 140 });
    fireEvent.pointerUp(control, pointer);
    expect(change).toHaveBeenCalledOnce();
    expect(commit).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="slider"]')).not.toHaveAttribute("data-range-dragging");
  });

  it("supports vertical keyboard input, custom root elements, refs and state-based classes", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(<Slider ref={ref} render={<section />} orientation="vertical" aria-label="Volume" defaultValue={40} showValue={false}
      className={state => state.orientation === "vertical" ? "vertical-slider" : "horizontal-slider"} />);
    expect(ref.current?.tagName).toBe("SECTION");
    expect(ref.current).toHaveClass("vertical-slider");
    const input = screen.getByRole("slider", { name: "Volume" });
    expect(input).toHaveAttribute("aria-orientation", "vertical");
    await user.tab();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-valuenow", "41");
  });

  it("formats the tooltip and supplies custom spoken values for each handle", async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[20, 80]} showValue={false} showValueTooltip locale="en-US"
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      getAriaLabel={index => index === 0 ? "Lowest price" : "Highest price"}
      getAriaValueText={(formatted, _value, index) => `${formatted} ${index === 0 ? "minimum" : "maximum"}`} />);
    expect(screen.getByRole("slider", { name: "Lowest price" })).toHaveAttribute("aria-valuetext", "$20 minimum");
    expect(screen.getByRole("slider", { name: "Highest price" })).toHaveAttribute("aria-valuetext", "$80 maximum");
    await user.hover(screen.getByRole("slider", { name: "Lowest price" }).parentElement!);
    await waitFor(() => expect(document.querySelector('[data-base-ui-focusable][data-side="top"]')).toHaveTextContent("$20"));
  });

  it("honors canceled keyboard changes", async () => {
    const user = userEvent.setup();
    const commit = vi.fn();
    render(<Slider aria-label="Volume" defaultValue={40} showValue={false} onValueChange={(_value: number, details: BaseSlider.Root.ChangeEventDetails) => details.cancel()} onValueCommitted={commit} />);
    await user.tab();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
    expect(commit).not.toHaveBeenCalled();
  });

  it.each([false, true])("drags the whole range and commits once (vertical=%s)", (vertical) => {
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(<Slider aria-label="Range" defaultValue={[30, 70]} draggableRange step={10}
      orientation={vertical ? "vertical" : "horizontal"} onValueChange={change} onValueCommitted={commit} />);
    const control = rangeGeometry(container, vertical);
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: vertical ? 20 : 100, clientY: vertical ? 100 : 20 };
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: vertical ? 20 : 120, clientY: vertical ? 120 : 20 });
    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute("data-range-dragging");
    const expected = vertical ? [20, 60] : [40, 80];
    expect(change).toHaveBeenLastCalledWith(expected, expect.objectContaining({ reason: "drag", activeThumbIndex: -1 }));
    fireEvent.pointerUp(control, pointer);
    expect(commit).toHaveBeenCalledExactlyOnceWith(expected, expect.objectContaining({ reason: "drag" }));
    expect(container.querySelector('[data-slot="slider"]')).not.toHaveAttribute("data-range-dragging");
  });

  it("does not apply or commit a canceled range drag", () => {
    const commit = vi.fn();
    const { container } = render(<Slider aria-label="Range" defaultValue={[30, 70]} draggableRange step={10}
      onValueChange={(_value: readonly [number, number], details: BaseSlider.Root.ChangeEventDetails) => details.cancel()} onValueCommitted={commit} />);
    const control = rangeGeometry(container);
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: 100, clientY: 20 };
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: 130 });
    fireEvent.pointerUp(control, pointer);
    expect(screen.getAllByRole("slider").map(input => input.getAttribute("aria-valuenow"))).toEqual(["30", "70"]);
    expect(commit).not.toHaveBeenCalled();
  });

  it.each([false, true])("does not let invisible handle padding steal a range drag (vertical=%s)", (vertical) => {
    const change = vi.fn();
    const { container } = render(<Slider defaultValue={[30, 70]} draggableRange step={10}
      orientation={vertical ? "vertical" : "horizontal"} onValueChange={change} />);
    const control = rangeGeometry(container, vertical);
    const hit = container.querySelector('[data-slot="slider-thumb-hit"]')!;
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1,
      clientX: vertical ? 20 : 66, clientY: vertical ? 134 : 20 };
    fireEvent.pointerDown(hit, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: vertical ? 20 : 86, clientY: vertical ? 114 : 20 });
    expect(change).toHaveBeenLastCalledWith([40, 80], expect.objectContaining({ activeThumbIndex: -1 }));
    fireEvent.pointerUp(control, pointer);
  });

  it("ends a canceled pointer gesture without a commit", () => {
    const commit = vi.fn();
    const { container } = render(<Slider defaultValue={[30, 70]} draggableRange step={10} onValueCommitted={commit} />);
    const control = rangeGeometry(container);
    const pointer = { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, buttons: 1, clientX: 100, clientY: 20 };
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerMove(control, { ...pointer, clientX: 120 });
    fireEvent.pointerCancel(control, pointer);
    expect(commit).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="slider"]')).not.toHaveAttribute("data-range-dragging");
  });

  it("keeps a plain track click and respects the minimum handle spacing", () => {
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(<Slider defaultValue={[30, 70]} draggableRange step={10} minStepsBetweenValues={3} onValueChange={change} onValueCommitted={commit} />);
    const control = rangeGeometry(container);
    const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: 100, clientY: 20 };
    fireEvent.pointerDown(control, pointer);
    fireEvent.pointerUp(control, pointer);
    expect(change).toHaveBeenCalledExactlyOnceWith([40, 70], expect.objectContaining({ reason: "track-press" }));
    expect(commit).toHaveBeenCalledExactlyOnceWith([40, 70], expect.objectContaining({ reason: "track-press" }));
  });
});

describe("shiftSliderRange", () => {
  it("preserves the interval at both boundaries", () => {
    expect(shiftSliderRange([30, 70], 90, 0, 100, 10)).toEqual([60, 100]);
    expect(shiftSliderRange([30, 70], -90, 0, 100, 10)).toEqual([0, 40]);
  });
  it("snaps movement without losing fractional or exponential precision", () => {
    expect(shiftSliderRange([.15, .35], .13, .05, .55, .1)).toEqual([.25, .45]);
    expect(shiftSliderRange([2e-7, 5e-7], 1e-7, 0, 1e-6, 1e-7)).toEqual([3e-7, 6e-7]);
  });
});

describe("Slider variants", () => {
  it("draws an outline-ghost rail with an edge and no fill, except on the knob", () => {
    const { container, rerender } = render(<Slider aria-label="Volume" variant="outline-ghost" />);
    const rail = () => container.querySelector<HTMLElement>('[data-slot="slider-control"] .overflow-hidden')!;
    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute("data-variant", "outline-ghost");
    expect(rail()).toHaveClass("shadow-border");
    expect(rail()).not.toHaveClass("bg-muted");

    rerender(<Slider aria-label="Volume" variant="outline-ghost" thumb="knob" />);
    expect(rail()).toHaveClass("bg-muted");
    expect(rail()).not.toHaveClass("shadow-border");

    rerender(<Slider aria-label="Volume" />);
    expect(rail()).toHaveClass("bg-muted");
  });
});
