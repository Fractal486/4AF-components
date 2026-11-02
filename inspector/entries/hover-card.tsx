import { bool, defineEntry, select } from "../schema";
import { HoverCardDemo } from "./hover-card.demo";

const SIDES = ["bottom", "top", "right", "left"] as const;

export const hoverCardEntry = defineEntry({
  slug: "hover-card",
  name: "Hover Card",
  controls: {
    side: select(SIDES, "bottom"),
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
