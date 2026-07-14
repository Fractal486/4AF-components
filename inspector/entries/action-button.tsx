import { bool, defineEntry, num, select } from "../schema";
import { ActionButtonDemo } from "./action-button.demo";

export const actionButtonEntry = defineEntry({
  slug: "action-button",
  name: "Action Button",
  summary: "Runs something, shows how it went, and puts itself away.",
  source: "Ours — Button + Morph, with the async state machine every app rewrites.",
  controls: {
    variant: select(["primary", "brand", "outline", "destructive"], "primary"),
    size: select(["sm", "md", "lg"], "md"),
    morph: select(["pop", "fade", "lift"], "pop"),
    fail: bool(false, "Make it fail"),
    duration: num(1200, { min: 200, max: 3000, step: 200, label: "Work takes (ms)" }),
    revertAfter: num(2000, { min: 500, max: 5000, step: 500, label: "Revert after (ms)" }),
  },
  notes: [
    "Idle → pending → success → idle. Turn on 'Make it fail' to see the fourth state: a failure that renders as success is the worst outcome available, because the user believes the work happened and moves on.",
    "The width never changes across all four states. Morph is handed every state at once, so the button reserves the width of the widest ('Deploying') and holds it. A button that resizes mid-action moves the target — and the cursor is still sitting on it, waiting.",
    "It can't be double-submitted. It's `disabled` while pending, and it also guards in the handler, because `disabled` is a DOM state and a programmatic `.click()` ignores it.",
    "Every state is announced. A sighted user sees a spinner; without a live region, everyone else gets silence.",
    "Navigate away mid-flight and nothing breaks: the action can resolve long after the component is gone, so the resolution checks whether it still exists before touching state.",
    "The spinner keeps spinning under reduced motion — collapsing a 1s rotation to zero makes a strobe, which is worse than the motion it was avoiding.",
  ],
  render({ variant, size, morph, fail, duration, revertAfter }) {
    return (
      <ActionButtonDemo
        variant={variant}
        size={size}
        morph={morph}
        fail={fail}
        duration={duration}
        revertAfter={revertAfter}
      />
    );
  },
  matrix() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            it succeeds
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {(["primary", "brand", "outline"] as const).map((variant) => (
              <ActionButtonDemo
                key={variant}
                variant={variant}
                size="md"
                morph="pop"
                fail={false}
                duration={1200}
                revertAfter={2000}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            it fails
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButtonDemo
              variant="destructive"
              size="md"
              morph="pop"
              fail
              duration={900}
              revertAfter={2000}
            />
            <ActionButtonDemo
              variant="outline"
              size="md"
              morph="fade"
              fail
              duration={900}
              revertAfter={2000}
            />
          </div>
        </div>
      </div>
    );
  },
});
