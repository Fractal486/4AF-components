import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import { Calendar, DatePicker, DateRangePicker, type DateRange } from "./date-picker";

const may14 = new Date(2026, 4, 14);

function dayButton(iso: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-slot="calendar-day-button"][data-day="${iso}"]`,
  );
  if (!button) throw new Error(`No day button for ${iso}`);
  return button;
}

describe("DatePicker", () => {
  it.each([
    ["single", DatePicker, "Pick a date", "Select a date"],
    ["range", DateRangePicker, "Pick a date range", "Select dates"],
  ] as const)("uses an anchored popover for %s selection on phones", async (_mode, Picker, placeholder, title) => {
    const matchMedia = window.matchMedia;
    const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...matchMedia(query),
      matches: query === "(max-width: 639px)" || query.includes("pointer: coarse"),
    }));

    try {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Picker calendarProps={{ defaultMonth: may14 }} onValueChange={onValueChange} />);

      await user.click(screen.getByRole("button", { name: placeholder }));
      const popup = screen.getByRole("dialog", { name: title });
      expect(popup).toHaveAttribute("data-side");
      expect(popup).not.toHaveAttribute("aria-modal", "true");
      expect(screen.queryByRole("heading", { name: title })).not.toBeInTheDocument();

      await user.click(dayButton("2026-05-20"));
      if (_mode === "range") {
        expect(onValueChange).not.toHaveBeenCalled();
        await user.click(dayButton("2026-05-21"));
      }
      expect(onValueChange).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    } finally {
      media.mockRestore();
    }
  });

  it("returns to the current month without selecting or closing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultOpen defaultValue={new Date(2026, 0, 1)} clearable calendarProps={{ today: may14 }} onValueChange={onValueChange} />);
    const today = screen.getByRole("button", { name: "Today" });
    expect(today.nextElementSibling).toBe(screen.getByRole("button", { name: "Clear" }));
    // Select's footer geometry: 3px buttons 4px inside the panel.
    expect(today).toHaveClass("rounded-xs");
    expect(screen.getByRole("button", { name: "Clear" })).toHaveClass("rounded-xs");
    expect(today.parentElement).toHaveClass("p-1");
    await user.click(today);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toHaveAccessibleName("May 2026");
    expect(screen.getByRole("button", { name: "Jan 1, 2026" })).toBeInTheDocument();
  });

  it("allows navigation to today even when the date is disabled", () => {
    render(<DatePicker defaultOpen calendarProps={{ today: may14, disabled: may14 }} />);
    expect(screen.getByRole("button", { name: "Today" })).toBeEnabled();
  });

  it("returns a range calendar to the current month without committing its draft", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker defaultOpen calendarProps={{ today: may14, defaultMonth: new Date(2026, 0, 1) }} onValueChange={onValueChange} />);
    await user.click(dayButton("2026-01-15"));
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toHaveAccessibleName("May 2026");
    await user.click(dayButton("2026-05-14"));
    expect(onValueChange).toHaveBeenCalledWith({ from: new Date(2026, 0, 15), to: may14 });
  });

  it("borders the open default trigger in Input's focus tone", () => {
    render(
      <>
        <DatePicker aria-label="Neutral date" />
        <DateRangePicker aria-label="Accent range" tone="accent" />
      </>,
    );

    const neutral = screen.getByRole("button", { name: "Neutral date" });
    const accent = screen.getByRole("button", { name: "Accent range" });
    expect(neutral).toHaveAttribute("data-tone", "neutral");
    expect(neutral.className).toContain("data-[popup-open]:border-[oklch(0.719_0_0)]");
    expect(accent).toHaveAttribute("data-tone", "accent");
    expect(accent.className).toContain("data-[popup-open]:border-ring");
  });

  it("shows the placeholder and marks the trigger empty until a date is chosen", () => {
    render(<DatePicker />);
    const trigger = screen.getByRole("button", { name: "Pick a date" });
    expect(trigger).toHaveAttribute("data-empty", "");
    expect(trigger).toHaveAttribute("data-variant", "default");
    expect(trigger).toHaveAttribute("data-size", "sm");
  });

  it("shows the date as day / month / year numbers with numeric format, the icon last", () => {
    render(<DatePicker defaultValue={new Date(2026, 0, 5)} dateFormat="numeric" />);
    // By text rather than accessible name: jsdom has no layout, so it treats the inline
    // separator spans as blocks and pads the computed name with extra spaces.
    const trigger = screen.getByRole("button");
    const value = trigger.querySelector('[data-slot="date-picker-value"]')!;

    expect(value).toHaveTextContent("05 / 01 / 2026");
    // The separators are dimmed so the numbers carry the reading.
    expect(value.querySelector(".text-muted-foreground")).toHaveTextContent("/");
    // The value fills the field, and the calendar icon comes after it.
    expect(trigger.lastElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("formats a numeric range with both ends", () => {
    render(
      <DateRangePicker
        defaultValue={{ from: new Date(2026, 9, 1), to: new Date(2026, 9, 15) }}
        dateFormat="numeric"
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("01 / 10 / 2026 – 15 / 10 / 2026");
  });

  it("opens on the selected day, commits a click, closes, and submits ISO", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <DatePicker defaultValue={may14} name="due" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("button", { name: "May 14, 2026" }));
    await waitFor(() => expect(dayButton("2026-05-14")).toHaveFocus());

    await user.click(dayButton("2026-05-20"));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 4, 20));
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "May 20, 2026" });
    expect(trigger).not.toHaveAttribute("data-empty");
    expect(container.querySelector('input[name="due"]')).toHaveValue("2026-05-20");
  });

  it("follows a controlled value", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<Date | null>(may14);
      return (
        <>
          <DatePicker value={value} onValueChange={setValue} clearable />
          <output>{value ? "set" : "empty"}</output>
        </>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "May 14, 2026" }));
    await user.click(await screen.findByRole("button", { name: "Clear" }));

    expect(screen.getByRole("status")).toHaveTextContent("empty");
    expect(screen.getByRole("button", { name: "Pick a date" })).toHaveAttribute("data-empty", "");
  });

  it("marks the month's entering weeks with the direction travelled", async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue={may14} />);

    await user.click(screen.getByRole("button", { name: "May 14, 2026" }));
    const weeks = () => document.querySelector('[data-slot="calendar-weeks"]');
    expect(weeks()).not.toHaveAttribute("data-enter");

    await user.click(screen.getByRole("button", { name: /next month/i }));
    expect(weeks()).toHaveAttribute("data-enter", "next");

    await user.click(screen.getByRole("button", { name: /previous month/i }));
    expect(weeks()).toHaveAttribute("data-enter", "prev");
  });
});

describe("DatePicker multiple", () => {
  it("toggles separate dates, keeps the panel open, and preserves dates across months", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DatePicker mode="multiple" defaultOpen name="dates" onValueChange={onValueChange}
      calendarProps={{ defaultMonth: may14 }} />);
    await user.click(dayButton("2026-05-14"));
    await user.click(dayButton("2026-05-20"));
    expect(onValueChange).toHaveBeenLastCalledWith([may14, new Date(2026, 4, 20)]);
    expect(dayButton("2026-05-14")).toHaveAttribute("data-selected-single");
    expect(dayButton("2026-05-20")).toHaveAttribute("data-selected-single");
    await user.click(dayButton("2026-05-14"));
    await user.click(screen.getByRole("button", { name: /next month/i }));
    await user.click(dayButton("2026-06-05"));
    expect(container.querySelector('input[name="dates"]')).toHaveValue("2026-05-20,2026-06-05");
    expect(screen.getByRole("grid")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "May 20, 2026, Jun 5, 2026" });
    await user.click(trigger);
    await waitFor(() => expect(dayButton("2026-06-05")).toHaveFocus());
  });

  it("uses the last supplied date for initial focus and supports keyboard selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker mode="multiple" defaultOpen defaultValue={[new Date(2026, 4, 20), may14]}
      onValueChange={onValueChange} />);
    await waitFor(() => expect(dayButton("2026-05-14")).toHaveFocus());
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith([new Date(2026, 4, 20), may14, new Date(2026, 4, 15)]);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("uses controlled values and clears to an empty array", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [dates, setDates] = useState([may14]);
      return <DatePicker mode="multiple" value={dates} onValueChange={setDates} clearable defaultOpen name="dates" />;
    }
    const { container } = render(<Controlled />);
    await user.click(dayButton("2026-05-20"));
    expect(container.querySelector('input[name="dates"]')).toHaveValue("2026-05-14,2026-05-20");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(container.querySelector('input[name="dates"]')).toHaveValue("");
    expect(screen.getByRole("button", { name: "Pick dates" })).toHaveAttribute("data-empty");
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
  });

  it("honors disabled days and selection limits without replacing existing dates", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker mode="multiple" defaultOpen defaultValue={[may14]} onValueChange={onValueChange}
      calendarProps={{ min: 1, max: 2, disabled: new Date(2026, 4, 16) }} />);
    await user.click(dayButton("2026-05-14"));
    await user.click(dayButton("2026-05-16"));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(dayButton("2026-05-15"));
    await user.click(dayButton("2026-05-17"));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith([may14, new Date(2026, 4, 15)]);
    expect(dayButton("2026-05-14")).toHaveAttribute("data-selected-single");
    expect(dayButton("2026-05-15")).toHaveAttribute("data-selected-single");
    await user.click(dayButton("2026-05-14"));
    expect(onValueChange).toHaveBeenLastCalledWith([new Date(2026, 4, 15)]);
  });

  it("formats and submits multiple dates in the requested time zone", () => {
    const value = [new Date("2026-05-31T09:30:00Z"), new Date("2026-05-31T10:30:00Z")];
    const { container } = render(<DatePicker mode="multiple" value={value} dateFormat="numeric" name="dates"
      calendarProps={{ timeZone: "Pacific/Kiritimati" }} />);
    expect(screen.getByRole("button")).toHaveTextContent("31 / 05 / 2026, 01 / 06 / 2026");
    expect(container.querySelector('input[name="dates"]')).toHaveValue("2026-05-31,2026-06-01");
  });
});

describe("DateRangePicker", () => {
  it("stays open after the first day and commits the range on the second, in either order", async () => {
    const user = userEvent.setup();
    let committed: DateRange | null = null;
    render(
      <DateRangePicker
        calendarProps={{ defaultMonth: may14 }}
        onValueChange={(range) => {
          committed = range;
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pick a date range" }));
    await user.click(dayButton("2026-05-20"));
    expect(committed).toBeNull();
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);

    await user.click(dayButton("2026-05-12"));
    expect(committed).toEqual({ from: new Date(2026, 4, 12), to: new Date(2026, 4, 20) });
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "May 12 – 20, 2026" })).toBeInTheDocument();
  });

  it("shows one month and keeps the first pick across a month change", async () => {
    const user = userEvent.setup();
    let committed: DateRange | null = null;
    render(
      <DateRangePicker
        calendarProps={{ defaultMonth: may14 }}
        onValueChange={(range) => {
          committed = range;
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pick a date range" }));
    expect(screen.getAllByRole("grid")).toHaveLength(1);

    await user.click(dayButton("2026-05-28"));
    await user.click(screen.getByRole("button", { name: /next month/i }));
    await user.click(dayButton("2026-06-05"));

    expect(committed).toEqual({ from: new Date(2026, 4, 28), to: new Date(2026, 5, 5) });
  });
});

describe("Calendar month / year picker", () => {
  const toggle = () =>
    document.querySelector<HTMLButtonElement>('[data-slot="calendar-picker-toggle"]')!;
  const caption = () =>
    document.querySelector('[data-slot="calendar-month-caption"]')!.textContent ?? "";

  it("swaps the grid for month and year columns, and back on a month pick", async () => {
    const user = userEvent.setup();
    render(<Calendar mode="single" defaultMonth={new Date(2026, 4, 1)} />);

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("radiogroup", { name: "Month" })).toBeInTheDocument();
    // Opens on the shown month, with focus there.
    expect(screen.getByRole("radio", { name: "May" })).toHaveFocus();

    // A year moves the calendar and leaves the picker open.
    await user.click(screen.getByRole("radio", { name: "2028" }));
    expect(screen.getByRole("radiogroup", { name: "Year" })).toBeInTheDocument();
    expect(caption()).toContain("May 2028");

    // A month moves it and returns to that month's days, focus back on the toggle.
    await user.click(screen.getByRole("radio", { name: "Feb" }));
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(caption()).toContain("February 2028");
    expect(toggle()).toHaveFocus();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("holds the grid's height while the picker is open, whatever month it moves to", async () => {
    const user = userEvent.setup();
    // A fractional height, held exactly: rounding it up grew the panel as the picker opened.
    const computed = window.getComputedStyle.bind(window);
    const getComputedStyle = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element, pseudo) =>
        element instanceof HTMLElement && element.dataset.slot === "calendar-month-grid"
          ? ({ height: "210.5px" } as CSSStyleDeclaration)
          : computed(element, pseudo),
      );
    try {
      render(<Calendar mode="single" defaultMonth={new Date(2026, 4, 1)} />);
      const grid = () => document.querySelector<HTMLElement>('[data-slot="calendar-month-grid"]')!;

      expect(grid().style.height).toBe("");
      await user.click(toggle());
      expect(grid().style.height).toBe("210.5px");

      // A month with a different number of weeks doesn't move it while the picker is open.
      await user.click(screen.getByRole("radio", { name: "2027" }));
      expect(grid().style.height).toBe("210.5px");

      // Back in the day view, the grid takes its own height again.
      await user.click(screen.getByRole("radio", { name: "Feb" }));
      expect(grid().style.height).toBe("");
    } finally {
      getComputedStyle.mockRestore();
    }
  });

  it("scrolls a column to centre its pick when an arrow key moves it", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    const original = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = scrollTo as typeof HTMLElement.prototype.scrollTo;
    try {
      render(<Calendar mode="single" defaultMonth={new Date(2026, 4, 1)} />);
      await user.click(toggle());
      scrollTo.mockClear();

      screen.getByRole("radio", { name: "2026" }).focus();
      await user.keyboard("{ArrowDown}");

      expect(caption()).toContain("2027");
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    } finally {
      HTMLElement.prototype.scrollTo = original;
    }
  });

  it("disables months outside startMonth and endMonth", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 4, 1)}
        startMonth={new Date(2026, 2, 1)}
        endMonth={new Date(2026, 8, 1)}
      />,
    );

    await user.click(toggle());
    expect(screen.getByRole("radio", { name: "Feb" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: "Mar" })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: "Oct" })).toHaveAttribute("aria-disabled", "true");
  });

  it("opens on a month inside endMonth, and marks that month in the picker", async () => {
    const user = userEvent.setup();
    render(<Calendar mode="single" today={may14} endMonth={new Date(2025, 2, 1)} />);

    expect(caption()).toContain("March 2025");
    await user.click(toggle());
    expect(screen.getByRole("radio", { name: "Mar" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "2025" })).toHaveAttribute("aria-checked", "true");
  });

  it("leaves the caption plain under disableNavigation", () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 4, 1)} disableNavigation />);
    expect(toggle()).toBeNull();
    expect(caption()).toContain("May 2026");
  });

  it("goes back to the days on Escape without closing the panel", async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultOpen defaultValue={may14} />);

    await user.click(toggle());
    expect(screen.getByRole("radiogroup", { name: "Month" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(toggle()).toHaveFocus();
  });
});


describe("DatePicker time zones", () => {
  const instant = new Date("2026-05-31T10:30:00Z");
  const zones = [
    { timeZone: "Pacific/Kiritimati", iso: "2026-06-01", medium: "Jun 1, 2026", numeric: "01 / 06 / 2026", month: "June 2026" },
    { timeZone: "Pacific/Pago_Pago", iso: "2026-05-30", medium: "May 30, 2026", numeric: "30 / 05 / 2026", month: "May 2026" },
  ];

  it.each(zones)("keeps labels, form values and the selected grid day in $timeZone", async ({ timeZone, iso, medium, numeric, month }) => {
    const user = userEvent.setup();
    const { container, rerender } = render(<DatePicker defaultOpen value={instant} name="date" calendarProps={{ timeZone }} />);
    expect(screen.getByRole("button", { name: medium })).toBeInTheDocument();
    expect(container.querySelector('input[name="date"]')).toHaveValue(iso);
    expect(screen.getByRole("grid")).toHaveAccessibleName(month);
    expect(dayButton(iso)).toHaveAttribute("data-selected-single");
    await waitFor(() => expect(dayButton(iso)).toHaveFocus());
    rerender(<DatePicker defaultOpen value={instant} name="date" dateFormat="numeric" calendarProps={{ timeZone }} />);
    expect(screen.getByRole("button", { name: numeric.replaceAll(" ", "") })).toHaveTextContent(numeric);

    await user.click(document.querySelector<HTMLButtonElement>('[data-slot="calendar-picker-toggle"]')!);
    await user.click(screen.getByRole("radio", { name: "2027" }));
    await user.click(screen.getByRole("radio", { name: "Jan" }));
    expect(screen.getByRole("grid")).toHaveAccessibleName("January 2027");
    expect(dayButton("2027-01-01")).toBeInTheDocument();
  });

  it.each(zones)("uses $timeZone for both range endpoints and same-day detection", ({ timeZone }) => {
    const from = new Date("2026-05-31T09:30:00Z");
    const value = { from, to: instant };
    const ahead = timeZone === "Pacific/Kiritimati";
    const { container, rerender } = render(<DateRangePicker value={value} name="range" dateFormat="numeric" calendarProps={{ timeZone }} />);
    expect(screen.getByRole("button")).toHaveTextContent(ahead ? "31 / 05 / 2026 – 01 / 06 / 2026" : "30 / 05 / 2026");
    expect(container.querySelector('input[name="range"]')).toHaveValue(ahead ? "2026-05-31/2026-06-01" : "2026-05-30/2026-05-30");
    rerender(<DateRangePicker value={value} name="range" calendarProps={{ timeZone }} />);
    expect(screen.getByRole("button")).toHaveTextContent(ahead ? "May 31 – Jun 1, 2026" : "May 30, 2026");
  });

  it.each(zones)("keeps month bounds in $timeZone", async ({ timeZone }) => {
    const user = userEvent.setup();
    render(<Calendar mode="single" timeZone={timeZone} defaultMonth={instant}
      startMonth={new Date("2026-05-01T12:00:00Z")} endMonth={new Date("2026-06-01T12:00:00Z")} />);
    await user.click(document.querySelector<HTMLButtonElement>('[data-slot="calendar-picker-toggle"]')!);
    expect(screen.getByRole("radio", { name: "Apr" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: "May" })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: "Jun" })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: "Jul" })).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DateRangePicker constraints", () => {
  it.each([
    { constraints: { max: 3 }, start: "2026-05-10", invalid: "2026-05-15", valid: "2026-05-17" },
    { constraints: { min: 3 }, start: "2026-05-10", invalid: "2026-05-11", valid: "2026-05-15" },
    { constraints: { min: 1 }, start: "2026-05-10", invalid: "2026-05-10", valid: "2026-05-11" },
    { constraints: { excludeDisabled: true, disabled: new Date(2026, 4, 12) }, start: "2026-05-10", invalid: "2026-05-15", valid: "2026-05-17" },
  ])("rejects invalid spans with $constraints and lets the draft restart", async ({ constraints, start, invalid, valid }) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<DateRangePicker defaultOpen name="range" onValueChange={onValueChange}
      defaultValue={{ from: may14, to: may14 }} calendarProps={{ ...constraints, defaultMonth: may14 }} />);
    await user.click(dayButton(start));
    await user.click(dayButton(invalid));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(container.querySelector('input[name="range"]')).toHaveValue("2026-05-14/2026-05-14");
    await user.click(dayButton(valid));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(container.querySelector('input[name="range"]')).toHaveValue(`${invalid}/${valid}`);
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
  });

  it("allows a same-day range with min zero after two clicks", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker defaultOpen onValueChange={onValueChange} calendarProps={{ defaultMonth: may14 }} />);
    await user.click(dayButton("2026-05-14"));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(dayButton("2026-05-14"));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ from: may14, to: may14 });
  });
});

it("measures calendar height independently of the popover's entrance scale", () => {
  const original = window.getComputedStyle;
  const styles = vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) =>
    element instanceof HTMLElement && element.dataset.slot === "calendar-month"
      ? ({height:"284.5px"} as CSSStyleDeclaration)
      : original(element,pseudo));
  const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x:0,y:0,top:0,left:0,right:250,bottom:270,width:250,height:270,toJSON:()=>({}),
  });
  try {
    const {container} = render(<Calendar defaultMonth={new Date(2026,10,1)} />);
    expect(container.querySelector<HTMLElement>('[data-slot="calendar-month-height"]')?.style.height).toBe("284.5px");
  } finally { styles.mockRestore(); rect.mockRestore(); }
});
