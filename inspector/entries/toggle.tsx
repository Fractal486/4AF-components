import { Bell, Bookmark, Heart, Star } from "lucide-react";
import { Toggle } from "@/registry/ui/toggle/toggle";
import { CONTROL_VARIANTS, ICON_SIZES } from "../button-options";
import { bool, defineEntry, select } from "../schema";

export const toggleEntry = defineEntry({
  slug: "toggle",
  name: "Toggle",
  controls: {
    variant: select(CONTROL_VARIANTS, "ghost"),
    size: select(ICON_SIZES, "icon"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    fillIcon: bool(true, "Fill the icon when pressed"),
    defaultPressed: bool(false, "Start pressed"),
  },
  render({ variant, size, shape, fillIcon, defaultPressed }) {
    return (
      <div className="flex items-center gap-3">
        {[
          { icon: <Bookmark />, label: "Bookmark" },
          { icon: <Star />, label: "Star" },
          { icon: <Heart />, label: "Like" },
          { icon: <Bell />, label: "Notify" },
        ].map(({ icon, label }) => (
          <Toggle
            // Remounted when the settings change, so `defaultPressed` re-applies —
            // an uncontrolled component ignores a changed default otherwise.
            key={`${label}-${fillIcon}-${defaultPressed}-${variant}-${size}`}
            variant={variant}
            size={size}
            shape={shape}
            fillIcon={fillIcon}
            defaultPressed={defaultPressed}
            aria-label={label}
          >
            {icon}
          </Toggle>
        ))}
      </div>
    );
  },
});
