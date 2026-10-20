"use client";

import { CalendarIcon, Undo2 } from "lucide-react";
import { DateLib } from "react-day-picker";
import {
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/ui/popover/popover";
import { Calendar, type CalendarProps, type DateRange } from "./calendar";
import {
  datePickerTriggerVariants,
  type DatePickerTriggerVariants,
} from "./date-picker.variants";

/**
 * A field that opens a calendar in a popover on every device.
 *
 * The popover uses Base UI through this library's Popover; the grid uses
 * react-day-picker. This file owns the value and closes once a choice is complete.
 *
 * The panel never opens with nothing ready: focus lands on the selected day, or on today
 * when nothing is chosen, so the arrow keys start somewhere visible and Enter has an answer.
 * Base UI owns that initial focus (via `initialFocus`) rather than react-day-picker's
 * `autoFocus`, so there's one owner and no race between the two.
 */

/**
 * Day / month / year in numbers, zero-padded, in that order in every locale: 19 / 10 / 2026.
 * The separators are dimmed so the numbers carry the reading.
 */
function NumericDate({ date }: { date: Date }) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const separator = <span className="text-muted-foreground"> / </span>;
  return (
    <>
      {day}
      {separator}
      {month}
      {separator}
      {date.getFullYear()}
    </>
  );
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Intl separates ranges with thin / narrow no-break spaces; plain spaces truncate cleanly. */
function normalizeSpaces(text: string) {
  return text.replace(/[   ]/g, " ");
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function focusActiveDay(panel: HTMLElement | null) {
  // react-day-picker gives exactly one day `tabindex="0"`: the selection, else today,
  // else the first enabled day.
  return panel?.querySelector<HTMLElement>('[data-slot="calendar-day-button"][tabindex="0"]') ?? true;
}

type CalendarPassthrough = Omit<
  CalendarProps,
  "mode" | "selected" | "onSelect" | "required" | "numberOfMonths" | "autoFocus"
>;

interface DatePickerSharedProps
  extends Omit<
      ComponentProps<"button">,
      "value" | "defaultValue" | "onChange" | "children" | "title" | "ref"
    >,
    DatePickerTriggerVariants {
  ref?: Ref<HTMLButtonElement>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shown in the trigger while nothing is chosen. */
  placeholder?: string;
  /** The popover's accessible name. */
  title?: string;
  /**
   * BCP 47 locale for the trigger's `medium` label. Pass `calendarProps.locale` to localise the
   * grid and the month / year picker.
   */
  locale?: string;
  /**
   * How the trigger shows the date. `medium` is the locale's medium date (Oct 19, 2026);
   * `numeric` is day / month / year in numbers, zero-padded (19 / 10 / 2026), whatever the locale.
   * @default "medium"
   */
  dateFormat?: "medium" | "numeric";
  /** Adds a Clear action to the panel once a value is set. */
  clearable?: boolean;
  clearLabel?: string;
  /** Label for the action that returns to the current month without selecting a date. */
  todayLabel?: string;
  /** Show the current-month navigation action. Defaults to true. */
  showToday?: boolean;
  /** Submits the value with a form, as `YYYY-MM-DD` (or `YYYY-MM-DD/YYYY-MM-DD` for a range). */
  name?: string;
  /** Forwarded to the Calendar: disabled days, `startMonth`/`endMonth`, `captionLayout`, … */
  calendarProps?: CalendarPassthrough;
}

interface DatePickerShellProps
  extends Omit<DatePickerSharedProps, "locale" | "calendarProps" | "dateFormat"> {
  label: ReactNode | undefined;
  hiddenValue: string | undefined;
  onClear: () => void;
  calendarProps?: CalendarPassthrough;
  children: (close: () => void, navigation: Pick<CalendarProps, "month" | "onMonthChange">) => ReactNode;
}

function DatePickerShell({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placeholder,
  title,
  label,
  hiddenValue,
  clearable = false,
  clearLabel = "Clear",
  todayLabel = "Today",
  showToday = true,
  calendarProps,
  name,
  onClear,
  children,
  className,
  variant,
  size,
  disabled,
  ...props
}: DatePickerShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [month, setMonth] = useState<Date>();
  const open = openProp ?? uncontrolledOpen;
  const hasValue = label !== undefined;

  const setOpen = (next: boolean) => {
    if (!next) setMonth(undefined);
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const close = () => setOpen(false);
  const navigation = {
    month: calendarProps?.month ?? month,
    onMonthChange: (next: Date) => {
      setMonth(next);
      calendarProps?.onMonthChange?.(next);
    },
  };

  const triggerProps = {
    ...props,
    disabled,
    className: cn(datePickerTriggerVariants({ variant, size }), className),
    "data-slot": "date-picker-trigger",
    "data-variant": variant ?? "default",
    "data-size": size ?? "md",
    "data-empty": hasValue ? undefined : "",
    children: (
      <>
        {/* The value takes the room, so the icon sits at the field's end. */}
        <span
          data-slot="date-picker-value"
          className={cn("min-w-0 flex-1 truncate", !hasValue && "text-muted-foreground")}
        >
          {label ?? placeholder}
        </span>
        <CalendarIcon aria-hidden />
      </>
    ),
  };

  const dateLib = new DateLib({ timeZone: calendarProps?.timeZone });
  const today = dateLib.startOfDay(calendarProps?.today ?? dateLib.today());
  const todayDisabled =
    calendarProps?.disableNavigation ||
    !!(calendarProps?.startMonth && today < dateLib.startOfMonth(calendarProps.startMonth)) ||
    !!(calendarProps?.endMonth && today > dateLib.endOfMonth(calendarProps.endMonth));
  const todayButton = showToday ? (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      data-slot="date-picker-today"
      className="me-auto"
      disabled={todayDisabled}
      onClick={() => {
        navigation.onMonthChange(dateLib.startOfMonth(today));
      }}
    >
      <Undo2 aria-hidden data-icon-start />
      {todayLabel}
    </Button>
  ) : null;

  const clearButton =
    clearable && hasValue ? (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        data-slot="date-picker-clear"
        onClick={() => {
          onClear();
          close();
        }}
      >
        {clearLabel}
      </Button>
    ) : null;

  const hidden = name !== undefined ? <input type="hidden" name={name} value={hiddenValue ?? ""} /> : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...triggerProps} />
      {hidden}
      <PopoverContent
        ref={panelRef}
        align="start"
        aria-label={title}
        initialFocus={() => focusActiveDay(panelRef.current)}
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
      >
        <div data-slot="date-picker-content">{children(close, navigation)}</div>
        {todayButton || clearButton ? (
          <div className="flex justify-end border-t border-border p-1.5">
            {todayButton}{clearButton}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/* -- Single date --------------------------------------------------------------------- */

export interface DatePickerProps extends DatePickerSharedProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
}

export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder = "Pick a date",
  title = "Select a date",
  locale = "en-US",
  dateFormat = "medium",
  calendarProps,
  ...props
}: DatePickerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolledValue;
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);
  const format = (date: Date) =>
    dateFormat === "numeric" ? <NumericDate date={date} /> : normalizeSpaces(formatter.format(date));

  const setValue = (next: Date | null) => {
    if (valueProp === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  return (
    <DatePickerShell
      {...props}
      placeholder={placeholder}
      title={title}
      label={value ? format(value) : undefined}
      hiddenValue={value ? toIsoDate(value) : undefined}
      onClear={() => setValue(null)}
      calendarProps={calendarProps}
    >
      {(close, navigation) => (
        <Calendar
          {...calendarProps}
          {...navigation}
          mode="single"
          required
          selected={value ?? undefined}
          defaultMonth={value ?? calendarProps?.defaultMonth}
          onSelect={(date) => {
            setValue(date);
            close();
          }}
        />
      )}
    </DatePickerShell>
  );
}

/* -- Range --------------------------------------------------------------------------- */

export interface DateRangePickerProps extends DatePickerSharedProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (value: DateRange | null) => void;
}

/**
 * Two clicks make a range, in either order: the first starts a fresh draft (even when a
 * range is already set — re-picking shouldn't mean extending the old one), the second
 * completes it and closes. Until then the committed value is untouched, so dismissing
 * mid-pick leaves the field as it was. One month, like the single picker: a range that
 * crosses a month boundary keeps its half-picked start while the user navigates.
 */
function DateRangeCalendar({
  value,
  calendarProps,
  onComplete,
}: {
  value: DateRange | null;
  calendarProps?: CalendarPassthrough;
  onComplete: (range: DateRange) => void;
}) {
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  return (
    <Calendar
      {...calendarProps}
      mode="range"
      defaultMonth={value?.from ?? calendarProps?.defaultMonth}
      selected={draft ?? value ?? undefined}
      onSelect={(_, day) => {
        if (!draft) {
          setDraft({ from: day, to: day });
          return;
        }
        const start = draft.from ?? day;
        setDraft(undefined);
        onComplete(day < start ? { from: day, to: start } : { from: start, to: day });
      }}
    />
  );
}

export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder = "Pick a date range",
  title = "Select dates",
  locale = "en-US",
  dateFormat = "medium",
  calendarProps,
  ...props
}: DateRangePickerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolledValue;
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);

  const setValue = (next: DateRange | null) => {
    if (valueProp === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const from = value?.from;
  const to = value?.to ?? value?.from;
  const label = !(from && to)
    ? undefined
    : dateFormat === "numeric"
      ? isSameDay(from, to)
        ? <NumericDate date={from} />
        : (
            <>
              <NumericDate date={from} />
              <span className="text-muted-foreground"> – </span>
              <NumericDate date={to} />
            </>
          )
      : normalizeSpaces(isSameDay(from, to) ? formatter.format(from) : formatter.formatRange(from, to));

  return (
    <DatePickerShell
      placeholder={placeholder}
      title={title}
      {...props}
      label={label}
      hiddenValue={from && to ? `${toIsoDate(from)}/${toIsoDate(to)}` : undefined}
      onClear={() => setValue(null)}
      calendarProps={calendarProps}
    >
      {(close, navigation) => (
        <DateRangeCalendar
          value={value}
          calendarProps={{ ...calendarProps, ...navigation }}
          onComplete={(range) => {
            setValue(range);
            close();
          }}
        />
      )}
    </DatePickerShell>
  );
}

export { Calendar, CalendarDayButton } from "./calendar";
export type { CalendarProps, DateRange } from "./calendar";
