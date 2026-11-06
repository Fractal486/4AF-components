import { Bell, Bookmark, Heart, Star } from "lucide-react";
import { Toggle } from "@/registry/ui/toggle/toggle";
import { CONTROL_VARIANTS, ICON_SIZES } from "../button-options";
import { defineEntry, select, withIcons } from "../schema";
import { TOGGLE_PRESSED_FILL_ICONS } from "../setting-icons";

export const toggleEntry = defineEntry({
  slug: "toggle",
  name: "Toggle",
  controls: {
    variant: select(CONTROL_VARIANTS, "outline-ghost"),
    size: select(ICON_SIZES, "icon"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    // What changes when a toggle is pressed. The star starts pressed to show it.
    pressedFill: withIcons(select(["icon", "background", "both", "none"], "icon", "Pressed fill"), TOGGLE_PRESSED_FILL_ICONS),
  },
  render({ variant, size, shape, pressedFill }) {
    const fillIcon = pressedFill === "icon" || pressedFill === "both";
    const fillBackground = pressedFill === "background" || pressedFill === "both";
    return (
      <div className="flex items-center gap-3">
        {[
          { icon: <Bookmark />, label: "Bookmark", pressed: false },
          { icon: <Star />, label: "Star", pressed: true },
          { icon: <Heart />, label: "Like", pressed: false },
          { icon: <Bell />, label: "Notify", pressed: false },
        ].map(({ icon, label, pressed }) => (
          <Toggle
            key={label}
            variant={variant}
            size={size}
            shape={shape}
            fillIcon={fillIcon}
            fillBackground={fillBackground}
            defaultPressed={pressed}
            aria-label={label}
          >
            {icon}
          </Toggle>
        ))}
      </div>
    );
  },
});
