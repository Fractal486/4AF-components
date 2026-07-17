import { Radio, RadioGroup } from "@/registry/ui/radio/radio";
import { bool, defineEntry, select } from "../schema";

const SIZES = ["sm", "md", "lg"] as const;

export const radioEntry = defineEntry({
  slug: "radio",
  name: "Radio",
  controls: {
    size: select(SIZES, "md", "Size"),
    disabled: bool(false),
  },
  render({ size, disabled }) {
    return (
      <RadioGroup defaultValue="standard" disabled={disabled} aria-label="Plan">
        <Radio value="standard" size={size} label="Standard" />
        <Radio value="pro" size={size} label="Pro" />
        <Radio value="enterprise" size={size} label="Enterprise" />
      </RadioGroup>
    );
  },
});
