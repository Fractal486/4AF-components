import { bool, defineEntry, select } from "../schema";
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
    // How the Keyboard Shortcuts panel marks its selected tab.
    tabs: select(["fill", "underline"], "fill", "Panel tabs"),
  },
  render({ shortcut, grouped, search, tabs }) {
    return <CommandPaletteDemo shortcut={shortcut} grouped={grouped} search={search} tabs={tabs} />;
  },
});
