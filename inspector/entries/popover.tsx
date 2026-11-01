import { bool, defineEntry, select } from "../schema";
import { PopoverDemo } from "./popover.demo";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const popoverEntry = defineEntry({
  slug: "popover",
  name: "Popover",
  controls: {
    side: select(SIDES, "bottom"),
    content: select(["short", "long"] as const, "short"),
    autoSize: bool(true, "Smooth resize"),
    modal: bool(false, "Modal (trap focus)"),
    shared: bool(false, "Shared popover"),
  },
  render(props) {
    return <PopoverDemo {...props} />;
  },
});
