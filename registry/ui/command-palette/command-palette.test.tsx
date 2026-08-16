import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";

/** Mirrors DOUBLE_PRESS_GUARD in the component. */
const DOUBLE_PRESS_GUARD_MS = 400;
import {
  CommandPalette,
  CommandPanelActions,
  CommandPanelBody,
  CommandPanelFooter,
  CommandPanelList,
  CommandPanelRow,
  useCommandPanelHighlight,
  useCommandSearch,
} from "./command-palette";

describe("CommandPalette", () => {
  it("shows a useful state when async search rejects", async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        open
        groups={[]}
        searchDebounce={0}
        onSearch={() => Promise.reject(new Error("Service unavailable"))}
        searchErrorMessage={(error) =>
          error instanceof Error ? error.message : "Search unavailable"
        }
      />,
    );

    const input = screen.getByPlaceholderText("Type a command or search…");
    expect(input).toHaveClass("h-[38px]");
    await user.type(input, "status");
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  });

  it("also contains a synchronous search-source failure", async () => {
    const user = userEvent.setup();
    render(
      <CommandPalette
        open
        groups={[]}
        searchDebounce={0}
        onSearch={() => {
          throw new Error("Broken source");
        }}
      />,
    );

    await user.type(screen.getByPlaceholderText("Type a command or search…"), "status");
    expect(await screen.findByRole("alert")).toHaveTextContent("Search failed. Try again.");
  });

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
    const searchInput = screen.getByRole("textbox", { name: "Search options" });
    expect(searchInput).toHaveClass("h-full");
    expect(searchInput.parentElement).toHaveClass("h-[38px]");

    // Base UI drops its own highlight when the menu takes focus, so the row paints the
    // frozen one instead — the two are styled identically.
    expect(alpha).toHaveAttribute("data-frozen");

    // The menu belongs to that row. Crossing the list on the way out of it must not hand
    // the association to another row, by either mechanism.
    await user.hover(beta);
    expect(beta).not.toHaveAttribute("data-highlighted");
    expect(beta).not.toHaveAttribute("data-frozen");
    expect(alpha).toHaveAttribute("data-frozen");

    // Closing must never leave the row unlit. The frozen highlight is held until Base UI's
    // own one comes back — releasing it on close instead blinks the highlight off and on
    // again over the same row, because the real highlight lands a frame or two later.
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        alpha.hasAttribute("data-frozen") || alpha.hasAttribute("data-highlighted"),
      ).toBe(true),
    );
  });

  it("reports keyboard activation separately from pointer selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onActivate = vi.fn();

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
                      <CommandPanelRow
                        value="alpha"
                        onSelect={onSelect}
                        onActivate={onActivate}
                      >
                        Alpha
                      </CommandPanelRow>
                    </CommandPanelList>
                  </CommandPanelBody>
                ),
              },
            ],
          },
        ]}
      />,
    );

    await user.click(await screen.findByRole("option", { name: "Projects" }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onActivate).toHaveBeenCalledOnce();
    expect(onActivate.mock.calls[0]?.[0]).toHaveProperty("detail", 0);
  });

  it("reports custom-panel highlights and additional refresh work", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();

    function PaginatedPanel() {
      useCommandPanelHighlight(onHighlight);
      useCommandSearch("", undefined, { additionalRefreshing: true });

      return (
        <CommandPanelBody>
          <CommandPanelList>
            <CommandPanelRow value="alpha">Alpha</CommandPanelRow>
            <CommandPanelRow value="beta">Beta</CommandPanelRow>
          </CommandPanelList>
        </CommandPanelBody>
      );
    }

    render(
      <CommandPalette
        open
        groups={[
          {
            items: [
              {
                id: "projects",
                label: "Projects",
                panelInput: {
                  type: "search",
                  label: "Search projects",
                },
                panel: () => <PaginatedPanel />,
              },
            ],
          },
        ]}
      />,
    );

    await user.click(await screen.findByRole("option", { name: "Projects" }));
    const input = screen.getByLabelText("Search projects");
    expect(input).toHaveClass("h-[38px]");
    expect(input.parentElement).toHaveClass("h-[38px]");
    await waitFor(() =>
      expect(input.parentElement?.querySelector('span[aria-hidden="true"]')).toBeInTheDocument(),
    );

    await user.keyboard("{ArrowDown}");
    expect(onHighlight).toHaveBeenCalled();
  });

  it("runs, toggles and morphs rows inside the actions menu", async () => {
    const user = userEvent.setup();
    let finish: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onCheckedChange = vi.fn();

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
                    </CommandPanelList>
                    <CommandPanelFooter>
                      <CommandPanelActions
                        items={[
                          {
                            id: "save",
                            label: "Save",
                            action: save,
                            labels: { success: "Saved" },
                          },
                          {
                            id: "star",
                            label: "Star",
                            defaultChecked: false,
                            labels: { checked: "Starred" },
                            onCheckedChange,
                          },
                        ]}
                      />
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
    await user.click(screen.getByText("Actions"));

    // Morph row: no work to wait on, so it flips on the press — and the menu stays up,
    // which is the whole point of a row that reports in place.
    await user.click(await screen.findByRole("option", { name: "Star" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(await screen.findByRole("option", { name: "Starred" })).toBeInTheDocument();

    // Action row: waits, then confirms, with the menu still open behind it.
    const saveRow = screen.getByRole("option", { name: "Save" });
    await user.click(saveRow);
    expect(save).toHaveBeenCalledOnce();

    // Still enabled while it runs: a disabled row drops out of the roving highlight, and
    // the list would move focus onto a neighbour — so the next Enter would run something
    // the user never chose. Re-entry is refused by useAction, not by the DOM.
    expect(saveRow).not.toHaveAttribute("aria-disabled", "true");
    expect(saveRow).toHaveAttribute("aria-busy", "true");
    await user.click(saveRow);
    expect(save).toHaveBeenCalledOnce();
    await act(async () => finish!());
    expect(await screen.findByRole("option", { name: "Saved" })).toBeInTheDocument();
  });

  it("arms a confirm row on the first press and commits on the second", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

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
                    </CommandPanelList>
                    <CommandPanelFooter>
                      <CommandPanelActions
                        items={[
                          {
                            id: "delete",
                            label: "Delete project",
                            destructive: true,
                            confirm: { label: "Confirm?" },
                            onSelect,
                          },
                        ]}
                      />
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
    await user.click(screen.getByText("Actions"));

    // First press arms: it morphs, runs nothing, and leaves the menu up.
    await user.click(await screen.findByRole("option", { name: "Delete project" }));
    expect(await screen.findByRole("option", { name: "Confirm?" })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    // The guard means a second press has to be a deliberate one, not a double-click.
    await new Promise((resolve) => setTimeout(resolve, DOUBLE_PRESS_GUARD_MS));

    await user.click(screen.getByRole("option", { name: "Confirm?" }));
    expect(onSelect).toHaveBeenCalledOnce();
    // And it closes down the ordinary path, unlike every other stay-open row.
    await waitFor(() => expect(screen.queryByRole("option", { name: "Confirm?" })).toBeNull());
  });

  it("keeps the active row when the items are rebuilt around it", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [starred, setStarred] = useState(false);
      // Deliberately *not* memoised: a consumer's action list is normally a memo over real
      // dependencies, so acting on one row rebuilds every item object. The active row has
      // to survive that.
      const items = [
        { id: "first", label: "First" },
        {
          id: "star",
          label: starred ? "Starred" : "Star",
          defaultChecked: starred,
          onCheckedChange: setStarred,
        },
      ];

      return (
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
                      </CommandPanelList>
                      <CommandPanelFooter>
                        <CommandPanelActions items={items} />
                      </CommandPanelFooter>
                    </CommandPanelBody>
                  ),
                },
              ],
            },
          ]}
        />
      );
    }

    render(<Harness />);
    await user.click(await screen.findByRole("option", { name: "Projects" }));
    await user.click(screen.getByText("Actions"));

    const star = await screen.findByRole("option", { name: "Star" });
    await user.click(star);

    // Rebuilt items must not strand the highlight on an object that no longer exists.
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Starred" })).toHaveAttribute(
        "data-panel-active",
      ),
    );
  });
});
