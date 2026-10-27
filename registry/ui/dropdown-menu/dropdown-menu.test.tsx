import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import {
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSelect,
  DropdownMenuSelectContent,
  DropdownMenuSelectItem,
  DropdownMenuSelectTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("releases a composed trigger after the menu closes", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props, state) => (
            <Button
              {...props}
              variant="outline"
              pressed={state.open}
              pressScale={false}
              className="transition-[background-color,box-shadow,color,opacity,scale] active:scale-[0.95] motion-reduce:active:scale-100 data-[popup-open]:scale-[0.95] motion-reduce:data-[popup-open]:scale-100"
            >
              Options
            </Button>
          )}
        />
        <DropdownMenuContent>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Options" });
    expect(trigger).not.toHaveAttribute("data-pressed");

    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("data-pressed", "true"));
    expect(trigger.className).toContain("data-[popup-open]:scale-[0.95]");

    await user.click(document.body);
    await waitFor(() => expect(trigger).not.toHaveAttribute("data-pressed"));
    await waitFor(() => expect(trigger.style.transform).toBe("none"), { timeout: 1000 });
  });

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

  it("shows the reason tooltip for a disabled row", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuItem
            disabled
            disabledReason="Billing is available on the Pro plan."
          >
            Billing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitem", { name: /Billing/ });
    expect(row.className).toContain("data-[disabled]:pointer-events-auto");

    await user.hover(row);
    expect(
      await screen.findByText("Billing is available on the Pro plan."),
    ).toBeInTheDocument();
  });

  it("opens a nested panel as soon as its row is hovered", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More actions</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested action</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const subTrigger = await screen.findByRole("menuitem", { name: "More actions" });
    await user.hover(subTrigger);

    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
    const nestedItem = screen.getByRole("menuitem", { name: "Nested action" });
    expect(nestedItem).toBeInTheDocument();
    expect(nestedItem).not.toHaveAttribute("data-highlighted");
    expect(nestedItem).toHaveClass("hover:bg-muted");
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
    expect(item.className).toContain("[&>[data-slot=morph]]:place-items-start");
    expect(item.querySelector("[data-slot=morph]")).not.toBeNull();
  });

  it("gives the tick the same box a leading icon gets", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuItem>
            <svg />
            Settings
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem defaultChecked>Show toolbar</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const checkboxRow = await screen.findByRole("menuitemcheckbox");
    const slot = checkboxRow.querySelector("span");

    // 10px to 24px, the same run a leading icon takes from the row's `px-2.5`. `left-2`
    // with `size-4` shares only the right edge, which puts the tick a pixel left of every
    // icon row's glyph.
    expect(slot?.className).toContain("left-2.5");
    expect(slot?.className).toContain("size-3.5");

    // The slot holds a drawn checkbox, checked here. Its tick is sized with an important
    // class: the row sizes every svg, and `.row svg` would otherwise outrank it.
    const box = slot?.querySelector('[data-slot="dropdown-menu-checkbox"]');
    expect(box).toHaveAttribute("data-checked");
    expect(box?.querySelector("svg")?.getAttribute("class")).toContain("size-[70%]!");
  });

  it("keeps a glyph Morph centred in an icon slot rather than start-aligned", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuActionItem action={() => {}} icon={<svg />}>
            Copy link
          </DropdownMenuActionItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitem");

    // The start-alignment rule is scoped to direct children so it reaches the label but
    // not the glyph. A start-aligned glyph slot drags the narrow ASCII loader left of
    // where every other row's 14px icon sits.
    const [glyph, label] = [...row.querySelectorAll("[data-slot=morph]")];
    expect(glyph?.parentElement).not.toBe(row);
    expect(glyph?.parentElement?.className).toContain("size-3.5");
    expect(label?.parentElement).toBe(row);
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
            revertAfter={50}
          >
            Copy link
          </DropdownMenuActionItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitem");

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

    // A real 50ms wait rather than a faked clock: Base UI's menu schedules its own
    // timers, and parking those on a fake clock leaves the *next* test's menu unable to
    // open at all. The revert is short enough that waiting for it is cheap.
    await waitFor(() => expect(row).toHaveAttribute("data-status", "idle"));
    expect(row).toHaveTextContent("Copy link");
  });

  it("defers a checkbox row's tick until its action settles", async () => {
    const user = userEvent.setup();
    let finish: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onCheckedChange = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem action={action} onCheckedChange={onCheckedChange}>
            Mute thread
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitemcheckbox");

    fireEvent.click(row);

    // The tick holds while the work runs — the row must not claim to be muted before it
    // is, and nothing has been reported to the owner yet.
    expect(action).toHaveBeenCalledWith(true);
    expect(row).toHaveAttribute("aria-checked", "false");
    expect(row).toHaveAttribute("data-status", "pending");
    expect(onCheckedChange).not.toHaveBeenCalled();

    await act(async () => finish!());

    expect(row).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("leaves a checkbox row unchecked when its action fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => Promise.reject(new Error("offline")));
    const onCheckedChange = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem action={action} onCheckedChange={onCheckedChange}>
            Mute thread
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitemcheckbox");

    await act(async () => {
      fireEvent.click(row);
    });

    // Nothing moved, so there is nothing to roll back.
    expect(row).toHaveAttribute("data-status", "error");
    expect(row).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("reports a deferred checkbox change after the menu closes", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const onCheckedChange = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} action={action} onCheckedChange={onCheckedChange}>
            Mute thread
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitemcheckbox");
    await user.click(row);
    expect(action).toHaveBeenCalledExactlyOnceWith(true);
    expect(onCheckedChange).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(row).not.toBeInTheDocument());
    await act(async () => finish());

    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("puts a tickless deferred row's loader in its icon slot", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            indicator={false}
            action={action}
            icon={(checked) => <span data-testid={checked ? "muted" : "unmuted"} />}
          >
            Mute thread
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitemcheckbox");
    expect(row.querySelector("[data-slot=dropdown-menu-checkbox]")).toBeNull();
    expect(row.querySelector("[data-testid=unmuted]")).not.toBeNull();

    fireEvent.click(row);
    expect(row.querySelector("[data-slot=loader]")).not.toBeNull();

    await act(async () => finish());
    expect(row).toHaveAttribute("aria-checked", "true");
    expect(row.querySelector("[data-testid=muted]")).not.toBeNull();
  });

  it("stays a plain synchronous checkbox without an action", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>
            Show toolbar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const row = await screen.findByRole("menuitemcheckbox");

    fireEvent.click(row);

    // Flips on the click, and carries no status attribute at all.
    expect(row).toHaveAttribute("aria-checked", "true");
    expect(row).not.toHaveAttribute("data-status");
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("keeps a deferred row's accessible name free of its status text", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => new Promise<void>(() => {}));

    render(
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" />
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem action={action}>Mute thread</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(await screen.findByRole("menuitemcheckbox"));

    // A menu item's name is built from its contents, so the live region has to live
    // outside the row or the row renames itself to "Mute thread Working" mid-flight.
    expect(screen.getByRole("menuitemcheckbox", { name: "Mute thread" })).toBeInTheDocument();
  });
});


