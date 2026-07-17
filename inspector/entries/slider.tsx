import { Slider } from "@/registry/ui/slider/slider";
import { bool, defineEntry, num, select, text } from "../schema";

const THUMBS = ["bar", "circle", "knob"] as const;
const SIZES = ["sm", "md"] as const;

export const sliderEntry = defineEntry({
  slug: "slider",
  name: "Slider",
  controls: {
    thumb: select(THUMBS, "bar", "Thumb"),
    size: select(SIZES, "md", "Size"),
    label: text("Volume", "Label"),
    defaultValue: num(40, { min: 0, max: 100, step: 1, label: "Value" }),
    step: num(10, { min: 1, max: 25, step: 1, label: "Step" }),
    showTicks: bool(true, "Show ticks"),
    disabled: bool(false),
  },
  render({ thumb, size, label, defaultValue, step, showTicks, disabled }) {
    return (
      <div className="w-full max-w-sm">
        <Slider
          // Remounted when settings change so `defaultValue` re-applies.
          key={`${thumb}-${size}-${step}-${showTicks}-${disabled}`}
          thumb={thumb}
          size={size}
          label={label.trim() || undefined}
          defaultValue={defaultValue}
          step={step}
          showTicks={showTicks}
          disabled={disabled}
          aria-label={label.trim() || "Preview slider"}
        />
      </div>
    );
  },
});
