import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, select, withIcons } from "../schema";
import { ACTION_STATUS_ICONS } from "../setting-icons";
import { ActionButtonDemo } from "./action-button.demo";

export const actionButtonEntry = defineEntry({
  slug: "action-button",
  name: "Action Button",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline-ghost"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    // Automatic runs the real action on click; the others pin the button in one state.
    status: withIcons(select(["automatic", "pending", "success", "error"], "automatic", "Status"), ACTION_STATUS_ICONS, { dropdown: true }),
    fail: bool(false, "Fail on click", (values) => values.status !== "automatic"),
    withIcon: bool(true, "Show leading icon"),
    pendingMode: select(["label", "icon"], "label", "Pending content"),
    sizing: select(["widest", "current"], "widest", "Width"),
  },
  render({ variant, size, shape, status, fail, withIcon, pendingMode, sizing }) {
    return (
      <ActionButtonDemo
        variant={variant}
        size={size}
        shape={shape}
        status={status}
        fail={fail}
        withIcon={withIcon}
        pendingMode={pendingMode}
        sizing={sizing}
      />
    );
  },
});
