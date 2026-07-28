import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  CommandPalette,
  CommandPanelActions,
  CommandPanelBody,
  CommandPanelFooter,
  CommandPanelList,
  CommandPanelRow,
} from "./command-palette";

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

  it("freezes the row highlight while an actions menu is open", async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette
        open
        groups={[
          {
            items: [
              {
                id: "projects",
                label: "Projects",
                panel: () => (
                  <CommandPanelBody>
                    <CommandPanelList>
                      <CommandPanelRow value="alpha">Alpha</CommandPanelRow>
                      <CommandPanelRow value="beta">Beta</CommandPanelRow>
                    </CommandPanelList>
                    <CommandPanelFooter>
                      <CommandPanelActions items={[{ id: "rename", label: "Rename" }]} />
                    </CommandPanelFooter>
                  </CommandPanelBody>
                ),
              },
            ],
          },
        ]}
      />,
    );

    await user.click(await screen.findByRole("option", { name: "Projects" }));

    const alpha = await screen.findByRole("option", { name: "Alpha" });
    const beta = screen.getByRole("option", { name: "Beta" });

    await user.hover(alpha);
    expect(alpha).toHaveAttribute("data-highlighted");

    await user.click(screen.getByText("Actions"));
    await screen.findByRole("option", { name: "Rename" });

    // Base UI drops its own highlight when the menu takes focus, so the row paints the
    // frozen one instead — the two are styled identically.
    expect(alpha).toHaveAttribute("data-frozen");

    // The menu belongs to that row. Crossing the list on the way out of it must not hand
    // the association to another row, by either mechanism.
    await user.hover(beta);
    expect(beta).not.toHaveAttribute("data-highlighted");
    expect(beta).not.toHaveAttribute("data-frozen");
    expect(alpha).toHaveAttribute("data-frozen");

    // And it lets go when the menu does.
    await user.keyboard("{Escape}");
    await waitFor(() => expect(alpha).not.toHaveAttribute("data-frozen"));
  });
});
