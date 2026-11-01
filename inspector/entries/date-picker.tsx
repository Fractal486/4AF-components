import { DateLib } from "react-day-picker";
import { DatePicker, DateRangePicker, type CalendarProps } from "@/registry/ui/date-picker/date-picker";
import { bool, defineEntry, select } from "../schema";

export const datePickerEntry = defineEntry({
  slug: "date-picker",
  name: "Date Picker",
  controls: {
    mode: select(["single", "multiple", "range"], "single"),
    variant: select(["default", "ghost", "plain"], "default"),
    size: select(["xs", "sm", "md"], "md"),
    dateFormat: select(["medium", "numeric"], "medium", "Format"),
    footer: bool(true, "Footer"),
    timeZone: select(["local", "Pacific/Kiritimati", "Pacific/Pago_Pago"], "local", "Time zone"),
    limitRange: bool(false, "Limit range to 1–7 nights", (values) => values.mode !== "range"),
    disabledDays: select(["none", "weekends", "past"], "none", "Disabled days"),
  },
  render({ mode, variant, size, dateFormat, footer, timeZone, limitRange, disabledDays }) {
    const zone = timeZone === "local" ? undefined : timeZone;
    const dateLib = new DateLib({ timeZone: zone });
    const disabled: CalendarProps["disabled"] = disabledDays === "weekends"
      ? { dayOfWeek: [0, 6] }
      : disabledDays === "past"
        ? { before: dateLib.startOfDay(dateLib.today()) }
        : undefined;
    const calendarProps = { timeZone: zone, disabled };
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
        key={mode}
        mode={mode}
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
