import { Input } from "@/registry/ui/input/input";
import { bool, defineEntry, select, text } from "../schema";

const VARIANTS = ["default", "plain", "underline"] as const;
const TYPES = ["text", "email", "password", "search", "url", "number"] as const;

export const inputEntry = defineEntry({
  slug: "input",
  name: "Input",
  controls: {
    variant: select(VARIANTS, "default"),
    type: select(TYPES, "text"),
    placeholder: text("Type something...", "Placeholder"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, type, placeholder, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <Input
          variant={variant}
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
