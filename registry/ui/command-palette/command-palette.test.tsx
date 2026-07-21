import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CommandPalette } from "./command-palette";

describe("CommandPalette", () => {
  it("keeps its query when a controlled owner rejects a close request", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <CommandPalette
        open
        groups={[{ items: [{ id: "settings", label: "Settings" }] }]}
        onOpenChange={onOpenChange}
      />,
    );

    const input = screen.getByPlaceholderText("Type a command or search…");
    await user.type(input, "settings");
    await user.keyboard("{Control>}k{/Control}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(input).toHaveValue("settings");
  });
});
