import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CommandPanelActions } from "./command-palette.actions";

const shortcut = () => fireEvent.keyDown(window, { key: "s", ctrlKey: true });
const toggleMenu = () => fireEvent.keyDown(window, { key: "j", ctrlKey: true });

describe("Command action shortcuts", () => {
  it("arms confirmation before the first open, guards repeats, and disarms on close", async () => {
    const onSelect = vi.fn();
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    render(<CommandPanelActions items={[
      { id: "delete", label: "Delete", keybind: "mod+s", confirm: { label: "Confirm delete", resetAfter: 0 }, onSelect },
    ]} />);
    shortcut();
    await waitFor(() => expect(screen.getByRole("option")).toHaveAttribute("data-armed"));
    expect(onSelect).not.toHaveBeenCalled();
    shortcut();
    expect(onSelect).not.toHaveBeenCalled();
    toggleMenu();
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
    now.mockReturnValue(2000);
    shortcut();
    await waitFor(() => expect(screen.getByRole("option")).toHaveAttribute("data-armed"));
    expect(onSelect).not.toHaveBeenCalled();
    now.mockReturnValue(2400);
    shortcut();
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
    now.mockRestore();
  });

  it("runs async work before the first open, blocks duplicate work, and works after closing", async () => {
    let resolve!: () => void;
    const action = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    render(<CommandPanelActions items={[{ id: "save", label: "Save", keybind: "mod+s", action }]} />);
    shortcut();
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("option")).toHaveAttribute("aria-busy", "true");
    shortcut();
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    toggleMenu();
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
    shortcut();
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    await act(async () => resolve());
  });

  it("toggles with shortcuts before the first open and then with a row click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<CommandPanelActions items={[
      { id: "pin", label: "Pin", keybind: "mod+s", defaultChecked: false, onCheckedChange },
    ]} />);
    shortcut();
    await waitFor(() => expect(onCheckedChange).toHaveBeenLastCalledWith(true));
    await user.click(screen.getByRole("option"));
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    toggleMenu();
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
    shortcut();
    await waitFor(() => expect(onCheckedChange).toHaveBeenLastCalledWith(true));
    expect(onCheckedChange).toHaveBeenCalledTimes(3);
  });

  it("runs ordinary shortcuts immediately and ignores disabled actions", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<CommandPanelActions items={[{ id: "save", label: "Save", keybind: "mod+s", onSelect }]} />);
    shortcut();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    rerender(<CommandPanelActions items={[{ id: "save", label: "Save", keybind: "mod+s", onSelect, disabled: true }]} />);
    shortcut();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
