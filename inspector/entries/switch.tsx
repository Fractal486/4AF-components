"use client";

import { Switch } from "@/registry/ui/switch/switch";
import { bool, defineEntry, select, withIcons } from "../schema";
import { STATE_ICONS } from "../setting-icons";

const TONES = ["adaptive", "fixed"] as const;

export const switchEntry = defineEntry({
  slug: "switch",
  name: "Switch",
  controls: {
    tone: select(TONES, "adaptive"),
    icons: bool(false, "On/off marks"),
    saving: select(["off", "success", "failure"], "off", "Saving"),
    state: withIcons(select(["default", "disabled", "invalid"], "default", "State"), STATE_ICONS),
  },
  render({ tone, icons, saving, state }) {
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    return (
      <label
        className="flex items-center gap-2 text-sm text-foreground"
      >
        <Switch
          tone={tone}
          icons={icons}
          aria-invalid={invalid || undefined}
          onCheckedChange={saving === "off" ? undefined : () => new Promise<void>((resolve, reject) => {
            setTimeout(() => saving === "failure" ? reject(new Error("Could not save change.")) : resolve(), 1200);
          })}
          defaultChecked
          disabled={disabled}
        />
        <span data-disabled={disabled || undefined} className="data-disabled:opacity-50">
          Enable notifications
        </span>
      </label>
    );
  },
});
