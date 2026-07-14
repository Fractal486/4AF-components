import { render, screen } from "@testing-library/react";
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
  it("uses the complete radio keyboard pattern", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);

    const primary = screen.getByRole("radio", { name: "primary" });
    const outline = screen.getByRole("radio", { name: "outline" });
    primary.focus();

    await user.keyboard("{ArrowRight}");

    expect(outline).toHaveFocus();
    expect(outline).toBeChecked();
  });
});
