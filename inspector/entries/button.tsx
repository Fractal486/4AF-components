import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, select, text } from "../schema";

const VARIANTS = ["primary", "outline", "ghost", "plain", "destructive", "link"] as const;
const SIZES = ["sm", "md", "lg"] as const;

export const buttonEntry = defineEntry({
  slug: "button",
  name: "Button",
  controls: {
    variant: select(VARIANTS, "primary"),
    size: select([...SIZES, "icon-sm", "icon", "icon-lg"], "md"),
    label: text("Deploy", "Label"),
    icon: select(["none", "leading", "trailing"], "none"),
    loading: bool(false),
    disabled: bool(false),
    asChild: bool(false, "asChild (render as link)"),
  },
  render({ variant, size, label, icon, loading, disabled, asChild }) {
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
          loading={loading}
          disabled={disabled}
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
        loading={loading}
        disabled={disabled}
        aria-label={isIconOnly ? label : undefined}
      >
        {content}
      </Button>
    );
  },
});
