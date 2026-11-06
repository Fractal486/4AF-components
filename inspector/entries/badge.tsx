import { bool, defineEntry, select, withIcons } from "../schema";
import { BADGE_STATUS_ICONS } from "../setting-icons";
import { BadgePreview } from "./badge.demo";

export const badgeEntry = defineEntry({
  slug: "badge",
  name: "Badge",
  controls: {
    variant: select(["plain", "solid", "outline", "filled"] as const, "solid"),
    status: withIcons(select(["neutral", "info", "success", "warning", "danger", "loading"] as const, "success"), BADGE_STATUS_ICONS),
    size: select(["sm", "md", "lg"] as const, "sm"),
    shape: select(["rounded", "pill"] as const, "rounded"),
    icon: select(["icon", "dot", "pulse", "none"] as const, "icon", "Icon"),
    neutralText: bool(false, "Neutral text", values => values.variant === "filled"),
    overflow: select(["truncate", "wrap"] as const, "truncate", "Long labels"),
    // A badge is one of these at a time: static, a button or link, or a removable tag.
    interactive: select(["none", "button", "link", "removable"] as const, "none", "Interactive"),
    content: select(["label", "count", "animatedCount"] as const, "label", "Content"),
    invalid: bool(false, "Invalid"),
  },
  render({ icon, overflow, interactive, content, ...values }) {
    return (
      <BadgePreview
        {...values}
        label="Approved"
        showIcon={icon === "icon"}
        dot={icon === "dot" || icon === "pulse"}
        pulse={icon === "pulse"}
        wrap={overflow === "wrap"}
        interactive={interactive === "removable" ? "none" : interactive}
        removable={interactive === "removable"}
        count={content !== "label"}
        animateCount={content === "animatedCount"}
      />
    );
  },
});
