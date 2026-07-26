import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Morph } from "@/registry/ui/morph/morph";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

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
});
