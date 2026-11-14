import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { CommandPalette, CommandPanelBody, CommandPanelFooter } from "./command-palette";

const ignoredEvents = [{ repeat: true }, { isComposing: true }];

it("leaves focused controls' Enter alone and runs shifted-symbol and plus panel actions", async () => {
  const enter = vi.fn(), help = vi.fn(), add = vi.fn();
  render(<CommandPalette defaultOpen initialItemId="project" groups={[{ items: [{
    id: "project", label: "Project", panel: () => <>
      <CommandPanelBody><button>Local action</button><a href="#details">Details link</a></CommandPanelBody>
      <CommandPanelFooter actions={{ items: [
        { id: "enter", label: "Enter action", keybind: "enter", onSelect: enter },
        { id: "help", label: "Help", keybind: "shift+/", onSelect: help },
        { id: "add", label: "Add", keybind: "+", onSelect: add },
      ] }} />
    </>,
  }] }]} />);
  const local = await screen.findByRole("button", { name: "Local action" });
  expect(fireEvent.keyDown(local, { key: "Enter" })).toBe(true);
  expect(fireEvent.keyDown(screen.getByRole("link", { name: "Details link" }), { key: "Enter" })).toBe(true);
  expect(enter).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "?", code: "Slash", shiftKey: true });
  fireEvent.keyDown(window, { key: "+", code: "Equal", shiftKey: true });
  expect(help).toHaveBeenCalledOnce();
  expect(add).toHaveBeenCalledOnce();
});

describe.each(["ctrlKey", "metaKey"])("Command Palette shortcuts with %s", (modifier) => {
  it("toggles the palette only on fresh key presses", async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette groups={[]} onOpenChange={onOpenChange} />);
    const chord = { key: "k", [modifier]: true };

    for (const ignored of ignoredEvents) fireEvent.keyDown(window, { ...chord, ...ignored });
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(window, chord);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    for (const ignored of ignoredEvents) fireEvent.keyDown(window, { ...chord, ...ignored });
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, chord);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  function renderActions(onSelect = vi.fn()) {
    render(<CommandPalette defaultOpen initialItemId="project" groups={[{ items: [{
      id: "project", label: "Project", panel: () => <>
        <CommandPanelBody>Project details</CommandPanelBody>
        <CommandPanelFooter actions={{ items: [{ id: "save", label: "Save", keybind: "mod+s", onSelect }] }} />
      </>,
    }] }]} />);
    return onSelect;
  }

  it("toggles the actions menu only on fresh key presses", async () => {
    renderActions();
    const trigger = (await screen.findByText("Actions")).closest("button");
    const chord = { key: "j", [modifier]: true };

    for (const ignored of ignoredEvents) {
      fireEvent.keyDown(window, { ...chord, ...ignored });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.keyDown(window, chord);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    for (const ignored of ignoredEvents) {
      fireEvent.keyDown(window, { ...chord, ...ignored });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    }

    fireEvent.keyDown(window, chord);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("runs an action once per fresh key press", async () => {
    const onSelect = renderActions();
    await screen.findByText("Project details");
    const chord = { key: "s", [modifier]: true };

    for (const ignored of ignoredEvents) fireEvent.keyDown(window, { ...chord, ...ignored });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(window, chord);
    for (const ignored of ignoredEvents) fireEvent.keyDown(window, { ...chord, ...ignored });
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, chord);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
