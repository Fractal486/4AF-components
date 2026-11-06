import { Alert } from "@/registry/ui/alert/alert";
import { Field } from "@base-ui/react/field";
import { useState, type ComponentProps } from "react";
import { Button } from "@/registry/ui/button/button";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { bool, defineEntry, range, select, withIcons } from "../schema";
import { STATE_ICONS } from "../setting-icons";

const TONES = ["neutral", "accent"] as const;

export const textareaEntry = defineEntry({
  slug: "textarea",
  name: "Textarea",
  controls: {
    variant: select(["default", "plain"] as const, "default", "Variant"),
    tone: select(TONES, "neutral", "Focus tone"),
    // Grow follows the content between the row bounds; resizable adds a drag grip instead.
    height: select(["grow", "resizable", "fixed"], "grow", "Height"),
    // A fixed or resizable field opens at the lower bound; only growing reaches the upper.
    rows: range([3, 10], { min: 1, max: 24, label: "Rows" }),
    submitOnShortcut: bool(false, "Submit shortcut"),
    description: bool(false, "Description"),
    state: withIcons(select(["default", "disabled", "invalid"], "default", "State"), STATE_ICONS, { dropdown: true }),
  },
  render({ variant, tone, height, rows, submitOnShortcut, description, state }) {
    const [minRows, maxRows] = rows;
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    return (
      <div className="w-full max-w-sm">
        <TextareaPreview
          variant={variant}
          tone={tone}
          placeholder="Type something…"
          resizable={height === "resizable"}
          autoResize={height === "grow"}
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
      <Button variant="outline-ghost" type="submit" size="sm" disabled={props.disabled}>Submit</Button>
    </div>}
  </form>;
}
