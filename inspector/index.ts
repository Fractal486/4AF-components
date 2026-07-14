import { actionButtonEntry } from "./entries/action-button";
import { buttonEntry } from "./entries/button";
import { copyButtonEntry } from "./entries/copy-button";
import { morphEntry } from "./entries/morph";
import { toggleEntry } from "./entries/toggle";
import type { Entry } from "./schema";

/**
 * The index lists *groups*, not entries.
 *
 * Button, Toggle, Morph, Action Button and Copy Button are five separately installable
 * pieces — the two action buttons are built from the others — but they're one family.
 * The sidebar lists them while the main pane shows one at a time.
 *
 * A group with one entry renders without tabs.
 */
export interface Group {
  slug: string;
  name: string;
  summary: string;
  entries: Entry[];
}

export const groups: Group[] = [
  {
    slug: "button",
    name: "Button",
    summary:
      "The action, the toggle that holds a state, the content swap inside them, and the two buttons built from those.",
    entries: [buttonEntry, toggleEntry, morphEntry, copyButtonEntry, actionButtonEntry],
  },
];

export function getGroup(slug: string): Group | undefined {
  return groups.find((group) => group.slug === slug);
}
