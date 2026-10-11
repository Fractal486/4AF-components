import { ScrambleText } from "@/registry/ui/scramble-text/scramble-text";
import { defineEntry, num, text } from "../schema";

export const scrambleTextEntry = defineEntry({
  slug: "scramble-text",
  name: "Scramble Text",
  controls: {
    label: text("Deploying changes…", "Text"),
    intervalMs: num(32, {
      min: 8,
      max: 160,
      step: 8,
      label: "Interval (ms)",
    }),
  },
  render({ label, intervalMs }) {
    return (
      <p className="text-lg font-medium text-foreground">
        <ScrambleText intervalMs={intervalMs}>{label}</ScrambleText>
      </p>
    );
  },
});
