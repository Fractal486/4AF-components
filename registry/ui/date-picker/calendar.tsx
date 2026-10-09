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

import { useDirection } from "@base-ui/react/direction-provider";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type SyntheticEvent,
} from "react";
import {
  addToRange,
  DayPicker,
  useDayPicker,
  type ChevronProps,
  type DateRange,
  type DayButtonProps,
  type DayEventHandler,
  type DayProps,
  type MonthCaptionProps,
  type MonthProps,
  type MonthsProps,
  type RootProps,
  type WeekNumberProps,
  type WeeksProps,
} from "react-day-picker";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";

/**
 * A month grid for picking a date or a range.
 *
 * Behaviour is react-day-picker's. Base UI has no calendar, and a date grid is exactly the
 * kind of thing the contract forbids hand-rolling: roving tabindex across 42 cells, arrow /
 * Page / Home / End keys that cross month boundaries, `aria-selected` on gridcells, disabled
 * and hidden days, locale-aware week starts. This file only skins it and adds two things
 * the primitive doesn't do: a hover preview while a range is half-picked, and the month
 * transition.
 *
 * The month transition is CSS, not script. When the visible month changes, the weeks and
 * caption are remounted under a new key, and `@starting-style` lets them enter from the
 * side the user travelled toward — a slide and fade on `translate`/`opacity` only.
 * `fixedWeeks` defaults on so every month is six rows: the grid never changes height, so
 * there's no layout to animate and the popover around it never jumps. Navigating by
 * keyboard fades rather than slides, because a keyboard user holding PageDown wants the
 * grid to settle, not to sweep past on every press.
 */

type NavSource = "pointer" | "keyboard";
type MonthEnter = "next" | "prev" | "fade";

interface CalendarContextValue {
  todayKey: string | undefined;
  animate: boolean;
  hovered: Date | undefined;
  navSource: NavSource;
  setNavSource: (source: NavSource) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);
const CalendarPreviewContext = createContext<DateRange | undefined>(undefined);
const MonthMotionContext = createContext<{ key: number; enter: MonthEnter | undefined }>({
  key: 0,
  enter: undefined,
});

function useCalendarContext(part: string) {
  const context = useContext(CalendarContext);
  if (!context) throw new Error(`<${part}> must be used within <Calendar>.`);
  return context;
}

/** react-day-picker hands its slots non-DOM props; strip them before spreading onto an element. */
function omit<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  const result = { ...value };
  for (const key of keys) delete result[key];
  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* -- Today ---------------------------------------------------------------------------
   Read through an external store so the marker rolls over at midnight and when a tab
   that slept overnight becomes visible again. The server snapshot is `undefined`: the
   server's "today" is in the server's timezone, so the marker is drawn after hydration
   rather than risking a mismatch. */

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromDateKey(key: string) {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function subscribeToday(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, midnight.getTime() - now.getTime() + 1000);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };

  schedule();
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

const getTodayKey = () => toDateKey(new Date());
const getServerTodayKey = () => undefined;

function subscribeNothing() {
  return () => {};
}

/* -- Calendar ------------------------------------------------------------------------ */

export type CalendarProps = ComponentProps<typeof DayPicker>;

function composeDayHandler<E extends SyntheticEvent>(
  user: DayEventHandler<E> | undefined,
  internal: DayEventHandler<E> | undefined,
): DayEventHandler<E> | undefined {
  if (!internal) return user;
  return (date, modifiers, event) => {
    user?.(date, modifiers, event);
    if (!event.defaultPrevented) internal(date, modifiers, event);
  };
}

