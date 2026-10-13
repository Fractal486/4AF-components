import { Alert } from "@/registry/ui/alert/alert";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { bool, defineEntry, select, text } from "../schema";

const TONES = ["neutral", "accent"] as const;

export const textareaEntry = defineEntry({
  slug: "textarea",
  name: "Textarea",
  controls: {
    variant: select(["default", "plain"] as const, "default", "Variant"),
    tone: select(TONES, "neutral", "Focus tone"),
    placeholder: text("Type something...", "Placeholder"),
    resizable: bool(true, "Resize grip"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, tone, placeholder, resizable, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <Textarea
          variant={variant}
          tone={tone}
          placeholder={placeholder}
          resizable={resizable}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "textarea-error" : undefined}
          aria-label="Textarea preview"
          rows={4}
        />
        {invalid && <Alert id="textarea-error">Example validation error.</Alert>}
      </div>
    );
  },
});
