import { FieldError } from "@/registry/ui/field-error/field-error";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { bool, defineEntry, select, text } from "../schema";

const TONES = ["neutral", "accent"] as const;

export const textareaEntry = defineEntry({
  slug: "textarea",
  name: "Textarea",
  controls: {
    tone: select(TONES, "neutral", "Focus tone"),
    placeholder: text("Type something...", "Placeholder"),
    resizable: bool(true, "Resize grip"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ tone, placeholder, resizable, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <Textarea
          tone={tone}
          placeholder={placeholder}
          resizable={resizable}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "textarea-error" : undefined}
          aria-label="Textarea preview"
          rows={4}
        />
        {invalid && <FieldError id="textarea-error">Please enter a valid value.</FieldError>}
      </div>
    );
  },
});
