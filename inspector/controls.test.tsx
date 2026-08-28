import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Controls } from "./controls";
import { select, type ControlValues } from "./schema";

const schema = {
  variant: select(["primary", "outline", "ghost"] as const, "primary", "Variant"),
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
    expect(buttonSelect).toHaveClass("w-auto", "justify-self-end");
    expect(inputSelect).toHaveClass("w-auto", "justify-self-end");
    expect(buttonSelect).not.toHaveClass("w-32");
    expect(inputSelect).not.toHaveClass("w-32");
  });

  it("renders the enum as an aligned select and updates the selection on pick", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);

    const trigger = screen.getByRole("combobox", { name: "Variant" });
    expect(trigger).toHaveTextContent("Primary");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Outline" }));

    await waitFor(() => expect(trigger).toHaveTextContent("Outline"));
  });
});
