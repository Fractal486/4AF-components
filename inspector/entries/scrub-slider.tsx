import { ScrubSlider } from "@/registry/ui/scrub-slider/scrub-slider";
import { bool, defineEntry, select, withIcons } from "../schema";
import { SCRUB_SLIDER_LAYOUT_ICONS, SCRUB_SLIDER_QUANTITY_ICONS, SCRUB_SLIDER_INDICATOR_ICONS } from "../setting-icons";

/**
 * Each quantity shows a different scale: a long pixel range that needs the edge scroll, a
 * short percentage, a signed angle, and a fractional step.
 */
const QUANTITIES = {
  width: { label: "Width", unit: "px", min: 0, max: 2000, step: 1, defaultValue: 307 },
  opacity: { label: "Opacity", unit: "%", min: 0, max: 100, step: 1, defaultValue: 80 },
  rotation: { label: "Rotation", unit: "°", min: -180, max: 180, step: 1, defaultValue: 15 },
  scale: { label: "Scale", unit: "×", min: 0.1, max: 4, step: 0.01, defaultValue: 1.25 },
} as const;

export const scrubSliderEntry = defineEntry({
  slug: "scrub-slider",
  name: "Scrub Slider",
  controls: {
    quantity: withIcons(select(["width", "opacity", "rotation", "scale"], "width", "Quantity"), SCRUB_SLIDER_QUANTITY_ICONS),
    layout: withIcons(select(["card", "inline"], "card", "Layout"), SCRUB_SLIDER_LAYOUT_ICONS),
    indicator: withIcons(select(["sliding", "fixed"], "sliding", "Indicator"), SCRUB_SLIDER_INDICATOR_ICONS),
    variant: select(["card", "outline-ghost", "plain"], "outline-ghost", "Style"),
    size: select(["sm", "md"], "md", "Size"),
    chevrons: bool(true, "Chevrons"),
    disabled: bool(false),
  },
  render: ({ quantity, layout, indicator, variant, size, chevrons, disabled }) => {
    const { defaultValue, ...scale } = QUANTITIES[quantity];
    return (
      <ScrubSlider
        key={quantity}
        {...scale}
        defaultValue={defaultValue}
        layout={layout}
        indicator={indicator}
        variant={variant}
        size={size}
        chevrons={chevrons}
        disabled={disabled}
      />
    );
  },
});
