import { Field } from "@base-ui/react/field";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Radio, RadioGroup } from "./radio";

describe("Radio composition", () => {
  it("merges custom element props and refs, retaining the dot and supplied children", () => {
    const ref = createRef<HTMLElement>();
    const click = vi.fn();
    render(<RadioGroup aria-label="Plan" defaultValue="standard" size="lg">
      <Radio value="standard" label="Standard" />
      <Radio ref={ref} value="pro" label="Pro" nativeButton render={<button className="custom" onClick={click} />}
        className={({ checked }) => checked ? "selected" : "unselected"}>
        <span data-testid="extra" aria-hidden />
      </Radio>
    </RadioGroup>);
    const control = screen.getByRole("radio", { name: "Pro" });
    expect(ref.current).toBe(control);
    expect(control).toHaveClass("custom", "unselected", "size-6");
    expect(control.querySelector("[data-slot=radio-indicator]")).not.toBeNull();
    expect(screen.getByTestId("extra")).toBeInTheDocument();
    fireEvent.click(control);
    expect(click).toHaveBeenCalledOnce();
    expect(control).toHaveClass("selected");
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Standard" })).toHaveAttribute("aria-checked", "false");
  });

  it("supports render functions and arrow-key selection with cancellation", async () => {
    const user = userEvent.setup();
    const view = (cancel = false) => <RadioGroup aria-label="Plan" defaultValue="standard"
      onValueChange={(_, details) => { if (cancel) details.cancel(); }}>
      <Radio value="standard" label="Standard" />
      <Radio value="pro" label="Pro" render={(props, state) => <span {...props} data-render-checked={state.checked} />} />
    </RadioGroup>;
    const { rerender } = render(view());
    await user.tab();
    expect(screen.getByRole("radio", { name: "Standard" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute("data-render-checked", "true");
    rerender(view(true));
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute("aria-checked", "true");
  });

  it("preserves controlled selection and form values with custom rendering", () => {
    const change = vi.fn();
    const view = (value: string) => <form data-testid="form"><RadioGroup aria-label="Plan" name="plan" value={value} onValueChange={change}>
      <Radio value="standard" label="Standard" render={<span />} />
      <Radio value="pro" label="Pro" render={<span />} />
    </RadioGroup></form>;
    const { rerender } = render(view("standard"));
    fireEvent.click(screen.getByRole("radio", { name: "Pro" }));
    expect(change).toHaveBeenCalledWith("pro", expect.anything());
    expect(screen.getByRole("radio", { name: "Standard" })).toHaveAttribute("aria-checked", "true");
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("plan")).toBe("standard");
    rerender(view("pro"));
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("plan")).toBe("pro");
  });

  it("evaluates group classes, merges layout overrides, and forwards group rendering and refs", () => {
    const ref = createRef<HTMLDivElement>();
    const view = (readOnly = false) => <RadioGroup ref={ref} aria-label="Plan" readOnly={readOnly}
      render={(props, state) => <div {...props} data-render-readonly={state.readOnly} />}
      className={({ readOnly }) => `${readOnly ? "locked" : "editable"} flex-row gap-4`}>
      <Radio value="standard" label="Standard" />
    </RadioGroup>;
    const { rerender } = render(view());
    const group = screen.getByRole("radiogroup");
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("flex", "flex-row", "gap-4", "editable");
    expect(group).not.toHaveClass("flex-col", "gap-2.5");
    rerender(view(true));
    expect(group).toHaveClass("locked");
    expect(group).toHaveAttribute("data-render-readonly", "true");
  });

  it("exposes inherited disabled state to custom radio renderers and classes", () => {
    render(<RadioGroup aria-label="Plan" disabled>
      <Radio value="standard" label="Standard"
        className={({ disabled }) => disabled ? "unavailable" : undefined}
        render={(props, state) => <span {...props} data-render-disabled={state.disabled} />} />
    </RadioGroup>);
    const control = screen.getByRole("radio", { name: "Standard" });
    expect(control).toHaveClass("unavailable");
    expect(control).toHaveAttribute("data-render-disabled", "true");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("exposes Field validation to every radio and both class callbacks", () => {
    render(<Field.Root invalid>
      <RadioGroup aria-label="Plan" defaultValue="standard" className={({ valid }) => valid === false ? "invalid-group" : undefined}>
        <Radio value="standard" label="Standard" className={({ valid }) => valid === false ? "invalid-radio" : undefined} />
        <Radio value="pro" label="Pro" className={({ valid }) => valid === false ? "invalid-radio" : undefined} />
      </RadioGroup>
      <Field.Error match>Choose an available plan.</Field.Error>
    </Field.Root>);
    expect(screen.getByRole("radiogroup")).toHaveClass("invalid-group");
    for (const control of screen.getAllByRole("radio")) {
      expect(control).toHaveAttribute("data-invalid");
      expect(control).toHaveClass("invalid-radio");
    }
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription("Choose an available plan.");
  });
});
