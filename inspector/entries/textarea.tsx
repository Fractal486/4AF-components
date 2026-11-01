import { Alert } from "@/registry/ui/alert/alert";
import { Field } from "@base-ui/react/field";
import { useState, type ComponentProps } from "react";
import { Button } from "@/registry/ui/button/button";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { bool, defineEntry, num, select, text } from "../schema";

const TONES = ["neutral", "accent"] as const;

export const textareaEntry = defineEntry({
  slug: "textarea",
  name: "Textarea",
  controls: {
    variant: select(["default", "plain"] as const, "default", "Variant"),
    tone: select(TONES, "neutral", "Focus tone"),
    placeholder: text("Type something...", "Placeholder"),
    autoResize: bool(true, "Auto grow"),
    minRows: num(3, { min: 1, max: 12, label: "Minimum rows" }),
    maxRows: num(10, { min: 1, max: 24, label: "Maximum rows", disabledWhen: (values) => !values.autoResize }),
    resizable: bool(true, "Resize grip", (values) => Boolean(values.autoResize)),
    submitOnShortcut: bool(false, "Submit shortcut"),
    description: bool(false, "Description"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, tone, placeholder, autoResize, minRows, maxRows, resizable, submitOnShortcut, description, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <TextareaPreview
          variant={variant}
          tone={tone}
          placeholder={placeholder}
          resizable={resizable}
          autoResize={autoResize}
          minRows={minRows}
          maxRows={maxRows}
          submitOnShortcut={submitOnShortcut}
          description={description ? "Include any details that would be helpful." : null}
          disabled={disabled}
          invalid={invalid}
        />
      </div>
    );
  },
});

function TextareaPreview({ invalid, ...props }: ComponentProps<typeof Textarea> & { invalid: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  return <form className="space-y-3" onSubmit={(event) => {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
  }}>
    <Field.Root name="notes" invalid={invalid || undefined}>
      <Field.Label className="sr-only">Textarea preview</Field.Label>
      <Textarea {...props} required={props.submitOnShortcut} onChange={() => setSubmitted(false)} />
      {invalid && <Field.Error match render={<Alert />}>Example validation error.</Field.Error>}
    </Field.Root>
    {props.submitOnShortcut && <div className="flex items-center justify-between gap-3">
      <span role="status" className="text-xs text-muted-foreground">{submitted ? "Submitted" : "Ctrl / ⌘ + Enter to submit"}</span>
      <Button type="submit" size="sm" disabled={props.disabled}>Submit</Button>
    </div>}
  </form>;
}
