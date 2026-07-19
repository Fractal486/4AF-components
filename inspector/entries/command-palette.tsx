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
    // Offer a "Create <query>" row at the foot of the list while typing.
    create: bool(true, "Create action"),
  },
  render({ shortcut, grouped, create }) {
    return <CommandPaletteDemo shortcut={shortcut} grouped={grouped} create={create} />;
  },
});
