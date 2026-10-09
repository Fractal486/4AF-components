"use client";

/**
 * Adapted from HextaUI's date picker and calendar:
 * https://hextaui.com/r/date-picker.json
 *
 * MIT License
 * Copyright (c) 2026 Preet Suthar
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { CalendarIcon } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/ui/popover/popover";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/ui/sheet/sheet";
import { Calendar, type CalendarProps, type DateRange } from "./calendar";
import {
  datePickerTriggerVariants,
  type DatePickerTriggerVariants,
} from "./date-picker.variants";

/**
 * A field that opens a calendar: a popover on desktop, a bottom sheet on phones.
 *
 * Every piece of behaviour is borrowed. The popover is Base UI's Popover and the phone
 * sheet is Base UI's Dialog (both through this library's own components, so they open and
 * close exactly like every other overlay here); the grid is react-day-picker. This file
 * only decides which surface to use, owns the value, and closes once a choice is complete.
 *
 * The panel never opens with nothing ready: focus lands on the selected day, or on today
 * when nothing is chosen, so the arrow keys start somewhere visible and Enter has an answer.
 * Base UI owns that initial focus (via `initialFocus`) rather than react-day-picker's
 * `autoFocus`, so there's one owner and no race between the two.
 */

const phoneQuery = "(max-width: 639px)";

function subscribePhone(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getPhone = () =>
  typeof window.matchMedia === "function" ? window.matchMedia(phoneQuery).matches : false;

function useIsPhone() {
  return useSyncExternalStore(subscribePhone, getPhone, () => false);
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
  /** The panel's accessible name, and the sheet's visible title on phones. */
  title?: string;
  /** BCP 47 locale for the trigger's label. Pass `calendarProps.locale` to localise the grid. */
  locale?: string;
  /** Adds a Clear action to the panel once a value is set. */
  clearable?: boolean;
  clearLabel?: string;
  /** Submits the value with a form, as `YYYY-MM-DD` (or `YYYY-MM-DD/YYYY-MM-DD` for a range). */
  name?: string;
  /** Forwarded to the Calendar: disabled days, `startMonth`/`endMonth`, `captionLayout`, … */
  calendarProps?: CalendarPassthrough;
}

interface DatePickerShellProps extends Omit<DatePickerSharedProps, "locale" | "calendarProps"> {
  label: string | undefined;
  hiddenValue: string | undefined;
  onClear: () => void;
  children: (close: () => void) => ReactNode;
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
  name,
  onClear,
  children,
  className,
  variant,
  size,
  disabled,
  ...props
}: DatePickerShellProps) {
  const phone = useIsPhone();
  const panelRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const hasValue = label !== undefined;

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const close = () => setOpen(false);

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
        <CalendarIcon aria-hidden />
        <span
          data-slot="date-picker-value"
          className={cn("min-w-0 truncate", !hasValue && "text-muted-foreground")}
        >
          {label ?? placeholder}
        </span>
      </>
    ),
  };

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

  if (phone) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger {...triggerProps} />
        {hidden}
        <SheetContent
          side="bottom"
          ref={panelRef}
          initialFocus={() => focusActiveDay(panelRef.current)}
          className="h-auto"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <SheetBody data-slot="date-picker-content" className="flex justify-center pb-5">
            {children(close)}
          </SheetBody>
          {clearButton ? <SheetFooter className="pt-0">{clearButton}</SheetFooter> : null}
        </SheetContent>
      </Sheet>
    );
  }

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
        <div data-slot="date-picker-content">{children(close)}</div>
        {clearButton ? (
          <div className="flex justify-end border-t border-border p-1.5">{clearButton}</div>
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
  calendarProps,
  ...props
}: DatePickerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolledValue;
  const formatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);

  const setValue = (next: Date | null) => {
    if (valueProp === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  return (
    <DatePickerShell
      {...props}
      placeholder={placeholder}
      title={title}
      label={value ? normalizeSpaces(formatter.format(value)) : undefined}
      hiddenValue={value ? toIsoDate(value) : undefined}
      onClear={() => setValue(null)}
    >
      {(close) => (
        <Calendar
          {...calendarProps}
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
  const label =
    from && to
      ? normalizeSpaces(isSameDay(from, to) ? formatter.format(from) : formatter.formatRange(from, to))
      : undefined;

  return (
    <DatePickerShell
      placeholder={placeholder}
      title={title}
      {...props}
      label={label}
      hiddenValue={from && to ? `${toIsoDate(from)}/${toIsoDate(to)}` : undefined}
      onClear={() => setValue(null)}
    >
      {(close) => (
        <DateRangeCalendar
          value={value}
          calendarProps={calendarProps}
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
