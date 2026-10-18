import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { BUTTON_VARIANTS, ICON_SIZES, TEXT_SIZES } from "../button-options";
import { bool, defineEntry, select, text } from "../schema";

export const buttonEntry = defineEntry({
  slug: "button",
  name: "Button",
  controls: {
    variant: select(BUTTON_VARIANTS, "primary"),
    size: select([...TEXT_SIZES, ...ICON_SIZES], "md"),
    shape: select(["rectangular", "pill"], "rectangular", "Shape"),
    label: text("Deploy", "Label"),
    icon: select(["none", "leading", "trailing"], "none"),
    loading: bool(false),
    disabled: bool(false),
    asChild: bool(false, "Render as link"),
  },
  render({ variant, size, shape, label, icon, loading, disabled, asChild }) {
    const isIconOnly = size.startsWith("icon");

    const content = isIconOnly ? (
      <Plus />
    ) : (
      <>
        {icon === "leading" && <Plus />}
        {label}
        {icon === "trailing" && <ArrowRight />}
      </>
    );

    if (asChild) {
      return (
        <Button
          asChild
          variant={variant}
          size={size}
          shape={shape}
          loading={loading}
          disabled={disabled}
          aria-label={isIconOnly ? label : undefined}
        >
          <a href="https://example.com" target="_blank" rel="noreferrer">
            {content}
          </a>
        </Button>
      );
    }

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