// The month buttons are ghost Buttons squared to the grid: a cell's size and corner, so
// they sit exactly over the first and last columns.
const navButtonClassName = "size-(--cell-size) rounded-(--cell-radius)";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  captionLayout = "label",
  navLayout = "around",
  animate = true,
  components,
  dir,
  today,
  onDayMouseEnter,
  onDayMouseLeave,
  onDayFocus,
  onDayBlur,
  ...props
}: CalendarProps) {
  const direction = useDirection();
  const [hovered, setHovered] = useState<Date>();
  const [navSource, setNavSource] = useState<NavSource>("pointer");
  // An explicit `today` or `timeZone` means the caller owns "today"; don't fight it.
  const managesToday = today === undefined && props.timeZone === undefined;
  const todayKey = useSyncExternalStore(
    managesToday ? subscribeToday : subscribeNothing,
    getTodayKey,
    getServerTodayKey,
  );
  const isRange = props.mode === "range";

  const context = useMemo<CalendarContextValue>(
    () => ({ todayKey: managesToday ? todayKey : undefined, animate, hovered, navSource, setNavSource }),
    [managesToday, todayKey, animate, hovered, navSource],
  );

  const track = useCallback<DayEventHandler<SyntheticEvent>>((date, modifiers) => {
    setHovered(modifiers.disabled ? undefined : date);
  }, []);
  const clear = useCallback<DayEventHandler<SyntheticEvent>>(() => setHovered(undefined), []);

  return (
    <CalendarContext.Provider value={context}>
      <DayPicker
        dir={dir ?? (direction === "rtl" ? "rtl" : undefined)}
        today={today ?? (managesToday && todayKey ? fromDateKey(todayKey) : undefined)}
        showOutsideDays={showOutsideDays}
        fixedWeeks={fixedWeeks}
        captionLayout={captionLayout}
        navLayout={navLayout}
        // react-day-picker's own `animate` is off: the transition below replaces it.
        animate={false}
        onDayMouseEnter={composeDayHandler(onDayMouseEnter, isRange ? track : undefined)}
        onDayMouseLeave={composeDayHandler(onDayMouseLeave, isRange ? clear : undefined)}
        onDayFocus={composeDayHandler(onDayFocus, isRange ? track : undefined)}
        onDayBlur={composeDayHandler(onDayBlur, isRange ? clear : undefined)}
        className={cn(
          "group/calendar w-fit max-w-full p-3 text-sm text-foreground",
          // 36px cells; 44px under a coarse pointer, the minimum comfortable touch target.
          "[--cell-radius:6px] [--cell-size:--spacing(9)] pointer-coarse:[--cell-size:--spacing(11)]",
          className,
        )}
        classNames={{
          months: "relative flex flex-col gap-4 sm:flex-row",
          month:
            "relative flex w-[calc(var(--cell-size)*7)] max-w-full min-w-0 flex-col gap-3 group-data-[week-numbers]/calendar:w-[calc(var(--cell-size)*8)]",
          nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-(--cell-size) items-center justify-between gap-1 *:pointer-events-auto",
          button_previous: cn(navButtonClassName, navLayout === "around" && "absolute start-0 top-0 z-10"),
          button_next: cn(navButtonClassName, navLayout === "around" && "absolute end-0 top-0 z-10"),
          month_caption: "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          dropdowns: "flex h-(--cell-size) w-full items-center justify-center gap-1 text-sm font-medium",
          dropdown_root: cn(
            "relative rounded-(--cell-radius)",
            "transition-[background-color] duration-(--duration-fast) ease-out",
            "has-focus-visible:ring-2 has-focus-visible:ring-ring [@media(hover:hover)]:has-[select:hover]:bg-muted",
          ),
          // The native <select> sits invisibly over the styled label: the platform's own
          // picker on every device, at the cost of nothing.
          dropdown: "absolute inset-0 cursor-pointer bg-surface text-foreground opacity-0",
          caption_label: cn(
            "font-medium select-none",
            captionLayout === "label"
              ? "truncate text-sm"
              : "flex h-8 items-center gap-1 rounded-(--cell-radius) ps-2 pe-1 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          ),
          month_grid: "w-full table-fixed border-collapse",
          weekdays: "flex",
          weekday: "w-(--cell-size) min-w-0 text-xs font-normal text-muted-foreground select-none",
          week: "mt-1 flex w-full",
          week_number_header: "w-(--cell-size) shrink-0 select-none",
          week_number: "text-xs font-normal text-muted-foreground select-none",
          day: cn(
            "group/day relative aspect-square w-(--cell-size) min-w-0 p-0 text-center select-none",
            "transition-[background-color] duration-(--duration-fast) ease-out",
            // Range-preview band while the second end is being chosen.
            "data-[preview]:bg-muted/60",
            "data-[preview=start]:rounded-s-(--cell-radius) data-[preview=end]:rounded-e-(--cell-radius)",
            "data-[preview=end]:data-[selected]:rounded-s-none data-[preview=start]:data-[selected]:rounded-e-none",
            // A band that wraps onto a new week gets rounded ends at the row edges.
            "[&:is([data-preview],[data-range-middle]):first-of-type]:rounded-s-(--cell-radius)",
            "[&:is([data-preview],[data-range-middle]):last-of-type]:rounded-e-(--cell-radius)",
            "[&:is([data-preview],[data-range-middle]):has(+[data-duplicate])]:rounded-e-(--cell-radius)",
            "[[data-duplicate]+&:is([data-preview],[data-range-middle])]:rounded-s-(--cell-radius)",
          ),
          range_start: "rounded-s-(--cell-radius) bg-muted",
          range_middle: "bg-muted",
          range_end: "rounded-e-(--cell-radius) bg-muted",
          hidden: "invisible",
          footer: "pt-3 text-sm text-pretty text-muted-foreground",
          ...classNames,
        }}
        components={{
          Root: CalendarRoot,
          Chevron: CalendarChevron,
          PreviousMonthButton: CalendarNavButton,
          NextMonthButton: CalendarNavButton,
          Months: CalendarMonths,
          Month: CalendarMonth,
          MonthCaption: CalendarMonthCaption,
          Weeks: CalendarWeeks,
          Day: CalendarDay,
          DayButton: CalendarDayButton,
          WeekNumber: CalendarWeekNumber,
          ...components,
        }}
        {...props}
      />
    </CalendarContext.Provider>
  );
}

function CalendarRoot({ className, rootRef, onKeyDownCapture, onPointerDownCapture, ...props }: RootProps) {
  const { todayKey, navSource, setNavSource } = useCalendarContext("CalendarRoot");

  return (
    <div
      ref={rootRef}
      className={className}
      // Capture phase, so the source is recorded before the key or click that changes
      // the month is handled — both land in the same render.
      onKeyDownCapture={(event) => {
        if (navSource !== "keyboard") setNavSource("keyboard");
        onKeyDownCapture?.(event);
      }}
      onPointerDownCapture={(event) => {
        if (navSource !== "pointer") setNavSource("pointer");
        onPointerDownCapture?.(event);
      }}
      {...props}
      data-slot="calendar"
      data-today={todayKey}
    />
  );
}

/**
 * react-day-picker's month buttons, as the library Button: same ghost colours, focus ring
 * and press spring as every other icon button. The primitive marks an unavailable month
 * with `aria-disabled` (and already ignores the click); it becomes `disabled` here so the
 * button dims and doesn't press toward a month it won't open.
 */
function CalendarNavButton({
  "aria-disabled": ariaDisabled,
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon"
      disabled={ariaDisabled === true || ariaDisabled === "true"}
    >
      {children}
    </Button>
  );
}

function CalendarChevron({ className, orientation, style }: ChevronProps) {
  const { dayPickerProps } = useDayPicker();
  // With nav "around", react-day-picker already swaps the orientation for RTL.
  const mirrored = dayPickerProps.navLayout === "around" && dayPickerProps.dir === "rtl";
  const Icon = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }[
    orientation ?? "left"
  ];

  return (
    <Icon
      aria-hidden
      className={cn(
        "size-4",
        !mirrored && (orientation === "left" || orientation === "right") && "rtl:-scale-x-100",
        className,
      )}
      style={style}
    />
  );
}

