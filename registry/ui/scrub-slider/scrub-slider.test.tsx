import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Field } from "@base-ui/react/field";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  clampOffset,
  clampOffsetAtPointer,
  edgeSpeed,
  lensAt,
  offsetKeepingInView,
  snapValue,
  tickLevel,
  valueAtTick,
} from "./scrub-slider-geometry";
import { ScrubSlider } from "./scrub-slider";

const RULER_WIDTH = 300;
const SPACING = 6;

/** Gives the ruler a size and the root pointer capture, which jsdom lacks. */
function geometry(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-slot="scrub-slider"]')!;
  const ruler = container.querySelector<HTMLElement>('[data-slot="scrub-slider-ruler"]')!;
  root.setPointerCapture = vi.fn();
  vi.spyOn(ruler, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, RULER_WIDTH, 16));
  return root;
}

const pointer = { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientY: 30 };

/** Runs queued animation frames against a controllable clock. */
function frames() {
  let now = 0;
  let queue: FrameRequestCallback[] = [];
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    queue.push(callback);
    return queue.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  return (count: number, stepMs = 16) => {
    for (let i = 0; i < count; i++) {
      now += stepMs;
      const run = queue;
      queue = [];
      act(() => run.forEach((callback) => callback(now)));
    }
  };
}

afterEach(() => vi.restoreAllMocks());

