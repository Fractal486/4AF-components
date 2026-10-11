import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CommandPaletteDemo } from "./command-palette-demo";

describe("CommandPalette demo shortcuts", () => {
  it.each(["Control", "Meta"])("opens with %s+Shift+P and runs project actions only inside their panel", async (modifier) => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<CommandPaletteDemo shortcut grouped search={false} tabs="fill" />);

    await user.keyboard(`{${modifier}>}{Shift>}p{/Shift}{/${modifier}}`);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const chord = { key: "d", ctrlKey: modifier === "Control", metaKey: modifier === "Meta" };
    expect(fireEvent.keyDown(window, chord)).toBe(true);

    await user.click(screen.getByText("Projects…"));
    await screen.findByPlaceholderText("Search projects…");
    fireEvent.keyDown(window, chord);
    expect(await screen.findByText("Aurora copy")).toBeInTheDocument();
    fireEvent.keyDown(window, { ...chord, key: "l" });
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Aurora copy"));

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByPlaceholderText("Search projects…")).not.toBeInTheDocument());
    expect(fireEvent.keyDown(window, chord)).toBe(true);
  });

  it("hides and disables the demo opening shortcut when turned off", async () => {
    const user = userEvent.setup();
    render(<CommandPaletteDemo shortcut={false} grouped search={false} tabs="fill" />);
    const trigger = screen.getByRole("button", { name: "Open palette" });
    expect(trigger).not.toHaveAttribute("aria-keyshortcuts");
    await user.keyboard("{Control>}{Shift>}p{/Shift}{/Control}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
