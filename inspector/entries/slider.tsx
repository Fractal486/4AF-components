import { Slider } from "@/registry/ui/slider/slider";
import { bool, defineEntry, num, select, text } from "../schema";

const THUMBS = ["bar", "circle", "knob"] as const;
const SIZES = ["sm", "md"] as const;
const DEFAULT_VALUE = 40;

export const sliderEntry = defineEntry({
  slug: "slider",
  name: "Slider",
  controls: {
    thumb: select(THUMBS, "bar", "Thumb"),
    size: select(SIZES, "md", "Size"),
    label: text("Volume", "Label"),
    max: num(100, { min: 10, max: 500, step: 10, label: "Max" }),
    step: num(10, { min: 1, max: 25, step: 1, label: "Step" }),
    showTicks: bool(true, "Show ticks"),
    showValueTooltip: bool(false, "Value tooltip"),
    disabled: bool(false),
  },
  render({ thumb, size, label, max, step, showTicks, showValueTooltip, disabled }) {
    return (
      <div className="w-full max-w-sm">
        <Slider
          key={`${thumb}-${size}-${max}-${step}-${showTicks}-${showValueTooltip}-${disabled}`}
          thumb={thumb}
          size={size}
          label={label.trim() || undefined}
          defaultValue={DEFAULT_VALUE}
          max={max}
          step={step}
          showTicks={showTicks}
          showValueTooltip={showValueTooltip}
          disabled={disabled}
          aria-label={label.trim() || "Preview slider"}
        />
      </div>
    );
  },
});
