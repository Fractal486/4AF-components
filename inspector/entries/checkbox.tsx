import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { bool, defineEntry, text } from "../schema";

export const checkboxEntry = defineEntry({
  slug: "checkbox",
  name: "Checkbox",
  controls: {
    label: text("Accept terms and conditions", "Label"),
    defaultChecked: bool(true, "Checked"),
    indeterminate: bool(false),
    disabled: bool(false),
  },
  render({ label, defaultChecked, indeterminate, disabled }) {
    const hasLabel = label.trim().length > 0;
    return (
      <Checkbox
        // Remounted when the settings change so `defaultChecked` re-applies —
        // an uncontrolled checkbox ignores a changed default otherwise.
        key={`${label}-${defaultChecked}-${indeterminate}-${disabled}`}
        label={hasLabel ? label : undefined}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        disabled={disabled}
        // With a visible label the label names it; an aria-label as well would override
        // and silence the visible text. Only name it directly when it's box-only.
        aria-label={hasLabel ? undefined : "Preview checkbox"}
      />
    );
  },
});
