import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { bool, defineEntry, num, select, text } from "../schema";

const VARIANTS = ["outline", "ghost", "plain", "primary"] as const;

export const copyButtonEntry = defineEntry({
  slug: "copy-button",
  name: "Copy Button",
  controls: {
    variant: select(VARIANTS, "outline"),
    size: select(["icon-sm", "icon", "icon-lg"], "icon"),
    withLabel: bool(false, "Show a label"),
    value: text("npx shadcn@latest add copy-button", "Text to copy"),
    revertAfter: num(2000, { min: 500, max: 5000, step: 500, label: "Revert after (ms)" }),
  },
  render({ variant, size, withLabel, value, revertAfter }) {
    return (
      <CopyButton
        key={withLabel ? "labelled" : "icon"}
        value={value}
        variant={variant}
        size={withLabel ? undefined : size}
        revertAfter={revertAfter}
      >
        {withLabel ? "Copy command" : undefined}
      </CopyButton>
    );
  },
});
