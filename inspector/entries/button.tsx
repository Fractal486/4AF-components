import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { BUTTON_VARIANTS, ICON_SIZES, TEXT_SIZES } from "../button-options";
import { defineEntry, select, withIcons } from "../schema";
import { BUTTON_STATE_ICONS } from "../setting-icons";

export const buttonEntry = defineEntry({
  slug: "button",
  name: "Button",
  controls: {
    variant: select(BUTTON_VARIANTS, "primary"),
    size: select([...TEXT_SIZES, ...ICON_SIZES], "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    icon: select(["none", "leading", "trailing"], "none", undefined, (values) => String(values.size).startsWith("icon")),
    state: withIcons(select(["default", "loading", "disabled"], "default", "State"), BUTTON_STATE_ICONS, { dropdown: true }),
  },
  render({ variant, size, shape, icon, state }) {
    const isIconOnly = size.startsWith("icon");
    const label = "Deploy";
    const loading = state === "loading";
    const disabled = state === "disabled";

    const content = isIconOnly ? (
      <Plus />
    ) : (
      <>
        {icon === "leading" && <Plus />}
        {label}
        {icon === "trailing" && <ArrowRight />}
      </>
    );

    return (
      <Button
        variant={variant}
        size={size}
        shape={shape}
        loading={loading}
        disabled={disabled}
        aria-label={isIconOnly ? label : undefined}
      >
        {content}
      </Button>
    );
  },
});