describe("ScrubSlider geometry", () => {
  const scale = { min: 0, max: 100, step: 1 };

  it("snaps values to the step grid that starts at min", () => {
    expect(snapValue(3.4, { min: 0.5, max: 10.5, step: 1 })).toBe(3.5);
    expect(snapValue(250, scale)).toBe(100);
    expect(snapValue(Number.NaN, scale)).toBe(0);
    expect(valueAtTick(3, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
  });

  it("puts tall ticks on every fifth and tenth value, counted from zero", () => {
    expect(tickLevel(0, scale)).toBe(2);
    expect(tickLevel(5, scale)).toBe(1);
    expect(tickLevel(3, scale)).toBe(0);
    expect(tickLevel(7, { min: 3, max: 50, step: 1 })).toBe(2);
  });

  it("lifts ticks most at the indicator and not at all past the lens", () => {
    expect(lensAt(0, SPACING)).toBe(1);
    expect(lensAt(SPACING * 2, SPACING)).toBeGreaterThan(lensAt(SPACING * 3, SPACING));
    expect(lensAt(SPACING * 5, SPACING)).toBe(0);
  });

  it("scrolls only inside the edge zones, faster deeper in and over time", () => {
    expect(edgeSpeed(150, RULER_WIDTH, 0)).toBe(0);
    expect(edgeSpeed(0, RULER_WIDTH, 0)).toBeLessThan(0);
    expect(edgeSpeed(RULER_WIDTH, RULER_WIDTH, 0)).toBeGreaterThan(0);
    expect(edgeSpeed(RULER_WIDTH - 5, RULER_WIDTH, 0)).toBeGreaterThan(edgeSpeed(RULER_WIDTH - 20, RULER_WIDTH, 0));
    expect(edgeSpeed(RULER_WIDTH, RULER_WIDTH, 2)).toBeGreaterThan(edgeSpeed(RULER_WIDTH, RULER_WIDTH, 0));
  });

  it("keeps a value's tick clear of the edges and the head within the scale", () => {
    // Tick 90 at offset 0 would sit at 540px on a 300px ruler.
    const offset = offsetKeepingInView(0, 90, RULER_WIDTH, SPACING);
    expect((90 - offset) * SPACING).toBe(RULER_WIDTH - 40);
    // Scrolling stops once the value at the pointer is at the bound and the end sits 40px in.
    expect(clampOffsetAtPointer(200, 290, RULER_WIDTH, SPACING, scale)).toBeCloseTo(100 - 260 / SPACING);
    expect(clampOffsetAtPointer(-50, 10, RULER_WIDTH, SPACING, scale)).toBeCloseTo(-40 / SPACING);
    // At rest the view keeps the same 40px of blank space past either end, at most.
    expect(clampOffset(95, RULER_WIDTH, SPACING, scale)).toBeCloseTo(100 - 260 / SPACING);
    expect(clampOffset(-30, RULER_WIDTH, SPACING, scale)).toBeCloseTo(-40 / SPACING);
  });
});

describe("ScrubSlider", () => {
  it("names the slider by its label and speaks the unit with the value", () => {
    render(<ScrubSlider label="Width" unit="px" defaultValue={40} />);
    const slider = screen.getByRole("slider", { name: "Width" });
    expect(slider).toHaveAttribute("aria-valuenow", "40");
    expect(slider).toHaveAttribute("aria-valuetext", "40 px");
    expect(screen.getByText("px")).toHaveAttribute("data-slot", "scrub-slider-unit");
  });

  it("steps by keyboard and commits each change", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const commit = vi.fn();
    render(<ScrubSlider aria-label="Width" defaultValue={40} onValueChange={change} onValueCommitted={commit} />);

    await user.tab();
    expect(screen.getByRole("slider").closest('[data-slot="scrub-slider"]')).toHaveAttribute("data-active");
    await user.keyboard("{ArrowRight}");
    expect(change).toHaveBeenLastCalledWith(41, expect.objectContaining({ reason: "keyboard" }));
    expect(commit).toHaveBeenLastCalledWith(41, expect.anything());
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "31");
    await user.keyboard("{End}");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  it("changes nothing on press, then moves one step per tick dragged", () => {
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(
      <ScrubSlider aria-label="Width" defaultValue={40} onValueChange={change} onValueCommitted={commit} />,
    );
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    // Under the drag threshold it is still a click.
    fireEvent.pointerMove(root, { ...pointer, clientX: 152 });
    expect(root).not.toHaveAttribute("data-dragging");
    expect(change).not.toHaveBeenCalled();

    fireEvent.pointerMove(root, { ...pointer, clientX: 150 + SPACING * 3 });
    expect(root).toHaveAttribute("data-dragging");
    expect(root).toHaveAttribute("data-active");
    expect(change).toHaveBeenLastCalledWith(43, expect.objectContaining({ reason: "drag" }));
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 - SPACING * 2 });
    expect(change).toHaveBeenLastCalledWith(38, expect.objectContaining({ reason: "drag" }));

    fireEvent.pointerUp(root, { ...pointer, clientX: 150 - SPACING * 2 });
    expect(root).not.toHaveAttribute("data-dragging");
    expect(commit).toHaveBeenCalledExactlyOnceWith(38, expect.objectContaining({ reason: "drag" }));
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "38");
  });

  it("stops the indicator at min and max", () => {
    const change = vi.fn();
    const { container } = render(<ScrubSlider aria-label="Width" defaultValue={2} onValueChange={change} />);
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 60 });
    expect(change).toHaveBeenLastCalledWith(0, expect.anything());
    const indicator = container.querySelector<HTMLElement>('[data-slot="scrub-slider-indicator"]')!;
    // Tick 0 sits two ticks left of where the press landed.
    expect(indicator.style.translate).toBe(`${150 - SPACING * 2 - 1}px 0`);
  });

  it("scrolls the ruler and keeps changing the value while held at an edge", () => {
    const run = frames();
    const change = vi.fn();
    const { container } = render(<ScrubSlider aria-label="Width" max={1000} defaultValue={40} onValueChange={change} />);
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: RULER_WIDTH + 20 });
    const atEdge = change.mock.lastCall![0] as number;
    expect(atEdge).toBe(40 + Math.round(150 / SPACING));

    run(30);
    expect(root).toHaveAttribute("data-scrolling");
    const scrolled = change.mock.lastCall![0] as number;
    expect(scrolled).toBeGreaterThan(atEdge);

    // Back out of the zone, the ruler stops and the unit comes back.
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 });
    run(2);
    expect(root).not.toHaveAttribute("data-scrolling");
  });

  it("stops scrolling at the end of the scale", () => {
    const run = frames();
    const change = vi.fn();
    const { container } = render(<ScrubSlider aria-label="Width" max={60} defaultValue={40} onValueChange={change} />);
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: RULER_WIDTH });
    run(200);
    expect(change).toHaveBeenLastCalledWith(60, expect.anything());
    expect(root).not.toHaveAttribute("data-scrolling");
  });

  it("runs the ruler from the right in RTL", () => {
    const change = vi.fn();
    const { container } = render(
      <DirectionProvider direction="rtl">
        <ScrubSlider aria-label="Width" defaultValue={40} onValueChange={change} />
      </DirectionProvider>,
    );
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 - SPACING * 2 });
    expect(change).toHaveBeenLastCalledWith(42, expect.anything());
  });

  it("respects a canceled change and a controlled value", () => {
    function Controlled() {
      const [value, setValue] = useState(10);
      return (
        <ScrubSlider
          aria-label="Width"
          value={value}
          onValueChange={(next, details) => (next > 12 ? details.cancel() : setValue(next))}
        />
      );
    }
    const { container } = render(<Controlled />);
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 + SPACING * 2 });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "12");
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 + SPACING * 5 });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "12");
  });

  it("ignores the pointer when disabled, including by its field", () => {
    const change = vi.fn();
    const { container, rerender } = render(<ScrubSlider aria-label="Width" disabled onValueChange={change} />);
    let root = geometry(container);
    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    expect(root).not.toHaveAttribute("data-dragging");

    rerender(
      <Field.Root disabled>
        <ScrubSlider aria-label="Width" onValueChange={change} />
      </Field.Root>,
    );
    root = geometry(container);
    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 200 });
    expect(change).not.toHaveBeenCalled();
  });
});

