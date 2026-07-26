import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { Morph } from "@/registry/ui/morph/morph";
import {
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

afterEach(() => vi.useRealTimers());

describe("DropdownMenu", () => {
  it("supports keyboard checkbox toggles and closes after a normal item is chosen", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>
            Show details
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const checkboxItem = await screen.findByRole("menuitemcheckbox", { name: "Show details" });
    checkboxItem.focus();
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(checkboxItem).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("left-aligns a Morph inside a row, so a toggling label doesn't sit indented", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem indicator={false}>
            {(checked) => (
              <Morph
                activeKey={checked ? "on" : "off"}
                items={{ on: "Bookmarked", off: "Bookmark" }}
              />
            )}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const item = await screen.findByRole("menuitemcheckbox");

    // The row owns this, not the call site: Morph centres in the width it reserves for
    // its widest state, which would indent the shorter label in one state only.
    expect(item.className).toContain("[&_[data-slot=morph]]:place-items-start");
    expect(item.querySelector("[data-slot=morph]")).not.toBeNull();
  });

  it("mutes a morphing leading icon to the same weight as a plain one", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuItem>
            <svg data-testid="plain-icon" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem indicator={false}>
            {(checked) => (
              <Morph
                activeKey={checked ? "on" : "off"}
                items={{ on: <svg data-testid="morph-icon" />, off: <svg /> }}
              />
            )}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));

    // `[&>svg]` only reaches a direct child, and Morph puts its content one level down —
    // without the second rule the morphing glyph inherits the row's full-ink foreground
    // and reads brighter than every other row's icon.
    const plainRow = await screen.findByRole("menuitem");
    const morphRow = screen.getByRole("menuitemcheckbox");
    expect(plainRow.className).toContain("[&>svg]:text-muted-foreground");
    expect(morphRow.className).toContain("[&>[data-slot=morph]_svg]:text-muted-foreground");
  });

  it("holds an action row's outcome open, then puts the row back", async () => {
    const user = userEvent.setup();
    let finish: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuActionItem
            action={action}
            labels={{ success: "Copied" }}
            revertAfter={200}
          >
            Copy link
          </DropdownMenuActionItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitem");

    // Fake timers only from here: opening the menu runs through Base UI's own timers and
    // frames, which a faked clock would leave suspended.
    vi.useFakeTimers();

    fireEvent.click(row);
    fireEvent.click(row);
    // The double-submit guard is a ref, so the second click is dropped in the same tick
    // rather than a render later.
    expect(action).toHaveBeenCalledOnce();
    expect(row).toHaveAttribute("data-status", "pending");

    await act(async () => finish!());
    expect(row).toHaveAttribute("data-status", "success");
    // The whole point of `closeOnClick={false}`: an outcome on a row the user can no
    // longer see is no outcome at all.
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(row).toHaveTextContent("Copied");

    await act(async () => vi.advanceTimersByTime(200));
    expect(row).toHaveAttribute("data-status", "idle");
    expect(row).toHaveTextContent("Copy link");
  });
});
