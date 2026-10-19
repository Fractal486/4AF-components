import { DatePicker, DateRangePicker } from "@/registry/ui/date-picker/date-picker";
import { bool, defineEntry, select } from "../schema";

export const datePickerEntry = defineEntry({
  slug: "date-picker",
  name: "Date Picker",
  controls: {
    mode: select(["single", "range"], "single"),
    variant: select(["default", "ghost", "plain"], "default"),
    size: select(["xs", "sm", "md"], "md"),
    dateFormat: select(["medium", "numeric"], "medium", "Format"),
    footer: bool(true, "Footer"),
  },
  render({ mode, variant, size, dateFormat, footer }) {
    return mode === "range" ? (
      <DateRangePicker
        key="range"
        variant={variant}
        size={size}
        dateFormat={dateFormat}
        clearable={footer}
        showToday={footer}
      />
    ) : (
      <DatePicker
        key="single"
        variant={variant}
        size={size}
        dateFormat={dateFormat}
        clearable={footer}
        showToday={footer}
      />
    );
  },
});
