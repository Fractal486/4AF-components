import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { defineEntry, num, select, text } from "../schema";

export const blurTextEntry = defineEntry({
  slug: "blur-text",
  name: "Blur Text",
  controls: {
    label: text("Minimal React components built on Base UI.", "Text"),
    by: select(["character", "word"], "character", "Animate by"),
    delay: num(0, { min: 0, max: 1000, step: 50, label: "Delay (ms)" }),
  },
  render({ label, by, delay }) {
    return (
      <BlurText
        as="p"
        by={by}
        delay={delay}
        className="max-w-md text-center text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground"
      >
        {label}
      </BlurText>
    );
  },
});
