import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, num, select } from "../schema";
import { ActionToggleDemo } from "./action-toggle.demo";

export const actionToggleEntry = defineEntry({
  slug: "action-toggle",
  name: "Action Toggle",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    status: select(["automatic", "idle", "pending", "error"], "automatic", "Status"),
    fail: bool(false, "Make it fail"),
    sizing: select(["widest", "current"], "widest", "Width"),
    duration: num(1200, { min: 200, max: 3000, step: 200, label: "Simulated delay (ms)" }),
  },
  render({ variant, size, shape, status, fail, sizing, duration }) {
    return (
      <ActionToggleDemo
        variant={variant}
        size={size}
        shape={shape}
        status={status}
        fail={fail}
        sizing={sizing}
        duration={duration}
      />
    );
  },
});
