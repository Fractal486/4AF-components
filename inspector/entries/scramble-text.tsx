import { ScrambleText } from "@/registry/ui/scramble-text/scramble-text";
import { defineEntry, num } from "../schema";

export const scrambleTextEntry = defineEntry({
  slug: "scramble-text",
  name: "Scramble Text",
  controls: {
    intervalMs: num(32, {
      min: 8,
      max: 160,
      step: 8,
      label: "Interval (ms)",
    }),
  },
  render({ intervalMs }) {
    return (
      <p className="text-lg font-medium text-foreground">
        <ScrambleText data-job="deploy" intervalMs={intervalMs}>Deploying changes…</ScrambleText>
      </p>
    );
  },
});
