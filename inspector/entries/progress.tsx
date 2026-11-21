import { Progress, ProgressCircle, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { bool, defineEntry, num, select } from "../schema";

/* One demo per shape, switched from the canvas rail: Progress and ProgressCircle are separate
   components, and some settings only apply to one of them. */

// Settings both shapes share; each demo adds its own size scale and labels.
const shared = () => ({
  color: select(["neutral", "colored"], "neutral", "Color"),
  value: num(60, { min: 0, max: 100, step: 1, label: "Value", disabledWhen: (values) => !!values.indeterminate }),
  indeterminate: bool(false, "Indeterminate"),
});

const fillColor = (color: "neutral" | "colored") => (color === "colored" ? "var(--ring)" : undefined);

export const progressEntry = defineEntry({
  slug: "progress",
  name: "Progress",
  controls: {
    ...shared(),
    size: select(["xs", "sm", "md", "lg"], "md", "Size"),
    segments: bool(false, "Segments", (values) => !!values.indeterminate),
    valueLabel: select(["hidden", "static", "animated"], "static", "Value label"),
    shimmer: bool(false, "Shimmer label", (values) => values.valueLabel === "hidden"),
  },
  render({ color, size, value, indeterminate, segments, valueLabel, shimmer }) {
    const showValue = valueLabel !== "hidden";
    return (
      <Progress
        value={indeterminate ? null : value}
        color={fillColor(color)}
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
            <ProgressValue animated={valueLabel === "animated" && !indeterminate} className="font-medium tabular-nums text-foreground" />
          </div>
        )}
      </Progress>
    );
  },
});

export const progressCircleEntry = defineEntry({
  slug: "progress-circle",
  name: "Circle",
  controls: {
    ...shared(),
    size: select(["sm", "md", "lg", "xl"], "lg", "Size"),
    // The two smallest circles are too small to hold a number.
    valueLabel: select(["hidden", "static", "animated"], "static", "Value label", (values) => values.size === "sm" || values.size === "md"),
  },
  render({ color, size, value, indeterminate, valueLabel }) {
    const showValue = valueLabel !== "hidden" && (size === "lg" || size === "xl");
    return (
      <ProgressCircle value={indeterminate ? null : value} color={fillColor(color)} size={size} aria-label="Upload progress">
        {showValue && <ProgressValue animated={valueLabel === "animated" && !indeterminate} className="font-medium tabular-nums text-foreground" />}
      </ProgressCircle>
    );
  },
});
