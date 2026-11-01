import { Field } from "@base-ui/react/field";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Checkbox, CheckboxGroup } from "./checkbox";

describe("Checkbox groups", () => {
  it("shares uncontrolled values, updates the parent, and submits selected values", () => {
    render(<form data-testid="form"><CheckboxGroup aria-label="Channels" allValues={["email", "push"]} defaultValue={["email"]}>
      <Checkbox parent label="Select all" />
      <Checkbox name="channel" value="email" label="Email" />
      <Checkbox name="channel" value="push" label="Push" />
    </CheckboxGroup></form>);
    const parent = screen.getByRole("checkbox", { name: "Select all" });
    const email = screen.getByRole("checkbox", { name: "Email" });
    const push = screen.getByRole("checkbox", { name: "Push" });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(parent).toHaveAttribute("aria-checked", "mixed");
    expect(email).toHaveAttribute("aria-checked", "true");
    expect(new FormData(form).getAll("channel")).toEqual(["email"]);
    fireEvent.click(parent);
    expect(parent).toHaveAttribute("aria-checked", "true");
    expect(push).toHaveAttribute("aria-checked", "true");
    expect(new FormData(form).getAll("channel")).toEqual(["email", "push"]);
    fireEvent.click(parent);
    expect(email).toHaveAttribute("aria-checked", "false");
    expect(push).toHaveAttribute("aria-checked", "false");
    expect(new FormData(form).getAll("channel")).toEqual([]);
  });

  it("honors controlled values and inherited disabled state", () => {
    const change = vi.fn();
    const view = (disabled = false) => <CheckboxGroup aria-label="Channels" value={[]} disabled={disabled} onValueChange={change}>
      <Checkbox value="email" label="Email" />
    </CheckboxGroup>;
    const { rerender } = render(view());
    const email = screen.getByRole("checkbox", { name: "Email" });
    fireEvent.click(email);
    expect(change).toHaveBeenCalledWith(["email"], expect.anything());
    expect(email).toHaveAttribute("aria-checked", "false");
    rerender(view(true));
    expect(email).toBeDisabled();
    fireEvent.click(email);
    expect(change).toHaveBeenCalledOnce();
  });

  it("honors canceled uncontrolled group changes", () => {
    render(<CheckboxGroup aria-label="Channels" defaultValue={[]} onValueChange={(_, details) => details.cancel()}>
      <Checkbox value="email" label="Email" />
    </CheckboxGroup>);
    const email = screen.getByRole("checkbox", { name: "Email" });
    fireEvent.click(email);
    expect(email).toHaveAttribute("aria-checked", "false");
  });

  it("synchronizes nested parents through shared controlled values", () => {
    function Nested() {
      const [value, setValue] = useState(["read"]);
      return <CheckboxGroup aria-label="Permissions" allValues={["read", "write", "billing"]} value={value} onValueChange={setValue}>
        <Checkbox parent label="All permissions" />
        <CheckboxGroup aria-label="Users" allValues={["read", "write"]} value={value.filter((item) => item !== "billing")}
          onValueChange={(next) => setValue((current) => [...current.filter((item) => item === "billing"), ...next])}>
          <Checkbox parent label="All users" />
          <Checkbox value="read" label="Read" />
          <Checkbox value="write" label="Write" />
        </CheckboxGroup>
        <Checkbox value="billing" label="Billing" />
      </CheckboxGroup>;
    }
    render(<Nested />);
    const all = screen.getByRole("checkbox", { name: "All permissions" });
    const users = screen.getByRole("checkbox", { name: "All users" });
    expect(all).toHaveAttribute("aria-checked", "mixed");
    expect(users).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(users);
    expect(screen.getByRole("checkbox", { name: "Write" })).toHaveAttribute("aria-checked", "true");
    expect(all).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(all);
    expect(screen.getByRole("checkbox", { name: "Billing" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Read" }));
    expect(users).toHaveAttribute("aria-checked", "mixed");
    expect(all).toHaveAttribute("aria-checked", "mixed");
  });
});

describe("Checkbox composition", () => {
  it("merges custom element props and refs while retaining the mark and children", () => {
    const ref = createRef<HTMLElement>();
    const click = vi.fn();
    render(<Checkbox ref={ref} nativeButton label="Email" render={<button className="custom" onClick={click} />}
      className={({ checked }) => checked ? "selected" : "unselected"}>
      <span data-testid="extra" aria-hidden />
    </Checkbox>);
    const control = screen.getByRole("checkbox", { name: "Email" });
    expect(ref.current).toBe(control);
    expect(control).toHaveClass("custom", "unselected", "inline-flex");
    fireEvent.click(control);
    expect(click).toHaveBeenCalledOnce();
    expect(control).toHaveClass("selected");
    expect(control.querySelector("[data-slot=checkbox-indicator]")).not.toBeNull();
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });

  it("supports non-native render functions, keyboard interaction, and canceled changes", async () => {
    const user = userEvent.setup();
    const view = (cancel = false) => <Checkbox aria-label="Email"
      onCheckedChange={(_, details) => { if (cancel) details.cancel(); }}
      render={(props, state) => <span {...props} data-render-checked={state.checked} />} />;
    const { rerender } = render(view());
    const control = screen.getByRole("checkbox", { name: "Email" });
    expect(control.tagName).toBe("SPAN");
    await user.tab();
    await user.keyboard(" ");
    expect(control).toHaveAttribute("data-render-checked", "true");
    rerender(view(true));
    await user.keyboard(" ");
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("exposes Field invalid state to attributes and state-based classes", () => {
    render(<Field.Root invalid>
      <Field.Label>Accept terms</Field.Label>
      <Checkbox className={({ valid }) => valid === false ? "invalid-field" : undefined} />
      <Field.Error match>Please accept the terms.</Field.Error>
    </Field.Root>);
    const control = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(control).toHaveAttribute("data-invalid");
    expect(control).toHaveClass("invalid-field");
    expect(control).toHaveAccessibleDescription("Please accept the terms.");
  });

  it("forwards group rendering, refs, and state-based classes", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CheckboxGroup aria-label="Channels" ref={ref} disabled
      render={(props, state) => <div {...props} data-render-disabled={state.disabled} />}
      className={({ disabled }) => disabled ? "unavailable gap-4" : undefined}>
      <Checkbox value="email" label="Email" />
    </CheckboxGroup>);
    const group = screen.getByRole("group", { name: "Channels" });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("flex", "unavailable", "gap-4");
    expect(group).not.toHaveClass("gap-3");
    expect(group).toHaveAttribute("data-render-disabled", "true");
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
