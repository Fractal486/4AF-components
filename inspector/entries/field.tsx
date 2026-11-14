import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldStatus,
} from "@/registry/ui/field/field";
import { Input } from "@/registry/ui/input/input";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { bool, defineEntry, select, withIcons } from "../schema";
import { FIELD_MARKER_ICONS } from "../setting-icons";

type ErrorKind = "none" | "message" | "list";

/** The error each layout shows: one message, or a server's list of several. */
function Errors({ kind, message }: { kind: ErrorKind; message: string }) {
  if (kind === "list") return <FieldError errors={[message, "Try a different one.", message]} />;
  return <FieldError match={kind === "message"}>{message}</FieldError>;
}

export const fieldEntry = defineEntry({
  slug: "field",
  name: "Field",
  controls: {
    // One setting for the pair that shows a marker: a required control with `*`, an
    // optional one with "(optional)", or a field left unmarked.
    marker: withIcons(select(["required", "optional", "none"], "required", "Marker"), FIELD_MARKER_ICONS),
    layout: select(["single", "horizontal", "fieldset"], "single", "Layout"),
    control: select(["input", "textarea"], "input", "Control", (values) => values.layout !== "single"),
    error: select(["none", "message", "list"], "none", "Error"),
    description: bool(true, "Description"),
    // A check or alert at the input's trailing edge, live as you type.
    status: bool(false, "Status", (values) => values.layout !== "single" || values.control !== "input"),
    disabled: bool(false),
  },
  render: ({ marker, layout, control, error, description, status, disabled }) => {
    const required = marker === "required";
    const invalid = error !== "none";

    if (layout === "horizontal") {
      return (
        <Field orientation="horizontal" indicator={marker} invalid={invalid} disabled={disabled} className="w-full max-w-sm">
          <Checkbox required={required} />
          <FieldContent>
            <FieldLabel>Accept the terms</FieldLabel>
            {description && <FieldDescription>You can read them any time in Settings.</FieldDescription>}
            <Errors kind={error} message="Accept the terms to continue." />
          </FieldContent>
        </Field>
      );
    }

    if (layout === "fieldset") {
      return (
        <FieldSet indicator={marker} disabled={disabled} className="w-full max-w-sm">
          <FieldLegend>Contact</FieldLegend>
          {description && <FieldDescription>How we reach you about your order.</FieldDescription>}
          <FieldGroup>
            <Field invalid={invalid}>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" placeholder="you@example.com" required={required} />
              <Errors kind={error} message="Enter an email address." />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input type="tel" placeholder="+1 555 0100" required={required} />
            </Field>
          </FieldGroup>
        </FieldSet>
      );
    }

    const isInput = control === "input";
    return (
      <Field
        indicator={marker}
        invalid={invalid || undefined}
        // With the status mark on, validate as you type, so the check and alert follow along.
        validationMode={status && isInput ? "onChange" : undefined}
        disabled={disabled}
        className="w-full max-w-sm"
      >
        <FieldLabel>{isInput ? "Email" : "Message"}</FieldLabel>
        {isInput ? (
          <Input
            type="email"
            placeholder="you@example.com"
            required={required}
            endAction={status ? <FieldStatus /> : undefined}
          />
        ) : (
          <Textarea placeholder="What's on your mind?" required={required} />
        )}
        {description && (
          <FieldDescription>{isInput ? "We only use it to reply." : "A sentence or two is plenty."}</FieldDescription>
        )}
        <Errors kind={error} message={isInput ? "Enter an email address." : "Write a message first."} />
      </Field>
    );
  },
});
