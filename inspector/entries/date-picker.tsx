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
    timeZone: select(["local", "Pacific/Kiritimati", "Pacific/Pago_Pago"], "local", "Time zone"),
    limitRange: bool(false, "Limit range to 1–7 nights"),
  },
  render({ mode, variant, size, dateFormat, footer, timeZone, limitRange }) {
    const calendarProps = { timeZone: timeZone === "local" ? undefined : timeZone };
    return mode === "range" ? (
      <DateRangePicker
        key="range"
        calendarProps={{ ...calendarProps, min: limitRange ? 1 : 0, max: limitRange ? 7 : 0 }}
        variant={variant}
        size={size}
        dateFormat={dateFormat}
        clearable={footer}
        showToday={footer}
      />
    ) : (
      <DatePicker
        key="single"
        calendarProps={calendarProps}
        variant={variant}
        size={size}
        dateFormat={dateFormat}
        clearable={footer}
        showToday={footer}
      />
    );
  },
});
