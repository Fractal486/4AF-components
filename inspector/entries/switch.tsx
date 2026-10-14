"use client";

import { Switch } from "@/registry/ui/switch/switch";
import { bool, defineEntry, select, text } from "../schema";

const TONES = ["adaptive", "fixed"] as const;

export const switchEntry = defineEntry({
  slug: "switch",
  name: "Switch",
  controls: {
    label: text("Enable notifications", "Label"),
    tone: select(TONES, "adaptive"),
    defaultChecked: bool(true, "On"),
    disabled: bool(false),
  },
  render({ label, tone, defaultChecked, disabled }) {
    const hasLabel = label.trim().length > 0;
    return (
      <label
        className="flex items-center gap-2 text-sm text-foreground"
      >
        <Switch
          tone={tone}
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-label={hasLabel ? undefined : "Preview switch"}
        />
        {hasLabel && (
          <span data-disabled={disabled || undefined} className="data-disabled:opacity-50">
            {label}
          </span>
        )}
      </label>
    );
  },
});
