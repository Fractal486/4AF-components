import { Switch } from "@/registry/ui/switch/switch";
import { bool, defineEntry, select } from "../schema";

const TONES = ["adaptive", "fixed"] as const;

export const switchEntry = defineEntry({
  slug: "switch",
  name: "Switch",
  controls: {
    tone: select(TONES, "adaptive"),
    defaultChecked: bool(true, "On"),
    disabled: bool(false),
  },
  render({ tone, defaultChecked, disabled }) {
    return (
      <Switch
        // Remounted when the settings change so `defaultChecked` re-applies —
        // an uncontrolled switch ignores a changed default otherwise.
        key={`${tone}-${defaultChecked}-${disabled}`}
        tone={tone}
        defaultChecked={defaultChecked}
        disabled={disabled}
        aria-label="Preview switch"
      />
    );
  },
});
