"use client";

import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/registry/ui/checkbox/checkbox";
import { defineEntry, select, withIcons } from "../schema";
import { CHECKBOX_CHECKED_ICONS, STATE_ICONS } from "../setting-icons";

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
    checked: withIcons(select(["unchecked", "checked", "indeterminate"], "checked", "Checked"), CHECKBOX_CHECKED_ICONS),
    state: withIcons(select(["default", "disabled", "invalid"], "default", "State"), STATE_ICONS),
  },
  render({ checked, state }) {
    return (
      <Checkbox
        label="Accept terms and conditions"
        defaultChecked={checked === "checked"}
        indeterminate={checked === "indeterminate"}
        disabled={state === "disabled"}
        aria-invalid={state === "invalid" || undefined}
      />
    );
  },
});

/** A parent checkbox over a flat list, or over nested groups; the parent's mixed state comes from its children. */
function groupEntry(nested: boolean) {
  return defineEntry({
    slug: nested ? "checkbox-nested" : "checkbox-group",
    name: nested ? "Nested" : "Group",
    controls: {
      state: withIcons(select(["default", "disabled", "invalid"], "default", "State"), STATE_ICONS),
    },
    render({ state }) {
      return <GroupPreview nested={nested} disabled={state === "disabled"} invalid={state === "invalid"} />;
    },
  });
}

export const checkboxGroupEntry = groupEntry(false);
export const checkboxNestedEntry = groupEntry(true);
