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
  it("renders the enum as a combobox and updates the selection on pick", async () => {
    const user = userEvent.setup();
    render(<ControlsHarness />);

    const trigger = screen.getByRole("combobox", { name: /variant/i });
    expect(trigger).toHaveTextContent("primary");

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "outline" }));

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveTextContent("outline");
  });
});
