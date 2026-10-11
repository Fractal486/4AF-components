import { Search } from "lucide-react";
import { Alert } from "@/registry/ui/alert/alert";
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
    startIcon: bool(false, "Leading icon"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, tone, type, placeholder, startIcon, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <Input
          variant={variant}
          tone={tone}
          type={type}
          placeholder={placeholder}
          startIcon={startIcon ? <Search /> : undefined}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "input-error" : undefined}
          aria-label="Input preview"
        />
        {invalid && <Alert id="input-error">Example validation error.</Alert>}
      </div>
    );
  },
});
