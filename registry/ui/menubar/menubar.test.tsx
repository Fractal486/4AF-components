import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi } from "vitest";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./menubar";

function EditorBar(props: Partial<React.ComponentProps<typeof Menubar>> & { onSave?: () => void; disableView?: boolean }) {
  const { onSave, disableView, ...barProps } = props;
  return (
    <Menubar aria-label="Editor" {...barProps}>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onSave}>
            Save
            <MenubarShortcut keys="mod+s" />
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu disabled={disableView}>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem defaultChecked>Show ruler</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Keyboard shortcuts</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const highlight = () => document.querySelector<HTMLElement>("[data-slot=menubar-highlight]")!;

describe("Menubar", () => {
  it("renders a named menubar with state on the element and forwards its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<EditorBar ref={ref} size="sm" variant="plain" />);

    const bar = screen.getByRole("menubar", { name: "Editor" });
    expect(ref.current).toBe(bar);
    expect(bar).toHaveAttribute("data-slot", "menubar");
    expect(bar).toHaveAttribute("data-size", "sm");
    expect(bar).toHaveAttribute("data-variant", "plain");
    expect(bar).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["File", "View", "Help"]);
    expect(highlight()).toHaveAttribute("aria-hidden", "true");
  });

  it("opens a menu, runs its item, and shows the highlight only while a menu is open", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditorBar onSave={onSave} />);

    expect(highlight()).not.toHaveAttribute("data-visible");
    const file = screen.getByRole("menuitem", { name: "File" });
    await user.click(file);

    const content = await screen.findByRole("menu");
    expect(content).toHaveAttribute("data-slot", "menubar-content");
    expect(file).toHaveAttribute("data-popup-open");
    await waitFor(() => expect(highlight()).toHaveAttribute("data-visible"));
    expect(highlight().style.getPropertyValue("--menubar-highlight-width")).toMatch(/px$/);

    await user.click(screen.getByRole("menuitem", { name: /Save/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(highlight()).not.toHaveAttribute("data-visible"));
  });

  it("moves between open menus with the arrow keys and skips a disabled menu", async () => {
    const user = userEvent.setup();
    render(<EditorBar disableView />);

    const file = screen.getByRole("menuitem", { name: "File" });
    const help = screen.getByRole("menuitem", { name: "Help" });
    file.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    expect(file).toHaveAttribute("data-popup-open");

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(help).toHaveAttribute("data-popup-open"));
    expect(file).not.toHaveAttribute("data-popup-open");
    expect(screen.getByRole("menuitem", { name: "Keyboard shortcuts" })).toBeInTheDocument();
    // Switching menus marks the panel instant, so it swaps without the open transition.
    expect(screen.getByRole("menu")).toHaveAttribute("data-instant", "group");
    expect(highlight()).toHaveAttribute("data-visible");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(help).toHaveFocus();
  });

  it("marks icon triggers for optical spacing and square icon-only shapes", () => {
    render(
      <Menubar aria-label="Project">
        <MenubarMenu>
          <MenubarTrigger><svg data-testid="folder" />Project</MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger aria-label="More"><svg /></MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );

    const project = screen.getByRole("menuitem", { name: "Project" });
    const more = screen.getByRole("menuitem", { name: "More" });
    expect(project).toHaveAttribute("data-icon-start");
    expect(project).not.toHaveAttribute("data-icon-only");
    expect(more).toHaveAttribute("data-icon-only");
  });

  it("supports controlled menus and state-based bar classes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Menubar aria-label="Controlled" className={(state) => (state.hasSubmenuOpen ? "is-open" : "is-closed")}>
        <MenubarMenu open={false} onOpenChange={onOpenChange}>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent><MenubarItem>Save</MenubarItem></MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    const bar = screen.getByRole("menubar");
    expect(bar).toHaveClass("is-closed");
    await user.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything()));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(
      <Menubar aria-label="Controlled" className={(state) => (state.hasSubmenuOpen ? "is-open" : "is-closed")}>
        <MenubarMenu open onOpenChange={onOpenChange}>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent><MenubarItem>Save</MenubarItem></MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    await screen.findByRole("menu");
    await waitFor(() => expect(bar).toHaveClass("is-open"));
  });

  it("lays out vertically", () => {
    render(<EditorBar orientation="vertical" />);
    const bar = screen.getByRole("menubar");
    expect(bar).toHaveAttribute("data-orientation", "vertical");
    expect(bar).toHaveAttribute("aria-orientation", "vertical");
  });
});
