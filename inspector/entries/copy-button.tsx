import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { bool, defineEntry, num, select, text } from "../schema";

const VARIANTS = ["outline", "ghost", "primary", "brand"] as const;

export const copyButtonEntry = defineEntry({
  slug: "copy-button",
  name: "Copy Button",
  summary: "Copies to the clipboard and says so — visually, and out loud.",
  source: "Animate UI — rebuilt as Action Button with one specific action.",
  controls: {
    variant: select(VARIANTS, "outline"),
    size: select(["icon-sm", "icon", "icon-lg"], "icon"),
    withLabel: bool(false, "Show a label"),
    value: text("npx shadcn@latest add copy-button", "Text to copy"),
    morph: select(["pop", "fade", "lift"], "pop"),
    revertAfter: num(2000, { min: 500, max: 5000, step: 500, label: "Revert after (ms)" }),
  },
  notes: [
    "This is Action Button with one specific action. The state machine — success, failure, the revert timer, the unmount guard, the announcement — lives in exactly one place, so it can't drift between the two. The only thing this component owns is the clipboard.",
    "No spinner, ever. A clipboard write resolves in about a millisecond, well inside Action Button's `pendingDelay`, so it goes straight from copy to check. A spinner that flashes for one frame reads as a glitch, not as progress.",
    "Copy it, then paste somewhere. If the write fails you get a warning, not a check mark — a false confirmation is worse than none, because you'd move on and paste whatever was there before.",
    "It announces 'Copied' via a live region. A changing icon is invisible to a screen reader, and so is a swapped aria-label on a button that already has focus.",
    "Falls back to execCommand on insecure origins, where navigator.clipboard simply doesn't exist (plain HTTP — most local dev, and a lot of intranets). Focus is handed back afterwards, or the next Tab would restart from the top of the document.",
  ],
  render({ variant, size, withLabel, value, morph, revertAfter }) {
    return (
      <CopyButton
        key={withLabel ? "labelled" : "icon"}
        value={value}
        variant={variant}
        size={withLabel ? undefined : size}
        morph={morph}
        revertAfter={revertAfter}
      >
        {withLabel ? "Copy command" : undefined}
      </CopyButton>
    );
  },
  matrix() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            icon only
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((variant) => (
              <CopyButton key={variant} value={`copied from ${variant}`} variant={variant} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            with a label
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((variant) => (
              <CopyButton key={variant} value={`copied from ${variant}`} variant={variant}>
                Copy
              </CopyButton>
            ))}
          </div>
        </div>
      </div>
    );
  },
});
