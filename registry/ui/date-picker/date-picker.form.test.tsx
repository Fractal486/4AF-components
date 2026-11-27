import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePicker, DateRangePicker } from "./date-picker";

const start = new Date(2026, 4, 14);
const end = new Date(2026, 4, 20);
const cases = [
  { mode: "single", expected: "2026-05-14" },
  { mode: "multiple", expected: "2026-05-14,2026-05-20" },
  { mode: "range", expected: "2026-05-14/2026-05-20" },
] as const;

function Picker({ mode, empty = false, ...props }: {
  mode: typeof cases[number]["mode"];
  empty?: boolean;
  disabled?: boolean;
  form?: string;
}) {
  if (mode === "range") {
    return <DateRangePicker name="due" defaultValue={empty ? null : { from: start, to: end }} clearable {...props} />;
  }
  if (mode === "multiple") {
    return <DatePicker mode="multiple" name="due" defaultValue={empty ? [] : [start, end]} clearable {...props} />;
  }
  return <DatePicker name="due" defaultValue={empty ? null : start} clearable {...props} />;
}

describe.each(cases)("DatePicker $mode form submission", ({ mode, expected }) => {
  it("omits a disabled selection and restores it when re-enabled", () => {
    const { rerender } = render(<form aria-label="Dates"><Picker mode={mode} /></form>);
    const form = screen.getByRole("form", { name: "Dates" }) as HTMLFormElement;
    expect(new FormData(form).get("due")).toBe(expected);

    rerender(<form aria-label="Dates"><Picker mode={mode} disabled /></form>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(new FormData(form).has("due")).toBe(false);

    rerender(<form aria-label="Dates"><Picker mode={mode} /></form>);
    expect(new FormData(form).get("due")).toBe(expected);
  });

  it("associates an external picker with its named form", () => {
    render(<><form id="dates" aria-label="Dates" /><Picker mode={mode} form="dates" /></>);
    const form = screen.getByRole("form", { name: "Dates" }) as HTMLFormElement;
    expect((screen.getByRole("button") as HTMLButtonElement).form).toBe(form);
    expect(new FormData(form).get("due")).toBe(expected);
  });

  it("omits an initially empty selection", () => {
    render(<form aria-label="Dates"><Picker mode={mode} empty /></form>);
    const form = screen.getByRole("form", { name: "Dates" }) as HTMLFormElement;
    expect(new FormData(form).has("due")).toBe(false);
  });

  it("omits the selection after clearing it", async () => {
    const user = userEvent.setup();
    render(<form aria-label="Dates"><Picker mode={mode} /></form>);
    const form = screen.getByRole("form", { name: "Dates" }) as HTMLFormElement;
    expect(new FormData(form).get("due")).toBe(expected);
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(new FormData(form).has("due")).toBe(false);
  });

  it("restores the label and submission when its external form resets", async () => {
    const user = userEvent.setup();
    render(<><form id="dates" aria-label="Dates" /><Picker mode={mode} form="dates" /></>);
    const form = screen.getByRole("form") as HTMLFormElement;
    const trigger = screen.getByRole("button");
    const initialLabel = trigger.textContent;
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(new FormData(form).has("due")).toBe(false);

    form.addEventListener("reset", event => event.preventDefault(), { once: true });
    await act(async () => form.reset());
    expect(new FormData(form).has("due")).toBe(false);
    await act(async () => form.reset());
    expect(new FormData(form).get("due")).toBe(expected);
    expect(trigger.textContent).toBe(initialLabel);
  });
});

it("resets an initially empty unnamed picker and preserves a controlled value", async () => {
  const user = userEvent.setup();
  render(
    <form aria-label="Dates">
      <DatePicker calendarProps={{ defaultMonth: start }} />
      <DatePicker value={end} defaultValue={start} name="controlled" />
    </form>,
  );
  const form = screen.getByRole("form") as HTMLFormElement;
  const trigger = screen.getByRole("button", { name: "Pick a date" });
  await user.click(trigger);
  await user.click(document.querySelector<HTMLButtonElement>('[data-slot="calendar-day-button"][data-day="2026-05-14"]')!);
  expect(trigger).not.toHaveAttribute("data-empty");
  await act(async () => form.reset());
  expect(trigger).toHaveAttribute("data-empty");
  expect(new FormData(form).get("controlled")).toBe("2026-05-20");
});

it("discards a half-picked range even when the committed default is unchanged", async () => {
  const user = userEvent.setup();
  render(<form aria-label="Dates"><DateRangePicker name="range" defaultOpen calendarProps={{ defaultMonth: start }} /></form>);
  const form = screen.getByRole("form") as HTMLFormElement;
  const pick = (day: number) => user.click(document.querySelector<HTMLButtonElement>(
    `[data-slot="calendar-day-button"][data-day="2026-05-${day}"]`,
  )!);
  await pick(14);
  await act(async () => form.reset());
  await pick(18);
  expect(new FormData(form).has("range")).toBe(false);
  await pick(20);
  expect(new FormData(form).get("range")).toBe("2026-05-18/2026-05-20");
});
