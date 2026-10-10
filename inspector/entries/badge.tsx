import { Badge, type BadgeProps } from "@/registry/ui/badge/badge";
import { bool, defineEntry, select, text } from "../schema";
import { CyclingBadge } from "./badge-cycling";

const VARIANTS = ["plain", "solid", "outline"] as const;
const STATUSES = ["neutral", "info", "success", "warning", "danger", "loading"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const SHAPES = ["rounded", "pill"] as const;

export const badgeEntry = defineEntry({
  slug: "badge",
  name: "Badge",
  controls: {
    // `plain` drops the box; `solid` uses a translucent status wash; `outline` keeps a gray edge.
    variant: select(VARIANTS, "solid"),
    // Changing the status rolls the glyph and label over; changing the label rolls the text.
    status: select(STATUSES, "success"),
    size: select(SIZES, "sm"),
    // The default compact corners or a fully rounded pill; `plain` remains boxless.
    shape: select(SHAPES, "rounded"),
    label: text("Approved", "Label"),
    showIcon: bool(true, "Show icon"),
    // A status dot in place of the icon — works on every variant.
    dot: bool(false, "Dot"),
    // Any CSS colour for the solid fill; empty keeps the status wash.
    color: text("", "Solid color", "oklch(0.7 0.15 250 / 0.2)"),
  },
  render({ variant, status, size, shape, label, showIcon, dot, color }) {
    return (
      <div className="flex flex-col items-center gap-8">
        <Badge
          variant={variant as BadgeProps["variant"]}
          status={status as BadgeProps["status"]}
          size={size as BadgeProps["size"]}
          shape={shape as BadgeProps["shape"]}
          showIcon={showIcon}
          dot={dot}
          color={color || undefined}
        >
          {label}
        </Badge>

        {/* Rolls through every status on a timer, hands-free. */}
        <CyclingBadge
          variant={variant as BadgeProps["variant"]}
          size={size as BadgeProps["size"]}
          shape={shape as BadgeProps["shape"]}
          dot={dot}
        />
      </div>
    );
  },
});
