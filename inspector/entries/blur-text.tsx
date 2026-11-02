import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { defineEntry, select } from "../schema";

export const blurTextEntry = defineEntry({
  slug: "blur-text",
  name: "Blur Text",
  controls: {
    by: select(["character", "word"], "character", "Animate by"),
  },
  render({ by }) {
    return (
      <BlurText
        as="p"
        by={by}
        className="max-w-md text-center text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground"
      >
        Minimal React components built on Base UI.
      </BlurText>
    );
  },
});
