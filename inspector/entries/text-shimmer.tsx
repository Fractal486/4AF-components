import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { num, defineEntry, select } from "../schema";

const TONES = ["neutral", "colored"] as const;

export const textShimmerEntry = defineEntry({
  slug: "text-shimmer",
  name: "Text Shimmer",
  controls: {
    duration: num(2.5, { min: 0.5, max: 6, step: 0.5, label: "Duration (seconds)" }),
    tone: select(TONES, "neutral", "Color"),
    // Loop is the default; once sweeps a single pass, and off shows the resting text.
    play: select(["loop", "once", "off"], "loop", "Shimmer"),
  },
  render({ duration, tone, play }) {
    return (
      <TextShimmer
        duration={duration}
        active={play !== "off"}
        once={play === "once"}
        className={`text-lg font-medium ${tone === "colored" ? "text-ring" : "text-muted-foreground"}`}
      >
        Syncing changes…
      </TextShimmer>
    );
  },
});
