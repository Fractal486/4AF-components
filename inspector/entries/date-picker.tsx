import { DatePicker, DateRangePicker } from "@/registry/ui/date-picker/date-picker";
import { bool, defineEntry, select } from "../schema";

export const datePickerEntry = defineEntry({
  slug: "date-picker",
  name: "Date Picker",
  controls: {
    mode: select(["single", "range"], "single"),
    variant: select(["default", "ghost", "plain"], "default"),
    size: select(["xs", "sm", "md"], "md"),
    clearable: bool(true, "Clearable"),
  },
  render({ mode, variant, size, clearable }) {
    return mode === "range" ? (
      <DateRangePicker key="range" variant={variant} size={size} clearable={clearable} />
    ) : (
      <DatePicker key="single" variant={variant} size={size} clearable={clearable} />
    );
  },
});
