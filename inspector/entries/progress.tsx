import { Progress, ProgressCircle, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { bool, defineEntry, num, select, withIcons } from "../schema";
import { PROGRESS_SHAPE_ICONS } from "../setting-icons";

export const progressEntry = defineEntry({
  slug: "progress",
  name: "Progress",
  controls: {
    shape: withIcons(select(["bar", "circle"], "bar", "Shape"), PROGRESS_SHAPE_ICONS),
    color: select(["neutral", "colored"], "neutral", "Color"),
    size: select(["xs", "sm", "md", "lg"], "md", "Size"),
    value: num(60, { min: 0, max: 100, step: 1, label: "Value", disabledWhen: (values) => !!values.indeterminate }),
    indeterminate: bool(false, "Indeterminate"),
    segments: bool(false, "Segments", (values) => values.shape !== "bar" || !!values.indeterminate),
    // The two smallest circles are too small to hold a number.
    valueLabel: select(["hidden", "static", "animated"], "static", "Value label", (values) => values.shape === "circle" && (values.size === "xs" || values.size === "sm")),
    shimmer: bool(false, "Shimmer label", (values) => values.shape !== "bar" || values.valueLabel === "hidden"),
  },
  render({ shape, color, size, value, indeterminate, segments, valueLabel, shimmer }) {
    const showValue = valueLabel !== "hidden";
    const animateValue = valueLabel === "animated" && !indeterminate;
    const fillColor = color === "colored" ? "var(--ring)" : undefined;
    if (shape === "circle") {
      const circleSize = { xs: "sm", sm: "md", md: "lg", lg: "xl" }[size] as "sm" | "md" | "lg" | "xl";
      return (
        <ProgressCircle value={indeterminate ? null : value} color={fillColor} size={circleSize} aria-label="Upload progress">
          {showValue && (circleSize === "lg" || circleSize === "xl") && <ProgressValue animated={animateValue} className="font-medium tabular-nums text-foreground" />}
        </ProgressCircle>
      );
    }
    return (
      <Progress
        value={indeterminate ? null : value}
        color={fillColor}
        size={size}
        segments={segments && !indeterminate ? [
          { value: value * 0.6, label: "images" },
          { value: value * 0.25, color: color === "colored" ? "royalblue" : "color-mix(in oklab, var(--primary) 65%, var(--muted))", label: "documents" },
          { value: value * 0.15, color: color === "colored" ? "orchid" : "color-mix(in oklab, var(--primary) 35%, var(--muted))", label: "other files" },
        ] : undefined}
        aria-label={showValue ? undefined : "Upload progress"}
        className="w-full max-w-sm space-y-2"
      >
        {showValue && (
          <div className="flex items-baseline justify-between text-sm">
            <ProgressLabel className="text-muted-foreground">
              {shimmer ? <TextShimmer>Uploading…</TextShimmer> : "Uploading…"}
            </ProgressLabel>
            <ProgressValue animated={animateValue} className="font-medium tabular-nums text-foreground" />
          </div>
        )}
      </Progress>
    );
  },
});
