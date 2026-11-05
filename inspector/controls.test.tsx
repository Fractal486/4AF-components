import type { ReactNode } from "react";
import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Controls, fitsPillTabs } from "./controls";
import { bool, initialValues, inMenu, num, onMobile, range, select, text, withIcons, type ControlValues } from "./schema";

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

describe("Controls range", () => {
  it("sets both bounds on one two-thumb rail and shows them as a span", () => {
    render(
      <Controls
        schema={{ rows: range([3, 10], { min: 1, max: 24, label: "Rows" }) }}
        values={{ rows: [3, 10] }}
        onChange={() => {}}
      />,
    );

    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByText("3–10")).toBeInTheDocument();
  });
});

describe("Controls icon tabs", () => {
  it("draws each option as an icon tab named for the option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const schema = {
      side: withIcons(select(["top", "bottom"] as const, "top"), {
        top: <svg data-testid="top-icon" />,
        bottom: <svg data-testid="bottom-icon" />,
      }),
    };
    render(<Controls schema={schema} values={{ side: "top" }} onChange={onChange} />);

    const bottom = screen.getByRole("tab", { name: "Bottom" });
    expect(screen.getByRole("tab", { name: "Top" })).toContainElement(screen.getByTestId("top-icon"));
    expect(bottom).toContainElement(screen.getByTestId("bottom-icon"));
    expect(bottom).not.toHaveTextContent("Bottom");

    await user.click(bottom);
    expect(onChange).toHaveBeenCalledWith("side", "bottom");
  });
});

describe("Controls icon dropdown", () => {
  it("keeps a long icon setting as a dropdown, with each row's icon beside its label", async () => {
    const user = userEvent.setup();
    const options = ["a", "b", "c", "d", "e", "f", "g"] as const;
    const icons = Object.fromEntries(options.map((option) => [option, <svg key={option} data-testid={`icon-${option}`} />])) as Record<(typeof options)[number], ReactNode>;
    render(<Controls schema={{ type: withIcons(select(options, "a", "Type"), icons) }} values={{ type: "a" }} onChange={() => {}} />);

    expect(screen.queryByRole("tablist")).toBeNull();
    // The closed trigger already shows the chosen option's icon before its label.
    const trigger = screen.getByRole("combobox", { name: "Type" });
    expect(trigger).toContainElement(screen.getByTestId("icon-a"));
    await user.click(trigger);
    const row = await screen.findByRole("option", { name: "G" });
    expect(row).toContainElement(screen.getByTestId("icon-g"));
  });
});

describe("Controls ⋯ style menu", () => {
  const menuSchema = {
    tabs: bool(false, "Tabs"),
    tabsVariant: inMenu(select(["segment", "pill", "underline"] as const, "segment", "Variant"), "tabs"),
    tabsSize: inMenu(select(["sm", "md"] as const, "sm", "Size"), "tabs"),
  };

  function MenuHarness({ onChange }: { onChange?: (key: string, value: unknown) => void }) {
    const [values, setValues] = useState<ControlValues<typeof menuSchema>>({ tabs: false, tabsVariant: "segment", tabsSize: "sm" });
    return (
      <Controls
        schema={menuSchema}
        values={values}
        onChange={(key, value) => {
          onChange?.(key as string, value);
          setValues((current) => ({ ...current, [key]: value }) as ControlValues<typeof menuSchema>);
        }}
      />
    );
  }

  it("keeps a boolean's style settings in its ⋯ menu, usable only while it is on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MenuHarness onChange={onChange} />);

    // The styles are not rows of their own.
    expect(screen.queryByText("Variant")).not.toBeInTheDocument();
    const menu = screen.getByRole("button", { name: "Tabs styles" });
    const checkbox = screen.getByRole("checkbox");
    // Just before the checkbox.
    expect(menu.compareDocumentPosition(checkbox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(menu).toBeDisabled();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(menu).toBeEnabled();

    // Opening the menu never toggles the box it sits beside.
    await user.click(menu);
    expect(checkbox).toBeChecked();
    await user.click(await screen.findByRole("menuitemradio", { name: "Pill" }));
    expect(onChange).toHaveBeenLastCalledWith("tabsVariant", "pill");
    expect(screen.getByRole("menuitemradio", { name: "Sm" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("initialValues", () => {
  it("starts a select on its phone-width value only when asked", () => {
    const schema = {
      viewport: onMobile(select(["desktop", "mobile"] as const, "desktop"), "mobile"),
      size: select(["sm", "md"] as const, "md"),
    };
    expect(initialValues(schema)).toEqual({ viewport: "desktop", size: "md" });
    expect(initialValues(schema, { mobile: true })).toEqual({ viewport: "mobile", size: "md" });
  });
});
