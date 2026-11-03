import { bool, defineEntry, select, withIcons } from "../schema";
import { ANCHORED_SIDE_ICONS } from "../setting-icons";
import { HoverCardDemo } from "./hover-card.demo";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const hoverCardEntry = defineEntry({
  slug: "hover-card",
  name: "Hover Card",
  controls: {
    side: withIcons(select(SIDES, "bottom"), ANCHORED_SIDE_ICONS),
    content: select(["short", "long"] as const, "short"),
    loading: bool(false, "Loading"),
    autoSize: bool(true, "Smooth resize"),
    shared: bool(false, "Shared card"),
    lockSide: bool(true, "Stable side"),
  },
  render(props) {
    return <HoverCardDemo {...props} delay={400} />;
  },
});
