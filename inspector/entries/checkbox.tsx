"use client";

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
        label={hasLabel ? label : undefined}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        disabled={disabled}
        // Only name it directly when there is no visible label.
        aria-label={hasLabel ? undefined : "Preview checkbox"}
      />
    );
  },
});
