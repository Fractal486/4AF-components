import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, num, select } from "../schema";

const VALUE = "npx shadcn@latest add https://4af.selfsimilar.dev/r/copy-button.json";

export const copyButtonEntry = defineEntry({
  slug: "copy-button",
  name: "Copy Button",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    withLabel: bool(false, "Show a label"),
    revertAfter: num(2000, { min: 500, max: 5000, step: 500, label: "Revert after (ms)" }),
    lazy: bool(false, "Async value"),
  },
  render({ variant, size, shape, withLabel, revertAfter, lazy }) {
    return (
      <CopyButton
        key={withLabel ? "labelled" : "icon"}
        // The function form defers the work to the press. Here it also waits, to show the
        // pending state a real fetch would produce. A plain string can show the same
        // pending state if the clipboard write itself takes longer than pendingDelay.
        value={
          lazy
            ? async () => {
                await new Promise((resolve) => setTimeout(resolve, 900));
                return VALUE;
              }
            : VALUE
        }
        variant={variant}
        size={size}
        shape={shape}
        revertAfter={revertAfter}
      >
        {withLabel ? "Copy command" : undefined}
      </CopyButton>
    );
  },
});
