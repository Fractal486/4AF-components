import { Input } from "@/registry/ui/input/input";
import { bool, defineEntry, select, text } from "../schema";

const VARIANTS = ["default", "plain", "underline"] as const;
const TONES = ["neutral", "accent"] as const;
const TYPES = ["text", "email", "password", "search", "url", "number"] as const;

export const inputEntry = defineEntry({
  slug: "input",
  name: "Input",
  controls: {
    variant: select(VARIANTS, "default"),
    tone: select(TONES, "neutral", "Focus tone"),
    type: select(TYPES, "text"),
    placeholder: text("Type something...", "Placeholder"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, tone, type, placeholder, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <Input
          variant={variant}
          tone={tone}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-label="Input preview"
        />
      </div>
    );
  },
});