function CalendarMonths({ className, ...props }: MonthsProps) {
  const { hovered } = useCalendarContext("CalendarMonths");
  const { selected, dayPickerProps } = useDayPicker();

  // While exactly one end of a range is chosen, show what the range would become if the
  // hovered (or focused) day were picked next.
  const preview = useMemo(() => {
    if (dayPickerProps.mode !== "range" || !hovered) return undefined;
    const range = selected as DateRange | undefined;
    if (!range?.from || (range.to && !isSameDay(range.from, range.to))) return undefined;

    const next = addToRange(hovered, range, dayPickerProps.min, dayPickerProps.max, dayPickerProps.required);
    if (!next?.from || !next.to || isSameDay(next.from, next.to)) return undefined;
    return next;
  }, [dayPickerProps, hovered, selected]);

  return (
    <CalendarPreviewContext.Provider value={preview}>
      <div className={className} {...props} data-slot="calendar-months" />
    </CalendarPreviewContext.Provider>
  );
}

function CalendarMonth({ calendarMonth, className, ...rest }: MonthProps) {
  const props = omit(rest, "displayIndex");
  const { animate, navSource } = useCalendarContext("CalendarMonth");
  const time = calendarMonth.date.getTime();
  // The previous month is kept in state and compared during render, so the direction is
  // known in the same render the new weeks mount in — no effect, no flash of the old pose.
  const [shown, setShown] = useState<{ time: number; enter: MonthEnter | undefined }>({
    time,
    enter: undefined,
  });

  if (shown.time !== time) {
    setShown({
      time,
      enter: !animate ? undefined : navSource === "keyboard" ? "fade" : time > shown.time ? "next" : "prev",
    });
  }

  const motion = useMemo(() => ({ key: time, enter: shown.enter }), [time, shown.enter]);

  return (
    <MonthMotionContext.Provider value={motion}>
      <div className={className} {...props} data-slot="calendar-month" />
    </MonthMotionContext.Provider>
  );
}

