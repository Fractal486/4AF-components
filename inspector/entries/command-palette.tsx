import { bool, defineEntry } from "../schema";
import { CommandPaletteDemo } from "./command-palette-demo";

export const commandPaletteEntry = defineEntry({
  slug: "command-palette",
  name: "Command Palette",
  controls: {
    // Bind the demo's own shortcut globally, separate from the component's ⌘K / Ctrl-K default.
    shortcut: bool(true, "⌘⇧P shortcut"),
    // Section the commands under headings, or run them as one flat list.
    grouped: bool(true, "Grouped"),
    // Drive results from a mock async source while typing, with a loading indicator.
    search: bool(false, "Async search"),
  },
  render({ shortcut, grouped, search }) {
    return <CommandPaletteDemo shortcut={shortcut} grouped={grouped} search={search} />;
  },
});
