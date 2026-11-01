import { bool, defineEntry, select } from "../schema";
import { BadgePreview } from "./badge.demo";

export const badgeEntry = defineEntry({
  slug: "badge",
  name: "Badge",
  controls: {
    variant: select(["plain", "solid", "outline", "filled"] as const, "solid"),
    status: select(["neutral", "info", "success", "warning", "danger", "loading"] as const, "success"),
    size: select(["sm", "md", "lg"] as const, "sm"),
    shape: select(["rounded", "pill"] as const, "rounded"),
    icon: select(["icon", "dot", "none"] as const, "icon", "Icon"),
    pulse: bool(false, "Pulse", values => values.icon !== "dot"),
    neutralText: bool(false, "Neutral text", values => values.variant === "filled"),
    overflow: select(["truncate", "wrap"] as const, "truncate", "Long labels"),
    interactive: select(["none", "button", "link"] as const, "none", "Interactive", values => Boolean(values.removable)),
    invalid: bool(false, "Invalid"),
    removable: bool(false, "Removable"),
    count: bool(false, "Count"),
    animateCount: bool(false, "Animate count", values => !values.count),
  },
  render({ icon, overflow, ...values }) {
    return <BadgePreview {...values} label="Approved" showIcon={icon === "icon"} dot={icon === "dot"} wrap={overflow === "wrap"} />;
  },
});
