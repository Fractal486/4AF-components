"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { HalftoneHorizon, type HalftoneHorizonPalette } from "@/registry/ui/halftone-horizon/halftone-horizon";
import { bool, defineEntry, num, select, withIcons } from "../schema";
import { EDGE_SIDE_ICONS, HALFTONE_PALETTE_ICONS } from "../setting-icons";

// The bands scale with the box, but dots are a fixed pixel size, so a phone-sized box looks
// zoomed in. Below the playground's 768px breakpoint the demo draws finer dots to match.
const PHONE = "(max-width: 767px)";
const PHONE_SCALE = 0.7;

function subscribePhone(change: () => void) {
  const media = window.matchMedia(PHONE);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

function HalftoneDemo({ spacing = 7, ...props }: ComponentProps<typeof HalftoneHorizon>) {
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);
  return <HalftoneHorizon {...props} spacing={phone ? spacing * PHONE_SCALE : spacing} />;
}

const PALETTES = ["ember", "night", "ring", "ink"] as const satisfies readonly HalftoneHorizonPalette[];

export const halftoneHorizonEntry = defineEntry({
  slug: "halftone-horizon",
  name: "Halftone Horizon",
  controls: {
    palette: withIcons(select(PALETTES, "ember", "Palette"), HALFTONE_PALETTE_ICONS),
    direction: withIcons(select(["top", "right", "bottom", "left"], "top", "Dark edge"), EDGE_SIDE_ICONS),
    curve: num(1, { min: -3, max: 3, step: 0.1, label: "Curve" }),
    reach: num(1, { min: 0.4, max: 1.8, step: 0.05, label: "Reach" }),
    softness: num(1.1, { min: 0.4, max: 2.5, step: 0.05, label: "Softness" }),
    spacing: num(7, { min: 3, max: 24, step: 1, label: "Dot spacing (px)" }),
    minDot: num(0.25, { min: 0, max: 1, step: 0.05, label: "Smallest dot" }),
    dots: num(0.7, { min: 0.1, max: 1, step: 0.05, label: "Halftone reach" }),
    grain: num(0.04, { min: 0, max: 0.15, step: 0.01, label: "Grain" }),
    speed: num(1, { min: 0, max: 4, step: 0.25, label: "Speed" }),
    seed: num(0, { min: 0, max: 20, step: 1, label: "Seed" }),
    hover: bool(true, "Hover"),
    ripple: bool(true, "Ripple on click"),
    animate: bool(true, "Animate"),
    introFrom: num(0, { min: 0, max: 2, step: 0.25, label: "Intro from" }),
  },
  render({ palette, introFrom, ...settings }) {
    // The ink ramp starts from the page background, so its text follows the theme.
    const ink = palette === "ink" ? "text-foreground" : "text-white";
    return (
      // Settings update the running renderer in place; the playground's Replay button
      // remounts the demo to play the intro again.
      <HalftoneDemo
        {...settings}
        palette={palette}
        introFrom={introFrom}
        // The horizon fills the canvas, so a drag across it starts a measurement.
        data-measure-backdrop=""
        className="flex size-full flex-col items-center justify-start px-6 pt-[12%] text-center"
      >
        <p className={`text-xs font-medium uppercase tracking-[0.18em] opacity-60 ${ink}`}>Halftone Horizon</p>
        <p className={`mt-2 text-balance text-xl font-medium tracking-tight sm:text-3xl ${ink}`}>Printed in light</p>
      </HalftoneDemo>
    );
  },
});
