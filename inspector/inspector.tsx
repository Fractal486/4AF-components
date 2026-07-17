"use client";

import { useState } from "react";
import { Controls } from "./controls";
import { getGroup } from "./index";
import { initialValues, type ControlSchema, type ControlValues, type Entry } from "./schema";

/**
 * Takes a group slug plus an optional entry slug: entries carry `render` functions, and
 * functions don't cross the server/client boundary. The sidebar owns navigation; this
 * client component only renders the selected entry and its controls.
 */
export function Inspector({ slug, entrySlug }: { slug: string; entrySlug?: string }) {
  const group = getGroup(slug);
  if (!group) return null;

  // A stacked group renders every entry, one full section under the next; otherwise the
  // sidebar picks a single entry to show.
  if (group.stacked) {
    // Trailing space so the last section's dropdown has room to open *downward* — without
    // it, a popup on the final demo hits the viewport bottom and Base UI flips it upward.
    return (
      <div className="flex flex-col gap-16 pb-80">
        {group.entries.map((entry) => (
          <EntrySection key={entry.slug} entry={entry} />
        ))}
      </div>
    );
  }

  const entry = group.entries.find((candidate) => candidate.slug === entrySlug) ?? group.entries[0];
  if (!entry) return null;

  return <EntrySection entry={entry} />;
}

function EntrySection({ entry }: { entry: Entry }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{entry.name}</h1>
      </header>
      <EntryView key={entry.slug} entry={entry} />
    </div>
  );
}

function EntryView({ entry }: { entry: Entry }) {
  const [values, setValues] = useState<ControlValues<ControlSchema>>(() =>
    initialValues(entry.controls),
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 md:grid-cols-[1fr_15rem] md:items-start">
        {/* The canvas. Deliberately tall and empty: the component should be the only
            thing you can look at, and centred so its optical alignment is judged
            against nothing but space. */}
        <div className="grid min-h-72 place-items-center rounded-xl bg-surface p-8 shadow-border">
          {entry.render(values)}
        </div>

        {/* rounded-lg (10px) inside rounded-xl (14px) with 4px padding: concentric. */}
        <aside className="rounded-xl bg-surface p-4 shadow-border">
          <Controls
            schema={entry.controls}
            values={values}
            onChange={(key, value) =>
              setValues(
                (prev) => ({ ...prev, [key]: value }) as ControlValues<ControlSchema>,
              )
            }
          />
        </aside>
      </div>

    </div>
  );
}
