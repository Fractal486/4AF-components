import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { HALFTONE_HORIZON_DUSK, HalftoneHorizon } from "./halftone-horizon";

// jsdom has no WebGL (or 2D) canvas, so every render here takes the CSS gradient fallback.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function root() {
  return document.querySelector<HTMLElement>("[data-slot=halftone-horizon]")!;
}

describe("HalftoneHorizon", () => {
  it("renders children over a decorative canvas and forwards props and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <HalftoneHorizon ref={ref} id="hero" aria-label="Launch" className="min-h-96">
        <h1>Ship it</h1>
      </HalftoneHorizon>,
    );

    const element = root();
    expect(ref.current).toBe(element);
    expect(element).toHaveAttribute("id", "hero");
    expect(element).toHaveAttribute("aria-label", "Launch");
    expect(element).toHaveClass("relative", "isolate", "overflow-hidden", "min-h-96");
    expect(screen.getByRole("heading", { name: "Ship it" }).parentElement).toBe(element);

    const canvas = element.querySelector("canvas")!;
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-slot", "halftone-horizon-canvas");
    expect(canvas).toHaveClass("pointer-events-none", "-z-10");
  });

  it("exposes direction and animation on the element", () => {
    const { rerender } = render(<HalftoneHorizon />);
    expect(root()).toHaveAttribute("data-direction", "top");
    expect(root()).toHaveAttribute("data-animate", "true");

    rerender(<HalftoneHorizon direction="left" animate={false} />);
    expect(root()).toHaveAttribute("data-direction", "left");
    expect(root()).toHaveAttribute("data-animate", "false");
  });

  it("falls back to a paused CSS gradient without WebGL", () => {
    render(<HalftoneHorizon />);

    expect(root()).toHaveAttribute("data-renderer", "fallback");
    expect(root()).toHaveAttribute("data-state", "paused");
    expect(root().querySelector("canvas")).not.toHaveAttribute("data-ready");
  });

  it("draws the fallback gradient from the dark edge toward the light", () => {
    const { rerender } = render(<HalftoneHorizon colors={HALFTONE_HORIZON_DUSK} />);
    const gradient = () => root().style.backgroundImage;

    // `to bottom` is the default direction, which CSS serialization omits.
    expect(gradient()).toMatch(/^linear-gradient\((to bottom, )?oklch\(/);
    expect(gradient().match(/oklch\(/g)).toHaveLength(HALFTONE_HORIZON_DUSK.length);

    rerender(<HalftoneHorizon colors={HALFTONE_HORIZON_DUSK} direction="right" />);
    expect(gradient()).toContain("linear-gradient(to left,");
    rerender(<HalftoneHorizon colors={HALFTONE_HORIZON_DUSK} direction="bottom" />);
    expect(gradient()).toContain("linear-gradient(to top,");
    rerender(<HalftoneHorizon colors={HALFTONE_HORIZON_DUSK} direction="left" />);
    expect(gradient()).toContain("linear-gradient(to right,");
  });

  it("draws one color in shades, and uses an explicit ramp only when it has two stops", () => {
    const { rerender } = render(<HalftoneHorizon color="var(--ring)" />);
    expect(root().style.backgroundImage).toContain("oklch(from var(--ring)");

    rerender(<HalftoneHorizon color="var(--ring)" colors={["var(--background)"]} />);
    expect(root().style.backgroundImage).toContain("oklch(from var(--ring)");

    rerender(<HalftoneHorizon color="var(--ring)" colors={["var(--background)", "var(--foreground)"]} />);
    expect(root().style.backgroundImage).not.toContain("var(--ring)");
    expect(root().style.backgroundImage).toContain("var(--background), var(--foreground)");
  });

  it("lets caller styles override the fallback background", () => {
    render(<HalftoneHorizon style={{ backgroundImage: "none", minHeight: 200 }} />);

    expect(root().style.backgroundImage).toBe("none");
    expect(root().style.minHeight).toBe("200px");
  });
});
