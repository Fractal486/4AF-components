import { LABEL_EFFECTS } from "../button-options";
import { bool, defineEntry, select } from "../schema";
import { CommandPaletteDemo } from "./command-palette-demo";

export const commandPaletteEntry = defineEntry({
  slug: "command-palette",
  name: "Command Palette",
  controls: {
    // Section the commands under headings, or run them as one flat list.
    grouped: bool(true, "Grouped"),
    // Drive results from a mock async source while typing, with a loading indicator.
    search: bool(false, "Async search"),
    // How the Projects panel's action-menu rows change their labels.
    labelEffect: select(LABEL_EFFECTS, "swap", "Label effect"),
  },
  render({ grouped, search, labelEffect }) {
    return <CommandPaletteDemo grouped={grouped} search={search} labelEffect={labelEffect} />;
  },
});
