"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import {
  addToRange,
  DayPicker,
  DateLib,
  useDayPicker,
  type ChevronProps,
  type DateRange,
  type DayButtonProps,
  type DayEventHandler,
  type DayProps,
  type MonthCaptionProps,
  type MonthGridProps,
  type MonthProps,
  type MonthsProps,
  type RootProps,
  type WeekNumberProps,
  type WeeksProps,
} from "react-day-picker";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { inTimeZone } from "./date-picker.utils";

/**
 * A month grid for picking a date or a range.
 *
 * Behaviour is react-day-picker's. Base UI has no calendar, and a date grid is exactly the
 * kind of thing the contract forbids hand-rolling: roving tabindex across 42 cells, arrow /
 * Page / Home / End keys that cross month boundaries, `aria-selected` on gridcells, disabled
 * and hidden days, locale-aware week starts. This file only skins it and adds three things
 * the primitive doesn't do: a hover preview while a range is half-picked, the month
 * transition, and a month / year picker behind the caption.
 *
 * The month transition is CSS, not script. When the visible month changes, the weeks and
 * caption are remounted under a new key, and `@starting-style` lets them enter from the
 * side the user travelled toward — a slide and fade on `translate`/`opacity` only.
 * Only the weeks needed for the month are shown. A measured wrapper transitions height
 * as the number of weeks changes, so the surrounding panel resizes smoothly. Navigating by
 * keyboard fades rather than slides, because a keyboard user holding PageDown wants the
 * grid to settle, not to sweep past on every press.
 */

type NavSource = "pointer" | "keyboard";
type MonthEnter = "next" | "prev" | "fade";

