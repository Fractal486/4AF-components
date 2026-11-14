import { Radio, RadioGroup } from "@/registry/ui/radio/radio";
import { defineEntry, select, withIcons } from "../schema";
import { STATE_ICONS } from "../setting-icons";

const SIZES = ["sm", "md", "lg"] as const;

export const radioEntry = defineEntry({
  slug: "radio",
  name: "Radio",
  controls: {
    size: select(SIZES, "md", "Size"),
    state: withIcons(select(["default", "disabled", "invalid"], "default", "State"), STATE_ICONS),
  },
  render({ size, state }) {
    const disabled = state === "disabled";
    const invalid = state === "invalid";
    return (
      <RadioGroup size={size} defaultValue="standard" disabled={disabled} aria-label="Plan">
        <Radio value="standard" label="Standard" aria-invalid={invalid || undefined} />
        <Radio value="pro" label="Pro" aria-invalid={invalid || undefined} />
        <Radio value="enterprise" label="Enterprise" aria-invalid={invalid || undefined} />
      </RadioGroup>
    );
  },
});