describe("ScrubSlider hover", () => {
  it("previews the ruler on mouse hover only, and hands over to the active state on drag", () => {
    const { container } = render(<ScrubSlider aria-label="Width" defaultValue={40} />);
    const root = geometry(container);

    fireEvent.pointerEnter(root, { ...pointer, pointerType: "touch" });
    expect(root).not.toHaveAttribute("data-hovered");
    fireEvent.pointerEnter(root, { ...pointer, clientX: 150 });
    expect(root).toHaveAttribute("data-hovered");
    expect(root).not.toHaveAttribute("data-active");

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 160 });
    expect(root).toHaveAttribute("data-active");
    expect(root).not.toHaveAttribute("data-hovered");
    fireEvent.pointerUp(root, { ...pointer, clientX: 160 });
    expect(root).toHaveAttribute("data-hovered");

    fireEvent.pointerLeave(root, pointer);
    expect(root).not.toHaveAttribute("data-hovered");
  });

  it("shows no hover preview when disabled", () => {
    const { container } = render(<ScrubSlider aria-label="Width" disabled />);
    const root = geometry(container);
    fireEvent.pointerEnter(root, pointer);
    expect(root).not.toHaveAttribute("data-hovered");
  });
});

describe("ScrubSlider lens", () => {
  it("lifts ticks only while active", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const { container } = render(<ScrubSlider aria-label="Width" defaultValue={40} />);
    const root = geometry(container);
    const tallest = () => Math.max(...Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="scrub-slider-ticks"] > span'),
      (tick) => Number(tick.style.scale.split(" ")[1]),
    ));

    fireEvent.pointerEnter(root, pointer);
    expect(root).toHaveAttribute("data-hovered");
    expect(tallest()).toBe(8 / 16);
    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 156 });
    expect(tallest()).toBe(10 / 16);
  });
});

describe("ScrubSlider press", () => {
  it("sets the value at the pointer without moving the ruler", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const change = vi.fn();
    const { container } = render(<ScrubSlider aria-label="Width" max={1000} defaultValue={307} onValueChange={change} />);
    const root = geometry(container);
    const ticks = () => Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="scrub-slider-ticks"] > span'),
      (tick) => tick.style.translate,
    );

    const before = ticks();
    expect(before.length).toBeGreaterThan(0);
    // The value is centred at 150px; 220px is about 11.7 ticks right of it.
    fireEvent.pointerDown(root, { ...pointer, clientX: 220 });
    expect(change).not.toHaveBeenCalled();
    fireEvent.pointerMove(root, { ...pointer, clientX: 220 + SPACING * 3 });
    expect(ticks()).toEqual(before);
    expect(change).toHaveBeenNthCalledWith(1, 319, expect.objectContaining({ reason: "track-press" }));
    expect(change).toHaveBeenLastCalledWith(322, expect.objectContaining({ reason: "drag" }));
  });
});

