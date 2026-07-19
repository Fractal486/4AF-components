import { bool, defineEntry } from "../schema";
import { CommandPaletteDemo } from "./command-palette-demo";

export const commandPaletteEntry = defineEntry({
  slug: "command-palette",
  name: "Command Palette",
  controls: {
    // Bind ⌘K / Ctrl-K globally. On here so you can summon it without the button.
    shortcut: bool(true, "⌘K shortcut"),
    // Section the commands under headings, or run them as one flat list.
    grouped: bool(true, "Grouped"),
  },
  render({ shortcut, grouped }) {
    return <CommandPaletteDemo shortcut={shortcut} grouped={grouped} />;
  },
});
