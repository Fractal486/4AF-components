import { actionButtonEntry } from "./entries/action-button";
import { buttonEntry } from "./entries/button";
import { copyButtonEntry } from "./entries/copy-button";
import { morphEntry } from "./entries/morph";
import { toggleEntry } from "./entries/toggle";
import type { Entry } from "./schema";

/**
 * The index lists *groups*, not entries.
 *
 * Button, Toggle, Morph and Copy Button are four separately installable pieces — Copy
 * Button is built from two of the others — but they're one family, and listing them as
 * four peers on the home screen would imply four unrelated components. So they share a
 * card, and the page tabs between them.
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