describe("ScrubSlider bounds", () => {
  it("drags back toward max after reaching it, releasing, and pressing in the middle", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const run = frames();
    const change = vi.fn();
    const { container } = render(<ScrubSlider aria-label="Width" max={100} defaultValue={80} onValueChange={change} />);
    const root = geometry(container);
    const ticks = () => Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="scrub-slider-ticks"] > span'),
      (tick) => Number.parseFloat(tick.style.translate) + 0.5,
    );

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: RULER_WIDTH });
    run(120);
    expect(change).toHaveBeenLastCalledWith(100, expect.anything());
    // The end has scrolled in, leaving blank space past it.
    expect(Math.max(...ticks())).toBeCloseTo(RULER_WIDTH - 40);
    fireEvent.pointerUp(root, { ...pointer, clientX: RULER_WIDTH });

    change.mockClear();
    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 + SPACING * 5 });
    expect(Math.max(...ticks())).toBeCloseTo(RULER_WIDTH - 40);
    const pressed = change.mock.calls[0]![0] as number;
    expect(pressed).toBeLessThan(100);
    expect(change).toHaveBeenLastCalledWith(pressed + 5, expect.anything());
  });

  it("starts a value at an end with the same blank space past it", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const { container } = render(<ScrubSlider aria-label="Width" defaultValue={0} />);
    const ticks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="scrub-slider-ticks"] > span'),
      (tick) => Number.parseFloat(tick.style.translate) + 0.5,
    );
    expect(Math.min(...ticks)).toBeCloseTo(40);
  });
});

describe("ScrubSlider editing", () => {
  it("opens the number for typing on a click, with the ruler hidden", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(
      <ScrubSlider label="Width" unit="px" min={0} max={500} step={5} defaultValue={40} onValueChange={change} onValueCommitted={commit} />,
    );
    const root = geometry(container);

    fireEvent.pointerEnter(root, pointer);
    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerUp(root, { ...pointer, clientX: 151 });
    const input = screen.getByRole("textbox", { name: "Edit Width" });
    expect(input).toHaveFocus();
    expect(root).toHaveAttribute("data-editing");
    expect(root).not.toHaveAttribute("data-active");
    expect(root).not.toHaveAttribute("data-hovered");
    expect(change).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "123{Enter}");
    expect(change).toHaveBeenCalledExactlyOnceWith(125, expect.objectContaining({ reason: "none" }));
    expect(commit).toHaveBeenCalledExactlyOnceWith(125, expect.anything());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "125");
    expect(screen.getByRole("slider")).toHaveFocus();
  });

  it("cancels on Escape, and opens from the keyboard with Enter", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<ScrubSlider label="Width" defaultValue={40} onValueChange={change} />);

    await user.tab();
    await user.keyboard("{Enter}");
    const input = screen.getByRole("textbox", { name: "Edit Width" });
    await user.clear(input);
    await user.type(input, "90{Escape}");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });

  it("commits on blur and ignores unreadable text", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(<ScrubSlider label="Width" defaultValue={40} onValueChange={change} />);
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerUp(root, { ...pointer, clientX: 150 });
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "abc");
    await user.tab();
    expect(change).not.toHaveBeenCalled();

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerUp(root, { ...pointer, clientX: 150 });
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "250");
    await user.tab();
    expect(change).toHaveBeenCalledExactlyOnceWith(100, expect.anything());
  });
});

