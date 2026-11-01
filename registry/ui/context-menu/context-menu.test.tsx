import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

function FileArea({
  onRename,
  disabled,
  holdFeedback,
}: {
  onRename?: () => void;
  disabled?: boolean;
  holdFeedback?: boolean;
}) {
  return (
    <ContextMenu disabled={disabled}>
      <ContextMenuTrigger holdFeedback={holdFeedback} className="h-40">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          Rename
          <ContextMenuShortcut keys="mod+r" />
        </ContextMenuItem>
        <ContextMenuCheckboxItem defaultChecked>Starred</ContextMenuCheckboxItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const area = () => screen.getByText("Right click here");

describe("ContextMenu", () => {
  it("opens on right click with the Dropdown Menu panel and runs an item", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<FileArea onRename={onRename} />);

    expect(area()).toHaveAttribute("data-slot", "context-menu-trigger");
    expect(area()).toHaveClass("h-40", "transition-[scale]");
    await user.pointer({ keys: "[MouseRight]", target: area() });

    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("data-slot", "context-menu-content");
    expect(menu.closest("[data-slot=context-menu-positioner]")).not.toBeNull();
    expect(area()).toHaveAttribute("data-popup-open");
    expect(screen.getByRole("menuitemcheckbox", { name: "Starred" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));
    expect(onRename).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("opens submenus from the keyboard and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<FileArea />);

    fireEvent.contextMenu(area(), { clientX: 40, clientY: 40 });
    await screen.findByRole("menu");
    const share = screen.getByRole("menuitem", { name: "Share" });
    share.focus();
    await user.keyboard("{ArrowRight}");
    expect(await screen.findByRole("menuitem", { name: "Copy link" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Copy link" })).not.toBeInTheDocument());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("leaves the browser menu alone when disabled", () => {
    render(<FileArea disabled />);
    const event = fireEvent.contextMenu(area());
    // fireEvent returns false when a handler called preventDefault.
    expect(event).toBe(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  describe("hold feedback", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });

    it("marks a held touch after a short delay and releases it on lift", () => {
      render(<FileArea />);
      fireEvent.touchStart(area(), touch(10, 10));
      expect(area()).not.toHaveAttribute("data-holding");
      act(() => vi.advanceTimersByTime(130));
      expect(area()).toHaveAttribute("data-holding");
      fireEvent.touchEnd(area(), { touches: [] });
      expect(area()).not.toHaveAttribute("data-holding");
    });

    it("cancels when the finger moves, and can be turned off", () => {
      const { unmount } = render(<FileArea />);
      fireEvent.touchStart(area(), touch(10, 10));
      fireEvent.touchMove(area(), touch(10, 30));
      act(() => vi.advanceTimersByTime(130));
      expect(area()).not.toHaveAttribute("data-holding");
      unmount();

      render(<FileArea holdFeedback={false} />);
      fireEvent.touchStart(area(), touch(10, 10));
      act(() => vi.advanceTimersByTime(130));
      expect(area()).not.toHaveAttribute("data-holding");
    });
  });
});
