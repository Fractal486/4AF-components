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
    step: num(10, { min: 1, max: 25, step: 1, label: "Step" }),
    showTicks: bool(true, "Show ticks"),
    disabled: bool(false),
  },
  render({ thumb, size, label, step, showTicks, disabled }) {
    return (
      <div className="w-full max-w-sm">
        <Slider
          key={`${thumb}-${size}-${step}-${showTicks}-${disabled}`}
          thumb={thumb}
          size={size}
          label={label.trim() || undefined}
          defaultValue={DEFAULT_VALUE}
          step={step}
          showTicks={showTicks}
          disabled={disabled}
          aria-label={label.trim() || "Preview slider"}
        />
      </div>
    );
  },
});
