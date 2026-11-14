import { bool, defineEntry, select, withIcons } from "../schema";
import { ANCHORED_SIDE_ICONS } from "../setting-icons";
import { PopoverDemo } from "./popover.demo";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const popoverEntry = defineEntry({
  slug: "popover",
  name: "Popover",
  controls: {
    side: withIcons(select(SIDES, "bottom"), ANCHORED_SIDE_ICONS),
    content: select(["short", "long"] as const, "short"),
    autoSize: bool(true, "Smooth resize"),
    modal: bool(false, "Modal (trap focus)"),
    shared: bool(false, "Shared popover"),
  },
  render(props) {
    return <PopoverDemo {...props} />;
  },
});
