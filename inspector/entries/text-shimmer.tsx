import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { num, defineEntry, text } from "../schema";

export const textShimmerEntry = defineEntry({
  slug: "text-shimmer",
  name: "Text Shimmer",
  controls: {
    label: text("Syncing changes…", "Label"),
    duration: num(2.5, { min: 0.5, max: 6, step: 0.5, label: "Duration (seconds)" }),
  },
  render({ label, duration }) {
    return <TextShimmer duration={duration} className="text-lg font-medium">{label}</TextShimmer>;
  },
});
