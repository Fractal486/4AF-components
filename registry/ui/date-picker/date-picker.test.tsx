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

  it("shows the placeholder and marks the trigger empty until a date is chosen", () => {
    render(<DatePicker />);
    const trigger = screen.getByRole("button", { name: "Pick a date" });
    expect(trigger).toHaveAttribute("data-empty", "");
    expect(trigger).toHaveAttribute("data-variant", "default");
    expect(trigger).toHaveAttribute("data-size", "md");
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
    const offsetHeight = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(210);
    try {
      render(<Calendar mode="single" defaultMonth={new Date(2026, 4, 1)} />);
      const grid = () => document.querySelector<HTMLElement>('[data-slot="calendar-month-grid"]')!;

      expect(grid().style.height).toBe("");
      await user.click(toggle());
      expect(grid().style.height).toBe("210px");

      // A month with a different number of weeks doesn't move it while the picker is open.
      await user.click(screen.getByRole("radio", { name: "2027" }));
      expect(grid().style.height).toBe("210px");

      // Back in the day view, the grid takes its own height again.
      await user.click(screen.getByRole("radio", { name: "Feb" }));
      expect(grid().style.height).toBe("");
    } finally {
      offsetHeight.mockRestore();
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
