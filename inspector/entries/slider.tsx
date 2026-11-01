import { Slider } from "@/registry/ui/slider/slider";
import { bool, defineEntry, num, select, text } from "../schema";

const THUMBS = ["bar", "circle", "knob"] as const;
const SIZES = ["sm", "md"] as const;
const DEFAULT_VALUE = 40;
const DEFAULT_RANGE = [30, 70] as const;

export const sliderEntry = defineEntry({
  slug: "slider",
  name: "Slider",
  controls: {
    thumb: select(THUMBS, "bar", "Thumb"),
    size: select(SIZES, "md", "Size"),
    orientation: select(["horizontal", "vertical"], "horizontal", "Orientation"),
    range: bool(false, "Range"),
    label: text("Volume", "Label"),
    // Bar only: the other two rails are too thin to hold a line of text.
    inlineLabel: bool(false, "Inline label", (values) => values.thumb !== "bar" || values.orientation === "vertical"),
    max: num(100, { min: 10, max: 500, step: 10, label: "Max" }),
    step: num(10, { min: 1, max: 25, step: 1, label: "Step" }),
    // The knob rail is 4px for md and 2px for sm, and carries the fill alone.
    showTicks: bool(true, "Show ticks", (values) => values.thumb === "knob"),
    showValueTooltip: bool(false, "Value tooltip"),
    animateValue: bool(false, "Animate value"),
    format: select(["number", "currency", "unit"], "number", "Format"),
    disabled: bool(false),
  },
  render({
    thumb,
    size,
    orientation,
    range,
    label,
    inlineLabel,
    max,
    step,
    showTicks,
    showValueTooltip,
    animateValue,
    format,
    disabled,
  }) {
    return (
      <div className={orientation === "vertical" ? "h-64" : "w-full max-w-sm"}>
        <Slider
          key={`${thumb}-${size}-${range}-${max}-${step}-${showTicks}-${showValueTooltip}-${disabled}-${inlineLabel}`}
          thumb={thumb}
          size={size}
          orientation={orientation}
          range={range}
          draggableRange={range}
          label={label.trim() || undefined}
          inlineLabel={inlineLabel}
          defaultValue={range ? DEFAULT_RANGE : DEFAULT_VALUE}
          max={max}
          step={step}
          showTicks={showTicks}
          showValueTooltip={showValueTooltip}
          animateValue={animateValue}
          format={format === "currency" ? { style: "currency", currency: "USD", maximumFractionDigits: 0 }
            : format === "unit" ? { style: "unit", unit: "celsius" } : undefined}
          disabled={disabled}
          aria-label={label.trim() ? undefined : "Preview slider"}
        />
      </div>
    );
  },
});
