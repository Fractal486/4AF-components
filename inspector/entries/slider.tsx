import { Slider } from "@/registry/ui/slider/slider";
import { bool, defineEntry, num, select, withIcons } from "../schema";
import { SLIDER_FORMAT_ICONS, SLIDER_ORIENTATION_ICONS } from "../setting-icons";

const SIZES = ["sm", "md"] as const;
const DEFAULT_VALUE = 40;
const DEFAULT_RANGE = [30, 70] as const;

type Thumb = "bar" | "circle" | "knob";

// Settings every thumb shares; each demo adds the ones only its thumb supports.
const shared = () => ({
  size: select(SIZES, "md", "Size"),
  orientation: withIcons(select(["horizontal", "vertical"], "horizontal", "Orientation"), SLIDER_ORIENTATION_ICONS),
  range: bool(false, "Range"),
  step: num(10, { min: 1, max: 25, step: 1, label: "Step" }),
  showValueTooltip: bool(false, "Value tooltip"),
  animateValue: bool(false, "Animate value"),
  format: withIcons(select(["number", "currency", "unit"], "number", "Format"), SLIDER_FORMAT_ICONS),
  disabled: bool(false),
});

interface DemoProps {
  thumb: Thumb;
  size: (typeof SIZES)[number];
  orientation: "horizontal" | "vertical";
  range: boolean;
  step: number;
  showValueTooltip: boolean;
  animateValue: boolean;
  format: "number" | "currency" | "unit";
  disabled: boolean;
  inlineLabel?: boolean;
  showTicks?: boolean;
  variant?: "default" | "outline-ghost";
}

function SliderDemo({ thumb, size, orientation, range, step, showValueTooltip, animateValue, format, disabled, inlineLabel = false, showTicks = false, variant = "default" }: DemoProps) {
  return (
    <div className={orientation === "vertical" ? "h-64" : "w-full max-w-sm"}>
      <Slider
        key={`${size}-${range}-${step}-${showTicks}-${showValueTooltip}-${disabled}-${inlineLabel}`}
        thumb={thumb}
        variant={variant}
        size={size}
        orientation={orientation}
        range={range}
        draggableRange={range}
        label="Volume"
        inlineLabel={inlineLabel}
        defaultValue={range ? DEFAULT_RANGE : DEFAULT_VALUE}
        step={step}
        showTicks={showTicks}
        showValueTooltip={showValueTooltip}
        animateValue={animateValue}
        format={format === "currency" ? { style: "currency", currency: "USD", maximumFractionDigits: 0 }
          : format === "unit" ? { style: "unit", unit: "celsius" } : undefined}
        disabled={disabled}
      />
    </div>
  );
}

/* One demo per thumb, switched from the canvas rail, since the thumb changes the whole look. */

export const sliderEntry = defineEntry({
  slug: "slider",
  name: "Slider",
  controls: {
    variant: select(["default", "outline-ghost"], "outline-ghost", "Style"),
    ...shared(),
    showTicks: bool(true, "Show ticks"),
    // Bar only: the other two rails are too thin to hold a line of text.
    inlineLabel: bool(false, "Inline label", (values) => values.orientation === "vertical"),
  },
  render: (values) => <SliderDemo thumb="bar" {...values} />,
});

export const sliderCircleEntry = defineEntry({
  slug: "slider-circle",
  name: "Circle",
  controls: {
    variant: select(["default", "outline-ghost"], "outline-ghost", "Style"),
    ...shared(),
    showTicks: bool(true, "Show ticks"),
  },
  render: (values) => <SliderDemo thumb="circle" {...values} />,
});

export const sliderKnobEntry = defineEntry({
  slug: "slider-knob",
  name: "Knob",
  // The knob's thin rail carries the fill alone, without ticks.
  controls: shared(),
  render: (values) => <SliderDemo thumb="knob" {...values} />,
});