describe("ScrubSlider steppers", () => {
  it("nudges one step per click and stops at the bounds", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(
      <ScrubSlider label="Width" min={0} max={10} step={5} defaultValue={5} onValueChange={change} onValueCommitted={commit} />,
    );
    const root = geometry(container);
    const increase = screen.getByRole("button", { name: "Increase Width" });
    const decrease = screen.getByRole("button", { name: "Decrease Width" });

    await user.click(increase);
    expect(change).toHaveBeenLastCalledWith(10, expect.objectContaining({ reason: "none" }));
    expect(commit).toHaveBeenLastCalledWith(10, expect.anything());
    expect(increase).toHaveAttribute("aria-disabled", "true");
    await user.click(increase);
    expect(change).toHaveBeenCalledTimes(1);

    await user.click(decrease);
    await user.click(decrease);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
    expect(decrease).toHaveAttribute("aria-disabled", "true");
    // A chevron's press is its own: it never opens the editor or starts a scrub.
    expect(root).not.toHaveAttribute("data-editing");
    expect(root).not.toHaveAttribute("data-dragging");
  });

  it("is out of the tab order and stays in place while editing", () => {
    const { container } = render(<ScrubSlider label="Width" defaultValue={5} />);
    const root = geometry(container);
    expect(screen.getByRole("button", { name: "Increase Width" })).toHaveAttribute("tabindex", "-1");

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerUp(root, { ...pointer, clientX: 150 });
    expect(root).toHaveAttribute("data-editing");
    expect(screen.getByRole("button", { name: "Increase Width" })).toBeInTheDocument();
  });
});

describe("ScrubSlider nudge feedback", () => {
  it("shows the ruler briefly after a chevron nudge", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ScrubSlider label="Width" defaultValue={5} />);
      const root = geometry(container);
      fireEvent.click(screen.getByRole("button", { name: "Increase Width" }));
      expect(root).toHaveAttribute("data-nudged");
      act(() => vi.advanceTimersByTime(600));
      fireEvent.click(screen.getByRole("button", { name: "Increase Width" }));
      act(() => vi.advanceTimersByTime(600));
      // The second click restarted the timer.
      expect(root).toHaveAttribute("data-nudged");
      act(() => vi.advanceTimersByTime(500));
      expect(root).not.toHaveAttribute("data-nudged");
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "7");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ScrubSlider variants", () => {
  it.each(["card", "outline-ghost"] as const)("exposes the %s style", (variant) => {
    const { container } = render(<ScrubSlider aria-label="Width" variant={variant} />);
    expect(container.querySelector('[data-slot="scrub-slider"]')).toHaveAttribute("data-variant", variant);
  });
});

describe("ScrubSlider precision", () => {
  it("shows every value at the step's precision", () => {
    render(<ScrubSlider label="Scale" min={0.1} max={4} step={0.01} defaultValue={1.4} />);
    expect(screen.getByText("1.40")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "1.40");
  });

  it("leaves fraction digits to a format that sets them", () => {
    render(<ScrubSlider label="Scale" step={0.01} defaultValue={1.4} format={{ maximumFractionDigits: 1 }} />);
    expect(screen.getByText("1.4")).toBeInTheDocument();
  });
});

describe("ScrubSlider inline layout", () => {
  it("shows the ruler and a half-height indicator at rest, with no chevrons when off", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    const { container } = render(
      <ScrubSlider label="Gap" layout="inline" variant="plain" chevrons={false} size="sm" defaultValue={8} />,
    );
    const root = container.querySelector<HTMLElement>('[data-slot="scrub-slider"]')!;
    expect(root).toHaveAttribute("data-layout", "inline");
    expect(root).toHaveAttribute("data-variant", "plain");
    expect(screen.getByRole("slider", { name: "Gap" })).toBeInTheDocument();
    expect(screen.getByText("Gap")).toHaveClass("sr-only");
    expect(screen.queryByRole("button", { name: /Increase|Decrease/ })).not.toBeInTheDocument();

    const ruler = container.querySelector('[data-slot="scrub-slider-ruler"]')!;
    expect(ruler).not.toHaveClass("opacity-0");
    const indicator = container.querySelector('[data-slot="scrub-slider-indicator"]')!;
    expect(indicator).toHaveClass("opacity-100", "scale-y-50");
  });

  it("still scrubs and edits", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(
      <ScrubSlider aria-label="Gap" layout="inline" chevrons={false} defaultValue={8} onValueChange={change} />,
    );
    const root = geometry(container);

    fireEvent.pointerDown(root, { ...pointer, clientX: 150 });
    fireEvent.pointerMove(root, { ...pointer, clientX: 150 + SPACING * 2 });
    expect(change).toHaveBeenLastCalledWith(10, expect.anything());
    fireEvent.pointerUp(root, { ...pointer, clientX: 150 + SPACING * 2 });
    // A drag focuses the slider a frame later; let that land before the next click.
    await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

    const number = container.querySelector('[data-slot="scrub-slider-value"]')!;
    fireEvent.pointerDown(number, { ...pointer, clientX: 150 });
    fireEvent.pointerUp(number, { ...pointer, clientX: 150 });
    await user.clear(screen.getByRole("textbox", { name: "Edit Gap" }));
    await user.type(screen.getByRole("textbox", { name: "Edit Gap" }), "20{Enter}");
    expect(change).toHaveBeenLastCalledWith(20, expect.anything());
  });
});

