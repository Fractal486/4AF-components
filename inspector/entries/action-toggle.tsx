import { bool, defineEntry, num, select } from "../schema";
import { ActionToggleDemo } from "./action-toggle.demo";

export const actionToggleEntry = defineEntry({
  slug: "action-toggle",
  name: "Action Toggle",
  controls: {
    variant: select(["outline", "primary", "ghost"], "outline"),
    size: select(["sm", "md", "lg"], "md"),
    fail: bool(false, "Make it fail"),
    duration: num(1200, { min: 200, max: 3000, step: 200, label: "Simulated delay (ms)" }),
  },
  render({ variant, size, fail, duration }) {
    return (
      <ActionToggleDemo variant={variant} size={size} fail={fail} duration={duration} />
    );
  },
});
