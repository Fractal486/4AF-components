import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Controls, fitsPillTabs } from "./controls";
import { num, select, text, type ControlValues } from "./schema";

// Long enough to stay a dropdown — a short enum renders as pill tabs instead, which the
// "short enums" suite below covers.
const schema = {
  variant: select(
    ["primary", "outline", "ghost", "plain", "destructive"] as const,
    "primary",
    "Variant",
  ),
};

function ControlsHarness() {
  const [values, setValues] = useState<ControlValues<typeof schema>>({ variant: "primary" });
  return (
    <Controls
      schema={schema}
      values={values}
      onChange={(key, value) =>
        setValues((current) => ({ ...current, [key]: value }) as ControlValues<typeof schema>)
      }
    />
  );
}

describe("Controls select", () => {
  it("sizes the text input's flex item so it can share a row with its label", () => {
    render(<Controls schema={{ name: text("Ada", "Name") }} values={{ name: "Ada" }} onChange={() => {}} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    const wrapper = input.closest('[data-slot="input-wrapper"]');
    expect(wrapper?.parentElement).toBe(input.closest("label"));
    expect(wrapper).toHaveClass("ml-auto", "w-48", "max-w-full", "shrink-0");
    expect(wrapper).not.toHaveClass("w-full");
  });

  it("prefixes field ids when settings panels share control keys", () => {
    render(
      <>
        <Controls idPrefix="button" schema={schema} values={{ variant: "primary" }} onChange={() => {}} />
        <Controls idPrefix="input" schema={schema} values={{ variant: "primary" }} onChange={() => {}} />
      </>,
    );

    expect(document.getElementById("button-variant-label")).toHaveTextContent("Variant");
    expect(document.getElementById("input-variant-label")).toHaveTextContent("Variant");
    const [buttonSelect, inputSelect] = screen.getAllByRole("combobox");
    expect(buttonSelect).toHaveAttribute("aria-labelledby", "button-variant-label");
    expect(inputSelect).toHaveAttribute("aria-labelledby", "input-variant-label");
    expect(buttonSelect).toHaveAttribute("data-variant", "plain");
    expect(inputSelect).toHaveAttribute("data-variant", "plain");
    expect(buttonSelect).toHaveClass("w-auto", "ml-auto");
    expect(inputSelect).toHaveClass("w-auto", "ml-auto");
    expect(buttonSelect).not.toHaveClass("w-32");
    expect(inputSelect).not.toHaveClass("w-32");
  });

  it("renders the enum as an aligned select and updates the selection on pick", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);

    expect(screen.queryByRole("tablist")).toBeNull();
    const trigger = screen.getByRole("combobox", { name: "Variant" });
    expect(trigger).toHaveTextContent("Primary");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Outline" }));

    await waitFor(() => expect(trigger).toHaveTextContent("Outline"));
  });
});

describe("Controls short enums", () => {
  const thumbs = {
    thumb: select(["bar", "circle", "knob"] as const, "bar", "Thumb"),
  };

  it("offers a short enum as pill tabs instead of a dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Controls schema={thumbs} values={{ thumb: "bar" }} onChange={onChange} />);

    // Every choice visible, one click to pick — and no dropdown to open.
    expect(screen.queryByRole("combobox")).toBeNull();
    const list = screen.getByRole("tablist");
    expect(list).toHaveAccessibleName("Thumb");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Bar",
      "Circle",
      "Knob",
    ]);
    expect(screen.getByRole("tab", { name: "Bar" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "Knob" }));

    // The raw option the schema declared, not its display label.
    expect(onChange).toHaveBeenCalledWith("thumb", "knob");
  });

  it("decides on the width of the run, not the number of options", () => {
    // Same count, opposite answers: four two-letter sizes fit where four side names do not.
    expect(fitsPillTabs(["Xs", "Sm", "Md", "Lg"])).toBe(true);
    expect(fitsPillTabs(["Top", "Right", "Bottom", "Left"])).toBe(false);

    // And two options can still be too wide to lay out.
    expect(fitsPillTabs(["Bottom Right", "Bottom Center"])).toBe(false);

    // The case the rule is cut to: three one-word labels, inside a settings field.
    expect(fitsPillTabs(["Bar", "Circle", "Knob"])).toBe(true);

    // A lone option is not a choice.
    expect(fitsPillTabs(["Only"])).toBe(false);
  });
});

describe("Controls disabledWhen", () => {
  it("dims and disables every kind of control that doesn't apply", () => {
    const off = () => true;
    const disabledSchema = {
      icon: select(["none", "leading", "only"] as const, "none", "Icon", off),
      count: num(3, { min: 2, max: 5, label: "Buttons", disabledWhen: off }),
      placeholder: text("Hi", "Placeholder", undefined, off),
    };
    render(
      <Controls
        schema={disabledSchema}
        values={{ icon: "none", count: 3, placeholder: "Hi" }}
        onChange={() => {}}
      />,
    );

    for (const tab of screen.getAllByRole("tab")) expect(tab).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Icon").parentElement).toHaveClass("opacity-50");
    expect(screen.getByText("Buttons").parentElement).toHaveClass("opacity-50");
    expect(screen.getByRole("slider", { name: "Buttons" })).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByText("Placeholder").parentElement).toHaveClass("opacity-50");
  });
});
