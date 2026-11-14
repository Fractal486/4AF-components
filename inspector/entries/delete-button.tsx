import { DeleteButton } from "@/registry/ui/delete-button/delete-button";
import { TEXT_SIZES } from "../button-options";
import { defineEntry, select } from "../schema";

// Delete Button accepts only the quiet variants: red text on a solid fill has nowhere to
// escalate when it arms. Listed in the shared order.
const VARIANTS = ["outline", "outline-ghost", "ghost", "plain"] as const;

export const deleteButtonEntry = defineEntry({
  slug: "delete-button",
  name: "Delete Button",
  controls: {
    variant: select(VARIANTS, "outline-ghost"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    sizing: select(["widest", "current"], "widest", "Width"),
  },
  render({ variant, size, shape, sizing }) {
    return (
      <DeleteButton
        // Remounted per size so the Morph re-measures its reserved width from scratch.
        key={`${variant}-${size}`}
        variant={variant}
        size={size}
        shape={shape}
        sizing={sizing}
      >
        Delete
      </DeleteButton>
    );
  },
});
