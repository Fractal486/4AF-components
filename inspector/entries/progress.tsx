import { Progress, ProgressCircle, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { bool, defineEntry, num, select } from "../schema";

export const progressEntry = defineEntry({
  slug: "progress",
  name: "Progress",
  controls: {
    shape: select(["bar", "circle"], "bar", "Shape"),
    color: select(["neutral", "colored"], "neutral", "Color"),
    size: select(["xs", "sm", "md", "lg"], "md", "Size"),
    value: num(60, { min: 0, max: 100, step: 1, label: "Value", disabledWhen: (values) => !!values.indeterminate }),
    indeterminate: bool(false, "Indeterminate"),
    segments: bool(false, "Segments", (values) => values.shape !== "bar" || !!values.indeterminate),
    showValue: bool(true, "Show value", (values) => values.shape === "circle" && (values.size === "xs" || values.size === "sm")),
    animateValue: bool(false, "Animate value", values => !values.showValue || !!values.indeterminate || (values.shape === "circle" && (values.size === "xs" || values.size === "sm"))),
    shimmer: bool(false, "Shimmer label", (values) => values.shape !== "bar" || !values.showValue),
  },
  render({ shape, color, size, value, indeterminate, segments, showValue, animateValue, shimmer }) {
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
