import { bool, defineEntry, num, select } from "../schema";
import { ActionButtonDemo } from "./action-button.demo";

export const actionButtonEntry = defineEntry({
  slug: "action-button",
  name: "Action Button",
  controls: {
    variant: select(["primary", "outline", "plain", "destructive"], "primary"),
    size: select(["xs", "sm", "md", "lg"], "md"),
    fail: bool(false, "Make it fail"),
    withIcon: bool(true, "Show leading icon"),
    pendingMode: select(["label", "icon"], "label", "Pending content"),
    duration: num(1200, { min: 200, max: 3000, step: 200, label: "Simulated delay (ms)" }),
    revertAfter: num(2000, { min: 500, max: 5000, step: 500, label: "Revert after (ms)" }),
  },
  render({ variant, size, fail, withIcon, pendingMode, duration, revertAfter }) {
    return (
      <ActionButtonDemo
        variant={variant}
        size={size}
        fail={fail}
        duration={duration}
        revertAfter={revertAfter}
        withIcon={withIcon}
        pendingMode={pendingMode}
      />
    );
  },
});
