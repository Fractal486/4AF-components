"use client";

import { Maximize2 } from "lucide-react";
import { useState } from "react";
import { Controls } from "./controls";
import { getGroup } from "./index";
import {
  initialValues,
  paramsFromValues,
  type ControlSchema,
  type ControlValues,
  type Entry,
} from "./schema";

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
          <EntrySection key={entry.slug} entry={entry} groupSlug={group.slug} />
        ))}
      </div>
    );
  }

  const entry = group.entries.find((candidate) => candidate.slug === entrySlug) ?? group.entries[0];
  if (!entry) return null;

  return <EntrySection entry={entry} groupSlug={group.slug} />;
}

function EntrySection({ entry, groupSlug }: { entry: Entry; groupSlug: string }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{entry.name}</h1>
      </header>
      <EntryView key={entry.slug} entry={entry} groupSlug={groupSlug} />
    </div>
  );
}

function EntryView({ entry, groupSlug }: { entry: Entry; groupSlug: string }) {
  const [values, setValues] = useState<ControlValues<ControlSchema>>(() =>
    initialValues(entry.controls),
  );
  // An entry with no controls (e.g. Skeleton) drops the settings panel and the canvas
  // takes the full width — an empty panel is just clutter.
  const hasControls = Object.keys(entry.controls).length > 0;

  // Carries the current settings across, so the new tab opens on exactly what's on
  // screen rather than resetting to defaults.
  const fullHref = `/full/${groupSlug}?component=${entry.slug}&${paramsFromValues(values)}`;

  return (
    <div className="flex flex-col gap-10">
      <div
        className={
          hasControls
            ? "grid gap-4 md:grid-cols-[1fr_15rem] md:items-start"
            : "grid gap-4"
        }
      >
        {/* The canvas. Deliberately tall and empty: the component should be the only
            thing you can look at, and centred so its optical alignment is judged
            against nothing but space. */}
        <div className="relative grid min-h-72 place-items-center rounded-xl bg-surface p-8 shadow-border">
          {entry.render(values)}

          {/* Only on the components a preview box is too small for. A visible chip, not a
              hover-reveal — an escape hatch you can't find is no escape hatch. */}
          {entry.fullscreen && (
            <a
              href={fullHref}
              target="_blank"
              rel="noreferrer"
              title="Open full screen"
              aria-label="Open full screen in a new tab"
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground shadow-border outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Maximize2 className="size-3.5" />
            </a>
          )}
        </div>

        {/* rounded-lg (10px) inside rounded-xl (14px) with 4px padding: concentric. */}
        {hasControls && (
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
        )}
      </div>
    </div>
  );
}
