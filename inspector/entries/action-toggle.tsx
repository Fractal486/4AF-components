import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, select, withIcons } from "../schema";
import { ACTION_STATUS_ICONS } from "../setting-icons";
import { ActionToggleDemo } from "./action-toggle.demo";

export const actionToggleEntry = defineEntry({
  slug: "action-toggle",
  name: "Action Toggle",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline-ghost"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    // Automatic runs the real action on click; the others pin the toggle in one state.
    status: withIcons(select(["automatic", "pending", "error"], "automatic", "Status"), ACTION_STATUS_ICONS, { dropdown: true }),
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