describe("DropdownMenuSelect", () => {
  function Example({ multiple = false, value, searchable = true, keepMounted = true, autoFocusFirstItem = true, onValueChange = () => {} }: {
    multiple?: boolean;
    searchable?: boolean;
    keepMounted?: boolean;
    value?: string | string[];
    autoFocusFirstItem?: boolean;
    onValueChange?: (value: string | string[] | null) => void;
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSelect<string, boolean> multiple={multiple} defaultValue={value} onValueChange={onValueChange}>
            <DropdownMenuSelectTrigger placeholder="Fruit" />
            <DropdownMenuSelectContent keepMounted={keepMounted} searchable={searchable} autoFocusFirstItem={autoFocusFirstItem}>
              <DropdownMenuSelectItem value="apple" disabled>Apple</DropdownMenuSelectItem>
              <DropdownMenuSelectItem value="banana">Banana</DropdownMenuSelectItem>
              <DropdownMenuSelectItem value="berry">Berry</DropdownMenuSelectItem>
              <DropdownMenuSelectItem value="mango">Mango</DropdownMenuSelectItem>
            </DropdownMenuSelectContent>
          </DropdownMenuSelect>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  async function openSelect(user: ReturnType<typeof userEvent.setup>) {
    screen.getByRole("button", { name: "Options" }).focus();
    await user.keyboard("{ArrowDown}");
    await user.hover(screen.getByRole("menuitem", { name: /Fruit/ }));
    const input = await screen.findByRole("textbox", { name: "Search options" });
    return input;
  }

  it.each([
    { value: "mango", multiple: false, active: "Mango" },
    { value: ["mango", "banana"], multiple: true, active: "Banana" },
    { value: undefined, multiple: false, active: "Banana" },
  ])("opens on $active for selection $value", async ({ value, multiple, active }) => {
    const user = userEvent.setup();
    render(<Example value={value} multiple={multiple} />);
    const input = await openSelect(user);
    const row = screen.getByRole(multiple ? "menuitemcheckbox" : "menuitemradio", { name: active });
    await waitFor(() => expect(row).toHaveAttribute("data-panel-active"));
    await waitFor(() => expect(input).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(row).toHaveFocus();
    fireEvent.pointerLeave(row);
    expect(row).toHaveAttribute("data-panel-active");
  });

  it("activates the first matching enabled row and selects it with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example value="mango" onValueChange={onValueChange} />);
    const input = await openSelect(user);
    await waitFor(() => expect(input).toHaveFocus());
    await user.keyboard("b");
    const banana = screen.getByRole("menuitemradio", { name: "Banana" });
    expect(banana).toHaveAttribute("data-panel-active");
    expect(screen.getByRole("menuitemradio", { name: "Berry" })).not.toHaveAttribute("data-panel-active");
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("banana");
    await waitFor(() => expect(input).not.toBeVisible());
  });

  it("clears the active row when no enabled match exists and ignores Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    const input = await openSelect(user);
    await waitFor(() => expect(input).toHaveFocus());
    await user.keyboard("apple");
    expect(document.querySelector('[data-panel-active]')).toBeNull();
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.clear(input);
    expect(screen.getByRole("menuitemradio", { name: "Banana" })).toHaveAttribute("data-panel-active");
  });

  it.each([true, false])("focuses the selected row without search (keepMounted=%s)", async (keepMounted) => {
    const user = userEvent.setup();
    render(<Example value="mango" searchable={false} keepMounted={keepMounted} />);
    screen.getByRole("button", { name: "Options" }).focus();
    await user.keyboard("{ArrowDown}");
    await user.hover(screen.getByRole("menuitem", { name: /Fruit/ }));
    const mango = await screen.findByRole("menuitemradio", { name: "Mango" });
    await waitFor(() => expect(mango).toHaveFocus());
    expect(mango).toHaveAttribute("data-panel-active");
  });

  it("keeps pointer activation and Enter on the same row", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example value="mango" onValueChange={onValueChange} />);
    const input = await openSelect(user);
    await waitFor(() => expect(input).toHaveFocus());
    const berry = screen.getByRole("menuitemradio", { name: "Berry" });
    fireEvent.mouseMove(berry);
    await waitFor(() => expect(berry).toHaveFocus());
    expect(berry).toHaveAttribute("data-panel-active");
    fireEvent.mouseLeave(berry);
    expect(berry).toHaveAttribute("data-panel-active");
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("berry");
  });

  it("can opt out of opening activation and search focus", async () => {
    const user = userEvent.setup();
    render(<Example autoFocusFirstItem={false} />);
    const input = await openSelect(user);
    expect(input).not.toHaveFocus();
    expect(document.querySelector('[data-panel-active]')).toBeNull();
  });
});