describe("ScrubSlider sliding ruler", () => {
  it("keeps the indicator centred and moves the ruler under it", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(
      <ScrubSlider aria-label="Gap" layout="inline" ruler="sliding" chevrons={false} defaultValue={50} onValueChange={change} onValueCommitted={commit} />,
    );
    const root = geometry(container);
    const indicator = container.querySelector<HTMLElement>('[data-slot="scrub-slider-indicator"]')!;
    expect(root).toHaveAttribute("data-ruler", "sliding");
    expect(indicator).toHaveClass("opacity-100");
    expect(indicator.style.translate).toBe(`${RULER_WIDTH / 2 - 1}px 0`);

    // A press off-centre sets nothing; dragging toward the end pulls lower values under the line.
    fireEvent.pointerDown(root, { ...pointer, clientX: 40 });
    expect(change).not.toHaveBeenCalled();
    fireEvent.pointerMove(root, { ...pointer, clientX: 40 + SPACING * 3 });
    expect(change).toHaveBeenLastCalledWith(47, expect.objectContaining({ reason: "drag" }));
    expect(indicator.style.translate).toBe(`${RULER_WIDTH / 2 - 1}px 0`);
    // Past min the ruler stops with min under the line.
    fireEvent.pointerMove(root, { ...pointer, clientX: 40 + SPACING * 80 });
    expect(change).toHaveBeenLastCalledWith(0, expect.anything());
    fireEvent.pointerMove(root, { ...pointer, clientX: 40 - SPACING * 5 });
    expect(change).toHaveBeenLastCalledWith(55, expect.anything());
    fireEvent.pointerUp(root, { ...pointer, clientX: 40 - SPACING * 5 });
    expect(commit).toHaveBeenCalledExactlyOnceWith(55, expect.anything());
  });
});

describe("ScrubSlider inline clicks", () => {
  it("edits only from the number; a press on the ruler scrubs at once", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(RULER_WIDTH);
    const change = vi.fn();
    const commit = vi.fn();
    const { container } = render(
      <ScrubSlider aria-label="Gap" layout="inline" chevrons={false} defaultValue={50} onValueChange={change} onValueCommitted={commit} />,
    );
    const root = geometry(container);

    // The value is centred at 150px; a click 12px right of it lands two ticks up.
    fireEvent.pointerDown(root, { ...pointer, clientX: 162 });
    expect(root).toHaveAttribute("data-dragging");
    expect(root).toHaveAttribute("data-active");
    expect(change).toHaveBeenLastCalledWith(52, expect.objectContaining({ reason: "track-press" }));
    fireEvent.pointerUp(root, { ...pointer, clientX: 162 });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(commit).toHaveBeenLastCalledWith(52, expect.anything());

    const number = container.querySelector('[data-slot="scrub-slider-value"]')!;
    fireEvent.pointerDown(number, { ...pointer, clientX: 290 });
    fireEvent.pointerUp(number, { ...pointer, clientX: 290 });
    expect(screen.getByRole("textbox", { name: "Edit Gap" })).toHaveFocus();
  });
});
