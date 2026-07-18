import { Progress } from "@/registry/ui/progress/progress";
import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { bool, defineEntry, num } from "../schema";

export const progressEntry = defineEntry({
  slug: "progress",
  name: "Progress",
  controls: {
    value: num(60, { min: 0, max: 100, step: 1, label: "Value" }),
    showValue: bool(true, "Show value"),
    shimmer: bool(false, "Shimmer label"),
  },
  render({ value, showValue, shimmer }) {
    return (
      <div className="w-full max-w-sm space-y-2">
        {showValue && (
          <div className="flex items-baseline justify-between text-sm">
            {shimmer ? (
              <TextShimmer>Uploading…</TextShimmer>
            ) : (
              <span className="text-muted-foreground">Uploading…</span>
            )}
            <span className="font-medium tabular-nums text-foreground">{value}%</span>
          </div>
        )}
        <Progress value={value} aria-label="Upload progress" />
      </div>
    );
  },
});
