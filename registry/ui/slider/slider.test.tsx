import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Field } from "@base-ui/react/field";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getSliderControlWidth,
  getSliderFillOffset,
  getSliderThumbCenter,
  getSliderInlineDim,
  getSliderRangeFillInset,
  getSliderThumbDodged,
} from "./slider-geometry";
import { Slider } from "./slider";

describe("Slider", () => {
  it.each([false, true])("names the input from its visible label (inline: %s)", (inlineLabel) => {
    render(<Slider label={<strong>Volume</strong>} inlineLabel={inlineLabel} />);
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("forwards explicit names and preserves external label precedence", () => {
    const { rerender } = render(<Slider label="Visible" aria-label="Volume" />);
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
    rerender(<><span id="external">External volume</span><Slider label="Visible" aria-label="Volume" aria-labelledby="external" /></>);
    expect(screen.getByRole("slider", { name: "External volume" })).toBeInTheDocument();
  });

  it.each(["visible", "aria", "external"])("distinguishes range handles with a %s label", (kind) => {
    render(<>
      <span id="price">Price</span>
      <Slider range defaultValue={[20, 80]} {...(kind === "visible" ? { label: "Price" } : kind === "aria" ? { "aria-label": "Price" } : { "aria-labelledby": "price" })} />
    </>);
    expect(screen.getByRole("slider", { name: "Price minimum" })).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("slider", { name: "Price maximum" })).toHaveAttribute("aria-valuenow", "80");
  });

  it("supports caller-provided range handle names", () => {
    render(<Slider range label="Budget" thumbLabels={["Lowest price", "Highest price"]} />);
    expect(screen.getByRole("slider", { name: "Lowest price" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Highest price" })).toBeInTheDocument();
  });

  it("keeps Base UI Field labeling when no local name is supplied", () => {
    render(<Field.Root><Field.Label>Volume</Field.Label><Slider /></Field.Root>);
    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it.each(["bar", "circle", "knob"] as const)(
    "renders two independently keyboard-draggable thumbs in range mode (%s)",
    async (thumb) => {
      const user = userEvent.setup();

      render(
        <Slider
          aria-label="Amount"
          thumb={thumb}
          range
          defaultValue={[20, 80]}
          step={10}
          showTicks={false}
        />,
      );

      const sliders = screen.getAllByRole("slider");
      expect(sliders).toHaveLength(2);
      expect(sliders[0]).toHaveAttribute("aria-valuenow", "20");
      expect(sliders[1]).toHaveAttribute("aria-valuenow", "80");
      expect(document.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(2);

      await user.tab();
      await user.keyboard("{ArrowRight}");
      expect(sliders[0]).toHaveAttribute("aria-valuenow", "30");
      expect(sliders[1]).toHaveAttribute("aria-valuenow", "80");

      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(sliders[1]).toHaveAttribute("aria-valuenow", "70");
    },
  );

  it("rests the knob as a small dot, sized by the control", () => {
    const { container, rerender } = render(
      <Slider aria-label="Volume" thumb="knob" size="md" />,
    );

    // 10px on a 2px rail, so the dot reads as a position on a line rather than a handle in a
    // track. It grows by a quarter while held — see KNOB_GRAB_SCALE.
    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveClass("size-2.5");

    rerender(<Slider aria-label="Volume" thumb="knob" size="sm" />);
    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveClass("size-2");
  });

  it("uses the pressed thumb for the grabbed scale instead of hover", () => {
    const { container } = render(
      <Slider aria-label="Volume" thumb="knob" size="md" defaultValue={40} />,
    );

    const control = container.querySelector(".group");
    const thumb = container.querySelector('[data-index="0"]');
    const visualThumb = container.querySelector('[data-slot="slider-thumb"]');

    expect(control).not.toHaveAttribute("data-dragging-index");
    expect(visualThumb).toHaveClass("size-2.5");

    fireEvent.pointerEnter(thumb!);
    expect(control).not.toHaveAttribute("data-dragging-index");

    if (!HTMLElement.prototype.hasPointerCapture) {
      Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
        configurable: true,
        value: () => false,
      });
    }
    fireEvent.pointerDown(thumb!, { button: 0, clientX: 0, clientY: 0 });
    expect(control).toHaveAttribute("data-dragging-index", "0");

    fireEvent.pointerUp(control!, { clientX: 0, clientY: 0 });
    expect(control).not.toHaveAttribute("data-dragging-index");
  });

  it("uses the nearest thumb when the rail is pressed outside the thumb hitbox", () => {
    const { container } = render(
      <Slider
        aria-label="Range"
        thumb="circle"
        range
        defaultValue={[20, 80]}
        showTicks={false}
      />,
    );

    const control = container.querySelector(".group");
    const thumbs = Array.from(container.querySelectorAll('[data-index]'));
    const thumbRects = [
      { left: 20, top: 0, width: 20, height: 20, right: 40, bottom: 20 },
      { left: 100, top: 0, width: 20, height: 20, right: 120, bottom: 20 },
    ];
    thumbs.forEach((thumb, index) => {
      Object.defineProperty(thumb, "getBoundingClientRect", {
        configurable: true,
        value: () => thumbRects[index],
      });
    });

    if (!HTMLElement.prototype.hasPointerCapture) {
      Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
        configurable: true,
        value: () => false,
      });
    }
    fireEvent.pointerDown(control!, {
      button: 0,
      clientX: 108,
      clientY: 10,
    });
    expect(control).toHaveAttribute("data-dragging-index", "1");

    fireEvent.pointerUp(control!, { clientX: 108, clientY: 10 });
    expect(control).not.toHaveAttribute("data-dragging-index");
  });

  it("shows a live value tooltip above the thumb when enabled", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Slider aria-label="Volume" defaultValue={40} showValueTooltip />,
    );

    const slider = screen.getByRole("slider");
    expect(container.querySelector("[data-base-ui-tooltip-trigger]")).toHaveClass("h-4", "w-6");
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
    expect(container.querySelector('[data-slot="slider-thumb-positioner"]')).toHaveStyle({ left: "0px" });
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
    // The single bar is a fader, which leaves out the mark on the rail's own edge at 0%.
    expect(tickPositions).toEqual(["30%", "60%", "90%"]);
  });

  it("rides a fader thumb 8px inside the fill's edge, parked 8px from either end", () => {
    // The fill's edge is the value across the full 200px; the thumb sits 8px inside it.
    expect(getSliderThumbCenter(50, 200, 8, 8)).toBe(92);
    expect(getSliderThumbCenter(100, 200, 8, 8)).toBe(192);
    // Until the fill passes 16px the thumb stays parked at 8px.
    expect(getSliderThumbCenter(0, 200, 8, 8)).toBe(8);
    expect(getSliderThumbCenter(5, 200, 8, 8)).toBe(8);
    // In RTL the fill grows from the right, so the thumb rides to the edge's right.
    expect(getSliderThumbCenter(50, 200, 8, 8, true)).toBe(108);
    expect(getSliderThumbCenter(100, 200, 8, 8, true)).toBe(192);
    // Without a fill to follow, the thumb travels inset at both ends.
    expect(getSliderThumbCenter(0, 200, 8)).toBe(8);
    expect(getSliderThumbCenter(100, 200, 8)).toBe(192);
  });

  it("hides the single bar's tick where the fill's edge rests, so the two never stack", async () => {
    const { container } = render(
      <Slider aria-label="Amount" min={0} max={100} step={10} defaultValue={30} />,
    );
    const ticks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="slider-ticks"] > span'),
    );
    const at = (left: string) => ticks.find((tick) => tick.style.left === left)!;

    await waitFor(() => expect(at("30%").style.opacity).toBe("0"));
    expect(at("20%").style.opacity).toBe("1");
    expect(at("40%").style.opacity).toBe("1");
  });

  it("gives the bar's ticks ruler heights: tallest at the midpoint, taller every fifth step", () => {
    const { container } = render(
      <Slider aria-label="Amount" min={0} max={100} step={5} defaultValue={0} />,
    );
    const heightAt = (left: string) =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-slot="slider-ticks"] > span'))
        .find((tick) => tick.style.left === left)!
        .className.split(" ").find((name) => /^h-[\d.]+$/.test(name));

    expect(heightAt("50%")).toBe("h-3.5");
    expect(heightAt("25%")).toBe("h-2.5");
    expect(heightAt("75%")).toBe("h-2.5");
    expect(heightAt("10%")).toBe("h-1.5");
  });

  it("edits the shown value in place, clamped and snapped, and cancels on Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        label="Volume"
        showValue
        defaultValue={40}
        step={10}
        onValueChange={onValueChange}
      />,
    );
    const slider = screen.getByRole("slider");

    await user.click(screen.getByText("40"));
    const input = screen.getByRole("textbox", { name: "Edit Volume" });
    await user.clear(input);
    await user.type(input, "47{Enter}");
    // Snapped to the step of 10.
    expect(onValueChange).toHaveBeenLastCalledWith(50);
    expect(slider).toHaveAttribute("aria-valuenow", "50");

    await user.click(screen.getByText("50"));
    await user.clear(screen.getByRole("textbox", { name: "Edit Volume" }));
    await user.type(screen.getByRole("textbox", { name: "Edit Volume" }), "999{Enter}");
    // Clamped to the maximum.
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    await user.click(screen.getByText("100"));
    await user.clear(screen.getByRole("textbox", { name: "Edit Volume" }));
    await user.type(screen.getByRole("textbox", { name: "Edit Volume" }), "10{Escape}");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(slider).toHaveAttribute("aria-valuenow", "100");
  });

  it("edits each end of a range, never past the other", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Price" range showValue defaultValue={[20, 80]} />);
    const [low, high] = screen.getAllByRole("slider");

    await user.click(screen.getByText("20"));
    const lowInput = screen.getByRole("textbox", { name: "Edit Price minimum" });
    await user.clear(lowInput);
    await user.type(lowInput, "35{Enter}");
    expect(low).toHaveAttribute("aria-valuenow", "35");

    // Past the other end, it stops at it.
    await user.click(screen.getByText("80"));
    const highInput = screen.getByRole("textbox", { name: "Edit Price maximum" });
    await user.clear(highInput);
    await user.type(highInput, "10{Enter}");
    expect(high).toHaveAttribute("aria-valuenow", "35");
  });

  it("leaves the thumb's focus ring off while the value is being typed", async () => {
    const user = userEvent.setup();
    const { container } = render(<Slider aria-label="Volume" inlineLabel showValue defaultValue={40} />);
    await user.click(screen.getByText("40"));
    expect(screen.getByRole("textbox")).toHaveFocus();
    // The ring answers only the slider's own range input.
    expect(container.querySelector('[data-slot="slider-thumb"]')!.className).toContain(
      "group-has-[[type=range]:focus-visible]:ring-4",
    );
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

  it("uses the endpoint fields for the single-thumb fill too", () => {
    expect(getSliderFillOffset(0, false, 6, 0, 3, false, 10, 10)).toBe(0);
    expect(getSliderFillOffset(1, false, 6, 0, 3, false, 10, 10)).toBeCloseTo(0.24);
    expect(getSliderFillOffset(10, false, 6, 0, 3, false, 10, 10)).toBeCloseTo(2.4);
    expect(getSliderFillOffset(20, false, 6, 0, 3, false, 10, 10)).toBeCloseTo(1.8);
    expect(getSliderFillOffset(90, false, 6, 0, 3, false, 10, 10)).toBeCloseTo(-2.4);
    expect(getSliderFillOffset(100, false, 6, 0, 3, false, 10, 10)).toBe(0);
  });

  it("rides the knob thumb on a hairline rail that carries only the fill", () => {
    const { container } = render(
      <Slider aria-label="Volume" thumb="knob" defaultValue={40} step={10} showTicks />,
    );

    const rail = container.querySelector('[data-slot="slider-fill"]')!.parentElement!;
    // 4px for md, centred rather than filling the control.
    expect(rail.className).toContain("h-1");
    expect(rail.className).toContain("-translate-y-1/2");
    // Tick dots would crowd the thin rail, so the variant has none
    // even when they're asked for.
    expect(rail.querySelectorAll("span")).toHaveLength(0);
  });

  it.each(["bar", "circle"] as const)("keeps ticks on the %s thumb", (thumb) => {
    const { container } = render(
      <Slider aria-label="Volume" thumb={thumb} defaultValue={40} step={10} showTicks />,
    );

    const rail = container.querySelector('[data-slot="slider-fill"]')!.parentElement!;
    expect(rail.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("puts the label and value inside the bar in inline mode", () => {
    const { container } = render(
      <Slider aria-label="Volume" inlineLabel label="Volume" defaultValue={40} />,
    );

    const control = container.querySelector('[data-slot="slider-thumb"]')!.closest(
      "[class*='touch-none']",
    )!;
    // Inside the control, not in a row above it — that row is what inline mode replaces.
    expect(control).toHaveTextContent("Volume");
    expect(control).toHaveTextContent("40");
    expect(container.querySelector(".mb-2")).toBeNull();
  });

  it.each(["circle", "knob"] as const)(
    "ignores inline mode on the %s thumb, which has no bar to sit in",
    (thumb) => {
      const { container } = render(
        <Slider aria-label="Volume" thumb={thumb} inlineLabel label="Volume" defaultValue={40} />,
      );

      // Back to the row above the track, and the thumb never dodges.
      expect(container.querySelector(".mb-2")).toHaveTextContent("Volume");
      expect(container.querySelector("[data-dodged]")).toBeNull();
      expect(
        container.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!.className,
      ).toContain("bg-foreground");
    },
  );

  // The single bar's thumb stays parked 8px in until the fill passes 16px (8% of this 200px
  // rail), so it only meets the label once the value is past that.
  it.each([
    [20, true],
    [0, false],
  ] as const)("at value %s, dodges the thumb under inline text: %s", async (value, expected) => {
    // jsdom has no layout: give every element a 200px width so the thumb has a rail to travel.
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    try {
      const { container, rerender } = render(
        <Slider
          aria-label="Volume"
          inlineLabel
          label="Volume"
          defaultValue={value}
          showValue={false}
          showTicks={false}
        />,
      );

      const thumb = container.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      expect(thumb).not.toHaveAttribute("data-dodged");

      // The label sits over the rail's first 40px, where a thumb near the minimum is.
      Object.defineProperty(screen.getByText("Volume"), "getBoundingClientRect", {
        configurable: true,
        value: () => ({ left: 0, right: 40, width: 40 }),
      });

      // `showValue` is one of the measuring effect's dependencies, so flipping it re-measures
      // against the rect above.
      rerender(
        <Slider
          aria-label="Volume"
          inlineLabel
          label="Volume"
          defaultValue={value}
          showValue
          showTicks={false}
        />,
      );

      if (expected) {
        await waitFor(() => expect(thumb).toHaveAttribute("data-dodged", ""));
      } else {
        // Parked at the minimum, under the label or not, the thumb stays as it is.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(thumb).not.toHaveAttribute("data-dodged");
      }
    } finally {
      width.mockRestore();
    }
  });

  it("dodges near text but never at either end of the rail", () => {
    const label: [number, number] = [0, 40];
    const value: [number, number] = [170, 200];
    // Within 8px of the label, away from the end.
    expect(getSliderThumbDodged(20, 6, 200, [label])).toBe(true);
    expect(getSliderThumbDodged(45, 6, 200, [label])).toBe(true);
    // Clear of both spans.
    expect(getSliderThumbDodged(100, 6, 200, [label, value])).toBe(false);
    // Parked at either end: back to normal even though the text is right there.
    expect(getSliderThumbDodged(0, 6, 200, [label, value])).toBe(false);
    expect(getSliderThumbDodged(194, 6, 200, [label, value])).toBe(false);
    // One step in from the end, it dodges again.
    expect(getSliderThumbDodged(190, 6, 200, [label, value])).toBe(true);
    // A 4px bar thumb the fill holds travels 8px in, so it parks 6px from each edge.
    expect(getSliderThumbDodged(6, 4, 200, [label, value], 8, 8)).toBe(false);
    expect(getSliderThumbDodged(190, 4, 200, [label, value], 8, 8)).toBe(false);
    expect(getSliderThumbDodged(12, 4, 200, [label, value], 8, 8)).toBe(true);
  });

  it("shows the bar's ticks and steps up its fill only while in use", () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={40} />);

    const ticks = container.querySelector('[data-slot="slider-ticks"]')!;
    expect(ticks.className).toContain("opacity-0");
    expect(ticks.className).toContain("group-hover:opacity-100");
    expect(container.querySelector('[data-slot="slider-fill"]')!.className).toContain(
      "group-hover:bg-foreground/20",
    );
  });

  it.each(["circle", "knob"] as const)("keeps the %s thumb's ticks and fill as they were", (thumb) => {
    const { container } = render(<Slider aria-label="Volume" thumb={thumb} defaultValue={40} />);

    expect(container.querySelector('[data-slot="slider-ticks"]')!.className).not.toContain(
      "opacity-0",
    );
    expect(container.querySelector('[data-slot="slider-fill"]')!.className).not.toContain(
      "group-hover",
    );
  });

  it("ramps the inline fade by overlap instead of switching at contact", () => {
    const span = [100, 140] as const;

    // Clear of the text, and clear of the approach margin that precedes it.
    expect(getSliderInlineDim(0, 6, [span])).toBe(0);
    expect(getSliderInlineDim(80, 6, [span])).toBe(0);

    // Entering: partial, and monotonic on the way in.
    const approaching = getSliderInlineDim(90, 6, [span]);
    const closer = getSliderInlineDim(92, 6, [span]);
    expect(approaching).toBeGreaterThan(0);
    expect(approaching).toBeLessThan(1);
    expect(closer).toBeGreaterThan(approaching);

    // Fully under it, and symmetric on the way out.
    expect(getSliderInlineDim(120, 6, [span])).toBe(1);
    expect(getSliderInlineDim(150, 6, [span])).toBe(0);
    expect(getSliderInlineDim(90, 6, [span])).toBeCloseTo(
      getSliderInlineDim(144, 6, [span]),
      5,
    );

    // A thumb wider than the text it passes still reaches full fade, because the ramp is
    // capped by the zone rather than by the thumb.
    expect(getSliderInlineDim(100, 80, [[110, 118]])).toBe(1);

    // Two spans, and the deeper one wins; a degenerate span is ignored.
    expect(getSliderInlineDim(120, 6, [[0, 0], span])).toBe(1);
    expect(getSliderInlineDim(0, 6, [])).toBe(0);
  });

  it("distributes range endpoint space across the first and last tick fields", () => {
    expect(getSliderRangeFillInset(0, true, 286, 3, 0, 10, 10)).toBe(0);
    expect(getSliderRangeFillInset(10, true, 286, 3, 0, 10, 10)).toBe(31);
    expect(getSliderRangeFillInset(20, true, 286, 3, 0, 10, 10)).toBe(59);
    expect(
      getSliderRangeFillInset(10, true, 286, 3, 0, 10, 10) -
        getSliderRangeFillInset(0, true, 286, 3, 0, 10, 10),
    ).toBeGreaterThan(
      getSliderRangeFillInset(20, true, 286, 3, 0, 10, 10) -
        getSliderRangeFillInset(10, true, 286, 3, 0, 10, 10),
    );
    expect(getSliderRangeFillInset(90, false, 286, 3, 0, 10, 10)).toBe(255);
    expect(getSliderRangeFillInset(100, false, 286, 3, 0, 10, 10)).toBe(286);
    expect(getSliderRangeFillInset(0, true, 286, 14, 14, 10, 10)).toBe(0);
    expect(getSliderRangeFillInset(100, false, 286, 14, 14, 10, 10)).toBe(286);
    expect(getSliderRangeFillInset(0, true, 286, 14, 0, 10, 10)).toBe(0);
    expect(getSliderRangeFillInset(100, false, 286, 14, 0, 10, 10)).toBe(286);
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

  it("draws the dragged thumb and fill at the value while still held, all the way to the end", async () => {
    // jsdom has no layout: a 200px control, and pointer capture as a no-op.
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 200, width: 200, top: 0, bottom: 40, height: 40, x: 0, y: 0, toJSON() {},
    } as DOMRect);
    const capture = {
      setPointerCapture: Element.prototype.setPointerCapture,
      releasePointerCapture: Element.prototype.releasePointerCapture,
      hasPointerCapture: Element.prototype.hasPointerCapture,
    };
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => true;
    try {
      const { container } = render(<Slider aria-label="Volume" defaultValue={40} step={1} />);
      const control = container.querySelector(".group") as HTMLElement;
      const fill = container.querySelector('[data-slot="slider-fill"]') as HTMLElement;
      const pointer = { clientY: 20, buttons: 1, pointerId: 1, pointerType: "mouse" };

      await act(async () => {
        fireEvent.pointerDown(control, { ...pointer, clientX: 80 });
      });
      for (const clientX of [120, 160, 199, 240]) {
        await act(async () => {
          fireEvent.pointerMove(document, { ...pointer, clientX });
          await new Promise((resolve) => setTimeout(resolve, 40));
        });
      }

      // Past the end, still held: the fill is whole, not one value behind. Motion writes a
      // zero translate as `none`.
      await waitFor(() => expect(["none", "translateX(0%)"]).toContain(fill.style.transform));
    } finally {
      Object.assign(Element.prototype, capture);
      rect.mockRestore();
      width.mockRestore();
    }
  });

  it("grabs the range thumb that actually moves when both share a value", async () => {
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 200, width: 200, top: 0, bottom: 40, height: 40, x: 0, y: 0, toJSON() {},
    } as DOMRect);
    const capture = {
      setPointerCapture: Element.prototype.setPointerCapture,
      releasePointerCapture: Element.prototype.releasePointerCapture,
      hasPointerCapture: Element.prototype.hasPointerCapture,
    };
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => true;
    try {
      const { container } = render(
        <Slider aria-label="Price" range step={1} defaultValue={[50, 50]} />,
      );
      const control = container.querySelector(".group") as HTMLElement;
      const pointer = { clientY: 20, buttons: 1, pointerId: 1, pointerType: "mouse" };
      await act(async () => {
        fireEvent.pointerDown(control, { ...pointer, clientX: 100 });
      });
      for (const clientX of [110, 130, 150]) {
        await act(async () => {
          fireEvent.pointerMove(document, { ...pointer, clientX });
          await new Promise((resolve) => setTimeout(resolve, 40));
        });
      }

      // The right thumb moved, so it holds the grab's widened middle; the stationary left one
      // (picked at the press, both being equally close) eases back to its resting width.
      const middles = Array.from(
        container.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"] > span:nth-child(2)'),
      );
      const widthScale = (element: HTMLElement) =>
        Number(/scaleX\(([\d.]+)\)/.exec(element.style.transform)?.[1] ?? 1);
      await waitFor(() => {
        expect(widthScale(middles[1]!)).toBeGreaterThan(1.4);
        expect(widthScale(middles[0]!)).toBeLessThan(1.05);
      });
    } finally {
      Object.assign(Element.prototype, capture);
      rect.mockRestore();
      width.mockRestore();
    }
  });
});
