"use client";

import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/registry/ui/checkbox/checkbox";
import { bool, defineEntry, select, text } from "../schema";

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
    label: text("Accept terms and conditions", "Label", undefined, (values) => values.mode !== "single"),
    defaultChecked: bool(true, "Checked", (values) => values.mode !== "single"),
    indeterminate: bool(false, undefined, (values) => values.mode !== "single"),
    disabled: bool(false),
    invalid: bool(false),
  },
  render({ mode, label, defaultChecked, indeterminate, disabled, invalid }) {
    if (mode !== "single") return <GroupPreview nested={mode === "nested"} disabled={disabled} invalid={invalid} />;
    const hasLabel = label.trim().length > 0;
    return (
      <Checkbox
        label={hasLabel ? label : undefined}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        // Only name it directly when there is no visible label.
        aria-label={hasLabel ? undefined : "Preview checkbox"}
      />
    );
  },
});
