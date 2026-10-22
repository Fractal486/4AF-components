import { TZDate } from "react-day-picker";

/** Preserve the instant while using the same calendar date as the grid. */
export function inTimeZone(date: Date, timeZone?: string): Date {
  if (!timeZone || (date instanceof TZDate && date.timeZone === timeZone)) return date;
  return new TZDate(date, timeZone);
}