/**
 * The entering pose, as `@starting-style`. Only applied while `data-enter` is set, which
 * it never is on first mount — so opening the picker doesn't animate the grid inside a
 * popover that is already animating itself. The mirrored offsets keep "next" arriving
 * from the trailing edge in RTL.
 */
const monthEnterClassName = cn(
  "transition-[translate,opacity] ease-out",
  "data-[enter]:starting:opacity-0",
  "data-[enter=fade]:duration-(--duration-fast)",
);

function CalendarMonthCaption({ className, ...rest }: MonthCaptionProps) {
  const props = omit(rest, "calendarMonth", "displayIndex");
  const { key, enter } = useContext(MonthMotionContext);

  return (
    <div
      key={key}
      className={cn(
        monthEnterClassName,
        // The caption travels less than the grid, so the two settle as one layered move.
        "duration-(--duration-base)",
        "data-[enter=next]:starting:translate-x-2.5 data-[enter=prev]:starting:-translate-x-2.5",
        "rtl:data-[enter=next]:starting:-translate-x-2.5 rtl:data-[enter=prev]:starting:translate-x-2.5",
        className,
      )}
      {...props}
      data-slot="calendar-month-caption"
      data-enter={enter}
    />
  );
}

function CalendarWeeks({ className, ...props }: WeeksProps) {
  const { key, enter } = useContext(MonthMotionContext);

  return (
    <tbody
      key={key}
      className={cn(
        monthEnterClassName,
        "duration-(--duration-slow)",
        "data-[enter=next]:starting:translate-x-6 data-[enter=prev]:starting:-translate-x-6",
        "rtl:data-[enter=next]:starting:-translate-x-6 rtl:data-[enter=prev]:starting:translate-x-6",
        className,
      )}
      {...props}
      data-slot="calendar-weeks"
      data-enter={enter}
    />
  );
}

