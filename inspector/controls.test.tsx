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

    expect(document.getElementById("button-variant-label")).toHaveTextContent("Variant:");
    expect(document.getElementById("input-variant-label")).toHaveTextContent("Variant:");
    const [buttonTrigger, inputTrigger] = screen.getAllByRole("combobox");
    expect(buttonTrigger).toHaveAttribute(
      "aria-labelledby",
      "button-variant-label",
    );
    expect(inputTrigger).toHaveAttribute(
      "aria-labelledby",
      "input-variant-label",
    );
  });

  it("renders the enum as a combobox and updates the selection on pick", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);

    const trigger = screen.getByRole("combobox", { name: /variant/i });
    expect(trigger).toHaveTextContent("primary");

    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await user.click(screen.getByRole("option", { name: "outline" }));

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("outline");
  });
});
