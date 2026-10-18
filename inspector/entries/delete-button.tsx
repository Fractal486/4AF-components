import { DeleteButton } from "@/registry/ui/delete-button/delete-button";
import { TEXT_SIZES } from "../button-options";
import { defineEntry, num, select, text } from "../schema";

// Delete Button accepts only the quiet variants: red text on a solid fill has nowhere to
// escalate when it arms. Listed in the shared order.
const VARIANTS = ["outline", "ghost", "plain"] as const;

export const deleteButtonEntry = defineEntry({
  slug: "delete-button",
  name: "Delete Button",
  controls: {
    variant: select(VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    label: text("Delete", "Label"),
    confirmLabel: text("Confirm", "Confirm label"),
    sizing: select(["widest", "current"], "widest", "Width"),
    // How long an armed button waits before disarming itself. 0 leaves it armed until
    // Escape, a blur, or the confirming press.
    resetAfter: num(3000, { min: 0, max: 8000, step: 500, label: "Reset after (ms)" }),
  },
  render({ variant, size, shape, label, confirmLabel, sizing, resetAfter }) {
    return (
      <DeleteButton
        // Remounted per size so the Morph re-measures its reserved width from scratch.
        key={`${variant}-${size}`}
        variant={variant}
        size={size}
        shape={shape}
        confirmLabel={confirmLabel}
        resetAfter={resetAfter}
        sizing={sizing}
      >
        {label}
      </DeleteButton>
    );
  },
});
