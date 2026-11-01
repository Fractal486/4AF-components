import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { bool, num, defineEntry, select, text } from "../schema";

const TONES = ["neutral", "colored"] as const;

export const textShimmerEntry = defineEntry({
  slug: "text-shimmer",
  name: "Text Shimmer",
  controls: {
    label: text("Syncing changes…", "Label"),
    duration: num(2.5, { min: 0.5, max: 6, step: 0.5, label: "Duration (seconds)" }),
    tone: select(TONES, "neutral", "Color"),
    active: bool(true, "Active"),
    once: bool(false, "Run once"),
  },
  render({ label, duration, tone, active, once }) {
    return (
      <TextShimmer
        duration={duration}
        active={active}
        once={once}
        className={`text-lg font-medium ${tone === "colored" ? "text-ring" : "text-muted-foreground"}`}
      >
        {label}
      </TextShimmer>
    );
  },
});
