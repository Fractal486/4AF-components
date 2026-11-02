import { DateLib } from "react-day-picker";
import { DatePicker, DateRangePicker, type CalendarProps } from "@/registry/ui/date-picker/date-picker";
import { bool, defineEntry, select } from "../schema";

export const datePickerEntry = defineEntry({
  slug: "date-picker",
  name: "Date Picker",
  controls: {
    mode: select(["single", "multiple", "range"], "single"),
    variant: select(["default", "ghost", "plain"], "default"),
    tone: select(["neutral", "accent"], "neutral", "Open border", (values) => values.variant !== "default"),
    size: select(["xs", "sm", "md"], "md"),
    dateFormat: select(["medium", "numeric"], "medium", "Format"),
    footer: bool(true, "Footer"),
    limitRange: bool(false, "Limit range to 1–7 nights", (values) => values.mode !== "range"),
  },
  render({ mode, variant, tone, size, dateFormat, footer, limitRange }) {
    // Past days are always unavailable, so the demo shows disabled days without a setting.
    const dateLib = new DateLib();
    const disabled: CalendarProps["disabled"] = { before: dateLib.startOfDay(dateLib.today()) };
    const calendarProps = { disabled };
    return mode === "range" ? (
      <DateRangePicker
        key="range"
        calendarProps={{ ...calendarProps, min: limitRange ? 1 : 0, max: limitRange ? 7 : 0 }}
        variant={variant}
        tone={tone}
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
        tone={tone}
        size={size}
        dateFormat={dateFormat}
        clearable={footer}
        showToday={footer}
      />
    );
  },
});
