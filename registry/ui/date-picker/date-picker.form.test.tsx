import { render, screen } from "@testing-library/react";
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
});
