import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import { DatePicker, DateRangePicker, type DateRange } from "./date-picker";

const may14 = new Date(2026, 4, 14);

function dayButton(iso: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-slot="calendar-day-button"][data-day="${iso}"]`,
  );
  if (!button) throw new Error(`No day button for ${iso}`);
  return button;
}

describe("DatePicker", () => {
  it("shows the placeholder and marks the trigger empty until a date is chosen", () => {
    render(<DatePicker />);
    const trigger = screen.getByRole("button", { name: "Pick a date" });
    expect(trigger).toHaveAttribute("data-empty", "");
    expect(trigger).toHaveAttribute("data-variant", "default");
    expect(trigger).toHaveAttribute("data-size", "md");
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
