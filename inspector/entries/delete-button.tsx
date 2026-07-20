import { DeleteButton } from "@/registry/ui/delete-button/delete-button";
import { defineEntry, num, select, text } from "../schema";

const VARIANTS = ["outline", "ghost", "plain"] as const;
const SIZES = ["sm", "md", "lg"] as const;

export const deleteButtonEntry = defineEntry({
  slug: "delete-button",
  name: "Delete Button",
  controls: {
    variant: select(VARIANTS, "outline"),
    size: select(SIZES, "md"),
    label: text("Delete", "Label"),
    confirmLabel: text("Confirm", "Confirm label"),
    // How long an armed button waits before disarming itself. 0 leaves it armed until
    // Escape, a blur, or the confirming press.
    resetAfter: num(3000, { min: 0, max: 8000, step: 500, label: "Reset after (ms)" }),
  },
  render({ variant, size, label, confirmLabel, resetAfter }) {
    return (
      <DeleteButton
        // Remounted per size so the Morph re-measures its reserved width from scratch.
        key={`${variant}-${size}`}
        variant={variant}
        size={size}
        confirmLabel={confirmLabel}
        resetAfter={resetAfter}
      >
        {label}
      </DeleteButton>
    );
  },
});
