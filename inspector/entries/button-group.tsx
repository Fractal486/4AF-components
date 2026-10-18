import { Archive, Copy, Share2, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";
import { CONTROL_VARIANTS, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, num, select } from "../schema";

const ACTIONS = [
  { label: "Copy", icon: Copy },
  { label: "Edit", icon: SquarePen },
  { label: "Share", icon: Share2 },
  { label: "Archive", icon: Archive },
  { label: "Delete", icon: Trash2 },
];

/** Icon-only buttons use the square sizes, so the group stays on one geometry. */
const ICON_SIZE = { xs: "icon-xs", sm: "icon-sm", md: "icon", lg: "icon-lg" } as const;

export const buttonGroupEntry = defineEntry({
  slug: "button-group",
  name: "Button Group",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline"),
    size: select(TEXT_SIZES, "md"),
    orientation: select(["horizontal", "vertical"], "horizontal"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    count: num(3, { min: 2, max: 5, label: "Buttons" }),
    icon: select(["none", "leading", "only"], "leading"),
    disableSecond: bool(false, "Disable the second button"),
  },
  render({ variant, size, orientation, shape, count, icon, disableSecond }) {
    const iconOnly = icon === "only";

    return (
      <ButtonGroup
        variant={variant}
        size={iconOnly ? ICON_SIZE[size] : size}
        orientation={orientation}
        shape={shape}
        aria-label="Item actions"
      >
        {ACTIONS.slice(0, count).map(({ label, icon: Icon }, index) => (
          <Button
            key={label}
            disabled={disableSecond && index === 1}
            aria-label={iconOnly ? label : undefined}
          >
            {icon !== "none" && <Icon />}
            {!iconOnly && label}
          </Button>
        ))}
      </ButtonGroup>
    );
  },
});
