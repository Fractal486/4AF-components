import { Search, TicketPercent, X } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { Button } from "@/registry/ui/button/button";
import { Alert } from "@/registry/ui/alert/alert";
import { Input, InputCount } from "@/registry/ui/input/input";
import { bool, defineEntry, select, text } from "../schema";

const VARIANTS = ["default", "plain", "underline"] as const;
const TONES = ["neutral", "accent"] as const;
const TYPES = ["text", "email", "password", "search", "url", "number", "date", "time", "file"] as const;

export const inputEntry = defineEntry({
  slug: "input",
  name: "Input",
  controls: {
    variant: select(VARIANTS, "default"),
    tone: select(TONES, "neutral", "Focus tone"),
    type: select(TYPES, "text"),
    multiple: bool(false, "Multiple files", (values) => values.type !== "file"),
    accept: select(["any", "images", "pdf"], "any", "Accepted files", (values) => values.type !== "file"),
    placeholder: text("Type something...", "Placeholder"),
    startIcon: bool(false, "Leading icon"),
    endAction: select(["none", "icon", "label"], "none", "Trailing action", (values) => values.type === "number" || values.type === "file"),
    description: bool(false, "Description"),
    count: bool(false, "Character counter", (values) => !["text", "email", "password", "search", "url"].includes(values.type as string)),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ variant, tone, type, multiple, accept, placeholder, startIcon, endAction, description, count, disabled, invalid }) {
    return (
      <div className="w-full max-w-sm">
        <InputPreview
          key={type}
          count={count && ["text", "email", "password", "search", "url"].includes(type)}
          variant={variant}
          tone={tone}
          type={type}
          multiple={type === "file" ? multiple : undefined}
          accept={type === "file" ? (accept === "images" ? "image/*" : accept === "pdf" ? ".pdf" : undefined) : undefined}
          placeholder={placeholder}
          startIcon={startIcon ? <Search /> : undefined}
          endAction={
            endAction === "icon" ? (
              <Button variant="ghost" size="icon-xs" aria-label="Clear" disabled={disabled}>
                <X />
              </Button>
            ) : endAction === "label" ? (
              <ActionButton
                variant="ghost"
                size="xs"
                icon={<TicketPercent />}
                action={() => new Promise((resolve) => setTimeout(resolve, 900))}
                labels={{ success: "Applied" }}
                disabled={disabled}
              >
                Apply
              </ActionButton>
            ) : undefined
          }
          description={description ? (type === "file" ? "Choose files from your device." : "Enter the value you want to use.") : null}
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

function InputPreview({ count, ...props }: ComponentProps<typeof Input> & { count: boolean }) {
  const [length, setLength] = useState(0);
  const countId = useId();
  return <>
    <Input {...props} maxLength={count ? 40 : undefined}
      aria-describedby={[props["aria-describedby"], count ? countId : undefined].filter(Boolean).join(" ") || undefined}
      onChange={(event) => setLength(event.currentTarget.value.length)} />
    {count && <div className="mt-1.5 text-end"><InputCount id={countId} length={length} maxLength={40} /></div>}
  </>;
}