function CalendarDay({ day, modifiers, className, children, ...props }: DayProps) {
  const preview = useContext(CalendarPreviewContext);
  const { months } = useDayPicker();
  // With two months side by side, an outside day of the left month is a real day of the
  // right one. Showing it twice reads as two different dates, so the copy is blanked.
  const duplicate =
    day.outside &&
    months.length > 1 &&
    months.some(
      (month) =>
        month.date.getFullYear() === day.date.getFullYear() &&
        month.date.getMonth() === day.date.getMonth(),
    );

  if (duplicate) {
    return (
      <td
        className={cn(className, "invisible")}
        {...props}
        aria-hidden
        data-slot="calendar-day"
        data-duplicate=""
      />
    );
  }

  let state: "start" | "middle" | "end" | undefined;
  if (preview?.from && preview.to && !modifiers.hidden) {
    if (isSameDay(day.date, preview.from)) state = "start";
    else if (isSameDay(day.date, preview.to)) state = "end";
    else if (day.date > preview.from && day.date < preview.to) state = "middle";
  }

  return (
    <td
      className={className}
      {...props}
      data-slot="calendar-day"
      data-preview={state}
      data-range-middle={modifiers.range_middle ? "" : undefined}
    >
      {children}
    </td>
  );
}

const dayButtonClassName = cn(
  "relative inline-flex size-full items-center justify-center rounded-(--cell-radius) p-0",
  "font-normal tabular-nums text-foreground outline-none",
  "transition-[background-color,color] duration-(--duration-fast) ease-out",
  "hover:bg-muted focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:text-subtle-foreground disabled:line-through disabled:hover:bg-transparent",
  "group-data-[outside]/day:text-subtle-foreground",
  // Today: a dot under the number. A fill would collide with hover and the range band.
  "data-[today]:font-semibold",
  "data-[today]:after:absolute data-[today]:after:bottom-1 data-[today]:after:left-1/2 data-[today]:after:size-1 data-[today]:after:-translate-x-1/2 data-[today]:after:rounded-full data-[today]:after:bg-current",
  // Chosen ends are ink, like the primary button; the middle of a range sits on the band.
  "data-[selected-single]:bg-primary data-[selected-single]:text-primary-foreground data-[selected-single]:hover:bg-primary-hover",
  "data-[range-start]:bg-primary data-[range-start]:text-primary-foreground data-[range-start]:hover:bg-primary-hover",
  "data-[range-end]:bg-primary data-[range-end]:text-primary-foreground data-[range-end]:hover:bg-primary-hover",
  "data-[range-middle]:rounded-none data-[range-middle]:hover:rounded-(--cell-radius) data-[range-middle]:hover:bg-foreground/6",
  "forced-colors:data-[selected-single]:outline-2 forced-colors:data-[range-start]:outline-2 forced-colors:data-[range-end]:outline-2",
);

export function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  // Focus follows react-day-picker's roving target. Its own DayButton does this too;
  // replacing the component means taking the job with it.
  const focusOnTarget = useCallback(
    (node: HTMLButtonElement | null) => {
      if (node && modifiers.focused) node.focus();
    },
    [modifiers.focused],
  );

  const rangeStart = Boolean(modifiers.range_start);
  const rangeEnd = Boolean(modifiers.range_end);
  const rangeMiddle = Boolean(modifiers.range_middle);
  const selectedSingle = Boolean(modifiers.selected) && !rangeStart && !rangeEnd && !rangeMiddle;

  return (
    <button
      ref={focusOnTarget}
      className={cn(dayButtonClassName, className)}
      {...props}
      data-slot="calendar-day-button"
      data-day={day.isoDate}
      data-today={modifiers.today && !modifiers.outside ? "" : undefined}
      data-selected-single={selectedSingle ? "" : undefined}
      data-range-start={rangeStart ? "" : undefined}
      data-range-end={rangeEnd ? "" : undefined}
      data-range-middle={rangeMiddle ? "" : undefined}
    />
  );
}

function CalendarWeekNumber({ children, className, ...rest }: WeekNumberProps) {
  const props = omit(rest, "week");
  return (
    <th className={className} {...props} data-slot="calendar-week-number">
      <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
    </th>
  );
}

export type { DateRange };
