import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { CommandPalette, CommandPanelBody, CommandPanelFooter } from "./command-palette";

const ignoredEvents = [{ repeat: true }, { isComposing: true }];

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
