import { Badge, type BadgeProps } from "@/registry/ui/badge/badge";
import { bool, defineEntry, select, text } from "../schema";
import { CyclingBadge } from "./badge-cycling";

const VARIANTS = ["solid", "bare"] as const;
const STATUSES = ["neutral", "info", "success", "warning", "danger", "loading"] as const;
const SIZES = ["sm", "md"] as const;

export const badgeEntry = defineEntry({
  slug: "badge",
  name: "Badge",
  controls: {
    // `bare` drops the pill and leaves just the coloured glyph and text.
    variant: select(VARIANTS, "solid"),
    // Changing the status rolls the glyph and label over; changing the label rolls the text.
    status: select(STATUSES, "success"),
    size: select(SIZES, "md"),
    label: text("Approved", "Label"),
    showIcon: bool(true, "Show icon"),
  },
  render({ variant, status, size, label, showIcon }) {
    return (
      <div className="flex flex-col items-center gap-8">
        <Badge
          variant={variant as BadgeProps["variant"]}
          status={status as BadgeProps["status"]}
          size={size as BadgeProps["size"]}
          showIcon={showIcon}
        >
          {label}
        </Badge>

        {/* Rolls through every status on a timer, hands-free. */}
        <CyclingBadge variant={variant as BadgeProps["variant"]} size={size as BadgeProps["size"]} />
      </div>
    );
  },
});
