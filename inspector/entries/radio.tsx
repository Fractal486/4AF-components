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
      <RadioGroup size={size} defaultValue="standard" disabled={disabled} aria-label="Plan">
        <Radio value="standard" label="Standard" />
        <Radio value="pro" label="Pro" />
        <Radio value="enterprise" label="Enterprise" />
      </RadioGroup>
    );
  },
});
