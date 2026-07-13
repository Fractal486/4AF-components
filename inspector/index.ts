import { buttonEntry } from "./entries/button";
import type { Entry } from "./schema";

/**
 * Every component in the library, in the order they should be listed.
 * Adding a component to the site is one import and one line here.
 */
export const entries: Entry[] = [buttonEntry];

export function getEntry(slug: string): Entry | undefined {
  return entries.find((entry) => entry.slug === slug);
}
