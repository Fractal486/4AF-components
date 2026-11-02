"use client";

import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/registry/ui/checkbox/checkbox";
import { defineEntry, select } from "../schema";

const CHANNELS = [
  { name: "Email", items: [{ value: "email-updates", label: "Product updates" }, { value: "email-replies", label: "Replies" }] },
  { name: "Push", items: [{ value: "push-mentions", label: "Mentions" }, { value: "push-messages", label: "Messages" }] },
];
const ALL_VALUES = CHANNELS.flatMap((channel) => channel.items.map((item) => item.value));

function GroupPreview({ nested, disabled, invalid }: { nested: boolean; disabled: boolean; invalid: boolean }) {
  const [value, setValue] = useState(["email-updates"]);
  return (
    <CheckboxGroup aria-label="Notifications" value={value} onValueChange={setValue} allValues={ALL_VALUES} disabled={disabled}>
      <Checkbox parent label="Select all" aria-invalid={invalid || undefined} />
      <div className="flex flex-col gap-3 ps-6">
        {nested ? CHANNELS.map((channel) => {
          const values = channel.items.map((item) => item.value);
          return (
            <CheckboxGroup key={channel.name} aria-label={channel.name} allValues={values}
              value={value.filter((item) => values.includes(item))}
              onValueChange={(next) => setValue((current) => [...current.filter((item) => !values.includes(item)), ...next])}
              disabled={disabled}>
              <Checkbox parent label={channel.name} aria-invalid={invalid || undefined} />
              <div className="flex flex-col gap-3 ps-6">
                {channel.items.map((item) => <Checkbox key={item.value} value={item.value} label={item.label} aria-invalid={invalid || undefined} />)}
              </div>
            </CheckboxGroup>
          );
        }) : CHANNELS.flatMap((channel) => channel.items).map((item) => (
          <Checkbox key={item.value} value={item.value} label={item.label} aria-invalid={invalid || undefined} />
        ))}
      </div>
    </CheckboxGroup>
  );
}

export const checkboxEntry = defineEntry({
  slug: "checkbox",
  name: "Checkbox",
  controls: {
    mode: select(["single", "group", "nested"], "single", "Mode"),
    // Groups derive the parent's mixed state from their children, so this is single-only.
    checked: select(["unchecked", "checked", "indeterminate"], "checked", "Checked", (values) => values.mode !== "single"),
    state: select(["default", "disabled", "invalid"], "default", "State"),
  },
  render({ mode, checked, state }) {
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    if (mode !== "single") return <GroupPreview nested={mode === "nested"} disabled={disabled} invalid={invalid} />;
    return (
      <Checkbox
        label="Accept terms and conditions"
        defaultChecked={checked === "checked"}
        indeterminate={checked === "indeterminate"}
        disabled={disabled}
        aria-invalid={invalid || undefined}
      />
    );
  },
});
