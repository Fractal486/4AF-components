import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, select } from "../schema";
import { ActionToggleDemo } from "./action-toggle.demo";

export const actionToggleEntry = defineEntry({
  slug: "action-toggle",
  name: "Action Toggle",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    // Automatic runs the real action on click; the others pin the toggle in one state.
    status: select(["automatic", "pending", "error"], "automatic", "Status"),
    fail: bool(false, "Fail on click", (values) => values.status !== "automatic"),
    sizing: select(["widest", "current"], "widest", "Width"),
  },
  render({ variant, size, shape, status, fail, sizing }) {
    return (
      <ActionToggleDemo
        variant={variant}
        size={size}
        shape={shape}
        status={status}
        fail={fail}
        sizing={sizing}
      />
    );
  },
});