interface CalendarContextValue {
  dateLib: DateLib;
  todayKey: string | undefined;
  animate: boolean;
  hovered: Date | undefined;
  navSource: NavSource;
  setNavSource: (source: NavSource) => void;
  /** Whether the month / year picker is showing in place of the day grid. */
  pickerOpen: boolean;
  /** The grid's height when the picker opened, held while it is open. */
  pickerHeight: number | undefined;
  setPickerOpen: (open: boolean, options?: { returnFocus?: boolean }) => void;
  /** The month shown, for the picker to mark and change. */
  month: Date;
  goToMonth: (month: Date) => void;
  monthNames: string[];
  years: number[];
  startMonth: Date | undefined;
  endMonth: Date | undefined;
  toggleRef: (node: HTMLButtonElement | null) => void;
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

// Small icon buttons centered over the first and last calendar columns.
const navButtonClassName = "m-[calc((var(--cell-size)-30px)/2)]";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = false,
  weekStartsOn = 1,
  captionLayout = "label",
  navLayout = "around",
  animate = true,
  components,
  formatters,
  dir,
  today: todayInput,
  onDayMouseEnter,
  onDayMouseLeave,
  onDayFocus,
  onDayBlur,
  month: monthInput,
  defaultMonth: defaultMonthInput,
  onMonthChange,
  ...props
}: CalendarProps) {
  const direction = useDirection();
  const timeZone = props.timeZone;
  const dateLib = useMemo(() => new DateLib({ timeZone }), [timeZone]);
  const { today, monthProp, defaultMonth, startMonth, endMonth } = useMemo(() => {
    const convert = (date: Date | undefined) => date && inTimeZone(date, timeZone);
    return {
      today: convert(todayInput), monthProp: convert(monthInput), defaultMonth: convert(defaultMonthInput),
      startMonth: convert(props.startMonth), endMonth: convert(props.endMonth),
    };
  }, [todayInput, monthInput, defaultMonthInput, props.startMonth, props.endMonth, timeZone]);
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

  // The shown month is held here (or by the caller, through `month`) so the month / year
  // picker can move it; react-day-picker's own navigation reports through `onMonthChange`.
  const { numberOfMonths = 1 } = props;
  const [innerMonth, setInnerMonth] = useState(() => {
    // Where react-day-picker would open: inside `startMonth` / `endMonth`, with every month of
    // a multi-month view in range.
    let initial = dateLib.startOfMonth(monthProp ?? defaultMonth ?? today ?? dateLib.today());
    const lastFirst =
      endMonth && dateLib.addMonths(dateLib.startOfMonth(endMonth), -(numberOfMonths - 1));
    if (lastFirst && initial > lastFirst) initial = lastFirst;
    if (startMonth && initial < dateLib.startOfMonth(startMonth)) initial = dateLib.startOfMonth(startMonth);
    return initial;
  });
  const shownMonth = inTimeZone(monthProp ?? innerMonth, timeZone);
  const goToMonth = useCallback(
    (next: Date) => {
      let target = dateLib.startOfMonth(inTimeZone(next, timeZone));
      if (startMonth && target < dateLib.startOfMonth(startMonth)) target = dateLib.startOfMonth(startMonth);
      if (endMonth && target > dateLib.startOfMonth(endMonth)) target = dateLib.startOfMonth(endMonth);
      setInnerMonth(target);
      onMonthChange?.(target);
    },
    [startMonth, endMonth, onMonthChange, dateLib, timeZone],
  );

  const [picker, setPicker] = useState<{ open: boolean; height: number | undefined }>({
    open: false,
    height: undefined,
  });
  const pickerOpen = picker.open;
  const toggleNode = useRef<HTMLButtonElement | null>(null);
  const returnFocus = useRef(false);
  const setPickerOpen = useCallback((open: boolean, options?: { returnFocus?: boolean }) => {
    returnFocus.current = !open && (options?.returnFocus ?? false);
    // The panel follows the number of weeks only in the day view. Measured as the picker
    // opens, the grid's height is held while it is open, so moving between months there
    // doesn't resize the panel; closing it lets the grid take the new month's height.
    // The computed height, not a rect, because the popover may still be scaling in; and not
    // `offsetHeight`, which rounds to whole pixels and grew the panel by the remainder.
    const grid = toggleNode.current
      ?.closest('[data-slot="calendar-month"]')
      ?.querySelector<HTMLElement>('[data-slot="calendar-month-grid"]');
    const height = grid ? Number.parseFloat(getComputedStyle(grid).height) : Number.NaN;
    setPicker({ open, height: open && Number.isFinite(height) ? height : undefined });
  }, []);
  const toggleRef = useCallback((node: HTMLButtonElement | null) => {
    toggleNode.current = node;
  }, []);
  // A month picked in the list unmounts the list, focus included, so focus goes back to
  // the toggle that opened it rather than being dropped on the page.
  useEffect(() => {
    if (pickerOpen || !returnFocus.current) return;
    returnFocus.current = false;
    toggleNode.current?.focus();
  }, [pickerOpen]);

  const localeCode = props.locale?.code;
  const monthNames = useMemo(() => {
    const format = new Intl.DateTimeFormat(localeCode, { month: "short", timeZone });
    return Array.from({ length: 12 }, (_, index) => format.format(dateLib.newDate(2000, index, 1)));
  }, [localeCode, timeZone, dateLib]);
  const shownYear = shownMonth.getFullYear();
  const thisYear = (today ?? dateLib.today()).getFullYear();
  const years = useMemo(() => {
    const first = Math.min(startMonth?.getFullYear() ?? thisYear - 100, shownYear);
    const last = Math.max(endMonth?.getFullYear() ?? thisYear + 20, shownYear);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [startMonth, endMonth, shownYear, thisYear]);

  const context = useMemo<CalendarContextValue>(
    () => ({
      dateLib,
      todayKey: managesToday ? todayKey : undefined,
      animate,
      hovered,
      navSource,
      setNavSource,
      pickerOpen,
      pickerHeight: picker.height,
      setPickerOpen,
      month: shownMonth,
      goToMonth,
      monthNames,
      years,
      startMonth,
      endMonth,
      toggleRef,
    }),
    [
      dateLib,
      managesToday,
      todayKey,
      animate,
      hovered,
      navSource,
      pickerOpen,
      picker.height,
      setPickerOpen,
      shownMonth,
      goToMonth,
      monthNames,
      years,
      startMonth,
      endMonth,
      toggleRef,
    ],
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
        weekStartsOn={weekStartsOn}
        captionLayout={captionLayout}
        navLayout={navLayout}
        month={shownMonth}
        onMonthChange={goToMonth}
        // react-day-picker's own `animate` is off: the transition below replaces it.
        animate={false}
        onDayMouseEnter={composeDayHandler(onDayMouseEnter, isRange ? track : undefined)}
        onDayMouseLeave={composeDayHandler(onDayMouseLeave, isRange ? clear : undefined)}
        onDayFocus={composeDayHandler(onDayFocus, isRange ? track : undefined)}
        onDayBlur={composeDayHandler(onDayBlur, isRange ? clear : undefined)}
        className={cn(
          // 6px at the sides and top, 12px below the last week.
          "group/calendar w-fit max-w-full px-1.5 pt-1.5 pb-3 text-sm text-foreground",
          // 34px cells on every device. The date picker's trigger uses the same size.
          "[--cell-radius:6px] [--cell-size:--spacing(8.5)]",
          className,
        )}
        classNames={{
          months: "relative flex flex-col gap-4 sm:flex-row",
          month:
            "relative flex w-[calc(var(--cell-size)*7)] max-w-full min-w-0 flex-col gap-3 group-data-[week-numbers]/calendar:w-[calc(var(--cell-size)*8)]",
          // Hidden while the month / year picker is open: it moves by month and year itself.
          nav: cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-(--cell-size) items-center justify-between gap-1 *:pointer-events-auto",
            pickerOpen && "invisible",
          ),
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
          week: "mt-[3px] flex w-full",
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
        formatters={{
          formatWeekdayName: (day, options, dateLib) =>
            (dateLib ?? new DateLib(options)).format(day, "ccccc"),
          ...formatters,
        }}
        components={{
          Root: CalendarRoot,
          Chevron: CalendarChevron,
          PreviousMonthButton: CalendarNavButton,
          NextMonthButton: CalendarNavButton,
          Months: CalendarMonths,
          Month: CalendarMonth,
          MonthCaption: CalendarMonthCaption,
          MonthGrid: CalendarMonthGrid,
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
      size="icon-sm"
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
  const { hovered, dateLib } = useCalendarContext("CalendarMonths");
  const { selected, dayPickerProps } = useDayPicker();

  // While exactly one end of a range is chosen, show what the range would become if the
  // hovered (or focused) day were picked next.
  const preview = useMemo(() => {
    if (dayPickerProps.mode !== "range" || !hovered) return undefined;
    const range = selected as DateRange | undefined;
    if (!range?.from || (range.to && !isSameDay(range.from, range.to))) return undefined;

    const next = addToRange(hovered, range, dayPickerProps.min, dayPickerProps.max, dayPickerProps.required, dateLib);
    if (!next?.from || !next.to || isSameDay(next.from, next.to)) return undefined;
    return next;
  }, [dayPickerProps, hovered, selected, dateLib]);

  return (
    <CalendarPreviewContext.Provider value={preview}>
      <div className={className} {...props} data-slot="calendar-months" />
    </CalendarPreviewContext.Provider>
  );
}

function CalendarMonth({ calendarMonth, className, ...rest }: MonthProps) {
  const props = omit(rest, "displayIndex");
  const { animate, navSource } = useCalendarContext("CalendarMonth");
  const monthRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const element = monthRef.current;
    if (!element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
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
      <div
        data-slot="calendar-month-height"
        className={cn(
          "overflow-clip",
          animate && "transition-[height] duration-(--duration-slow) ease-out",
        )}
        style={{ height }}
      >
        <div ref={monthRef} className={className} {...props} data-slot="calendar-month" />
      </div>
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

function CalendarMonthCaption({ className, children, displayIndex, ...rest }: MonthCaptionProps) {
  const props = omit(rest, "calendarMonth");
  const { key, enter } = useContext(MonthMotionContext);
  const { pickerOpen, setPickerOpen, toggleRef } = useCalendarContext("CalendarMonthCaption");
  const { dayPickerProps } = useDayPicker();
  // The label caption of the first month toggles the month / year picker. The `dropdown`
  // layouts already carry their own month and year selects, and `disableNavigation` pins the
  // month, so neither gets one.
  const toggles =
    dayPickerProps.captionLayout === "label" &&
    !dayPickerProps.disableNavigation &&
    (displayIndex ?? 0) === 0;

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
    >
      {toggles ? (
        <button
          ref={toggleRef}
          type="button"
          data-slot="calendar-picker-toggle"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(!pickerOpen)}
          className={cn(
            "inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-(--cell-radius) ps-2 pe-1.5",
            "outline-none transition-[background-color] duration-(--duration-fast) ease-out",
            "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {children}
          <span className="sr-only">, choose month and year</span>
          <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * The day grid, or — while the picker is open — the month / year picker laid over it. The
 * grid stays rendered underneath, hidden, so it holds the panel at the same size.
 */
function CalendarMonthGrid({ className, ...props }: MonthGridProps) {
  const { pickerOpen, pickerHeight } = useCalendarContext("CalendarMonthGrid");

  return (
    <div
      data-slot="calendar-month-grid"
      className={cn("relative w-full", pickerOpen && "overflow-hidden")}
      style={pickerOpen && pickerHeight !== undefined ? { height: pickerHeight } : undefined}
    >
      <table
        {...props}
        className={cn(className, pickerOpen && "invisible")}
        aria-hidden={pickerOpen || undefined}
      />
      {pickerOpen && <MonthYearPicker />}
    </div>
  );
}

// The chosen month and year sit on a light grey chip, the outlined tabs' selected fill, with
// full-ink text; hover is a fainter wash so it never reads as a second selection. Base UI
// renders each row as a span, so it would take the text cursor and selectable text; the
// rows are controls, like the day buttons, and get their default arrow instead.
const pickerRowClassName = cn(
  "flex h-7 w-full shrink-0 cursor-default items-center justify-center rounded-[calc(var(--cell-radius)-1px)] text-xs tabular-nums text-muted-foreground select-none",
  "outline-none transition-[background-color,color] duration-(--duration-fast) ease-out",
  "hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
  "data-[checked]:bg-muted data-[checked]:font-medium data-[checked]:text-foreground data-[checked]:hover:bg-muted",
  "data-[disabled]:cursor-not-allowed data-[disabled]:text-subtle-foreground data-[disabled]:hover:bg-transparent",
);

// No scrollbar; the top and bottom 28px fade out instead, to show there is more. The 28px of
// padding at each end lets the first and last rows scroll clear of the fade.
const pickerColumnClassName = cn(
  "flex h-full min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain px-0.5 py-7",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  "[mask-image:linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]",
);

// A thin blur over each faded edge, as on the scrollable tabs: the rows soften as well as fade
// as they pass out of the column. The strip's own mask tapers the blur toward the middle.
const pickerEdgeClassName = "pointer-events-none absolute inset-x-0 z-10 h-7 backdrop-blur-[1.5px]";

/** A picker column with its blurred, faded top and bottom edges. */
function PickerColumn({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-0">
      {children}
      <span
        aria-hidden
        className={cn(pickerEdgeClassName, "top-0 [mask-image:linear-gradient(to_bottom,black,transparent)]")}
      />
      <span
        aria-hidden
        className={cn(pickerEdgeClassName, "bottom-0 [mask-image:linear-gradient(to_top,black,transparent)]")}
      />
    </div>
  );
}

/** Scroll a picker column so its checked row sits in the middle. */
function centerChecked(column: HTMLElement | null, behavior: ScrollBehavior) {
  const checked = column?.querySelector<HTMLElement>("[data-checked]");
  if (!column || !checked) return;
  const top = checked.offsetTop - (column.clientHeight - checked.offsetHeight) / 2;
  if (typeof column.scrollTo === "function") column.scrollTo({ top, behavior });
  else column.scrollTop = top;
}

/**
 * Months and years side by side, each a Base UI radio group: one tab stop per column, arrow
 * keys to move through it. Picking a year moves the calendar and leaves the picker open;
 * picking a month moves it and returns to that month's days, as does Escape. Months entirely
 * outside `startMonth` / `endMonth` are disabled.
 */
function MonthYearPicker() {
  const { month, goToMonth, setPickerOpen, monthNames, years, startMonth, endMonth, dateLib } =
    useCalendarContext("MonthYearPicker");
  const monthsRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);
  const year = month.getFullYear();

  // Open on the shown month and year: centred in their columns, with focus on the month.
  useLayoutEffect(() => {
    centerChecked(monthsRef.current, "instant");
    centerChecked(yearsRef.current, "instant");
    monthsRef.current?.querySelector<HTMLElement>("[data-checked]")?.focus({ preventScroll: true });
  }, []);

  // Each column follows its pick — by click or by arrow key — scrolling it back to the
  // middle. Smooth, unless motion is reduced; the first centring above is instant.
  const monthIndex = month.getMonth();
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduced ? "instant" : "smooth";
    centerChecked(monthsRef.current, behavior);
    centerChecked(yearsRef.current, behavior);
  }, [monthIndex, year]);

  const unavailable = (index: number) => {
    const first = dateLib.newDate(year, index, 1);
    const last = dateLib.endOfMonth(first);
    return (
      (startMonth !== undefined && last < dateLib.startOfMonth(startMonth)) ||
      (endMonth !== undefined && first > dateLib.startOfMonth(endMonth))
    );
  };

  return (
    <div
      data-slot="calendar-picker"
      // One level at a time: Escape goes back to the days, and only the next one closes the
      // popover around the calendar.
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        setPickerOpen(false, { returnFocus: true });
      }}
      className={cn(
        "absolute inset-0 grid grid-cols-2 gap-1",
        "transition-[opacity] duration-(--duration-fast) ease-out starting:opacity-0",
      )}
    >
      <PickerColumn>
        <BaseRadioGroup
          ref={monthsRef}
          aria-label="Month"
          value={month.getMonth()}
          onValueChange={(value) => goToMonth(dateLib.newDate(year, value as number, 1))}
          className={pickerColumnClassName}
        >
          {monthNames.map((name, index) => (
            <BaseRadio.Root
              key={name}
              value={index}
              disabled={unavailable(index)}
              onClick={() => setPickerOpen(false, { returnFocus: true })}
              className={pickerRowClassName}
            >
              {name}
            </BaseRadio.Root>
          ))}
        </BaseRadioGroup>
      </PickerColumn>
      <PickerColumn>
        <BaseRadioGroup
          ref={yearsRef}
          aria-label="Year"
          value={year}
          onValueChange={(value) => goToMonth(dateLib.newDate(value as number, month.getMonth(), 1))}
          className={pickerColumnClassName}
        >
          {years.map((option) => (
            <BaseRadio.Root key={option} value={option} className={pickerRowClassName}>
              {option}
            </BaseRadio.Root>
          ))}
        </BaseRadioGroup>
      </PickerColumn>
    </div>
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
  // The button fills the cell, so the whole cell is the hit area. What it draws — hover,
  // selection, today's outline, the focus ring — is a box 2px inside it, on `::before`, so
  // the marks are smaller than the cell. `isolate` keeps that layer behind the number.
  "relative isolate inline-flex size-full items-center justify-center p-0",
  // 12px, the same size as the weekday letters above them.
  "text-xs font-normal tabular-nums text-foreground outline-none",
  "transition-[color] duration-(--duration-fast) ease-out",
  "before:absolute before:inset-[2px] before:-z-10 before:rounded-[calc(var(--cell-radius)-1px)]",
  "before:transition-[background-color,box-shadow] before:duration-(--duration-fast) before:ease-out",
  "hover:before:bg-muted focus-visible:z-10 focus-visible:before:ring-2 focus-visible:before:ring-ring",
  "disabled:cursor-not-allowed disabled:text-subtle-foreground disabled:line-through disabled:hover:before:bg-transparent",
  "group-data-[outside]/day:text-subtle-foreground",
  // Today: an outline box the size of the selection, in the strong border colour. Selected,
  // the fill says enough on its own.
  "data-[today]:font-semibold",
  "data-[today]:not-data-[selected-single]:not-data-[range-start]:not-data-[range-end]:before:shadow-[inset_0_0_0_1px_var(--color-border-strong)]",
  // Chosen ends are ink, like the primary button; the middle of a range sits on the band.
  "data-[selected-single]:text-primary-foreground data-[selected-single]:before:bg-primary data-[selected-single]:hover:before:bg-primary-hover",
  "data-[range-start]:text-primary-foreground data-[range-start]:before:bg-primary data-[range-start]:hover:before:bg-primary-hover",
  "data-[range-end]:text-primary-foreground data-[range-end]:before:bg-primary data-[range-end]:hover:before:bg-primary-hover",
  "data-[range-middle]:hover:before:bg-foreground/6",
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
