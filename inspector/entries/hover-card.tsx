import { bool, defineEntry, num, select } from "../schema";
import { HoverCardDemo } from "./hover-card.demo";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const hoverCardEntry = defineEntry({
  slug: "hover-card",
  name: "Hover Card",
  controls: {
    side: select(SIDES, "bottom"),
    content: select(["short", "long"] as const, "short"),
    delay: num(400, { min: 0, max: 1200, step: 100, label: "Open delay (ms)" }),
    loading: bool(false, "Loading"),
    autoSize: bool(true, "Smooth resize"),
    shared: bool(false, "Shared card"),
    lockSide: bool(true, "Stable side"),
  },
  render(props) {
    return <HoverCardDemo {...props} />;
  },
});
