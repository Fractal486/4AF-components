"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/ui/tabs/tabs";
import { Controls } from "./controls";
import { getGroup } from "./index";
import { initialValues, type ControlSchema, type ControlValues, type Entry } from "./schema";

/**
 * Takes a slug, not a group: entries carry `render` functions, and functions don't
 * cross the server/client boundary. The page stays a server component and the lookup
 * happens here.
 */
export function Inspector({ slug }: { slug: string }) {
  const group = getGroup(slug);
  if (!group) return null;

  const single = group.entries.length === 1;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{group.name}</h1>
        <p className="text-sm text-muted-foreground">{group.summary}</p>
      </header>

      {single && group.entries[0] ? (
        <EntryView entry={group.entries[0]} />
      ) : (
        <Tabs defaultValue={group.entries[0]?.slug} variant="underline">
          <TabsList>
            {group.entries.map((entry) => (
              <TabsTab key={entry.slug} value={entry.slug}>
                {entry.name}
              </TabsTab>
            ))}
          </TabsList>

          {group.entries.map((entry) => (
            <TabsPanel key={entry.slug} value={entry.slug}>
              {/* Keyed on the slug so control state resets when you switch component
                  — otherwise the `size` you picked for Button would leak into
                  Copy Button's panel, which has a different set of sizes. */}
              <EntryView key={entry.slug} entry={entry} />
            </TabsPanel>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function EntryView({ entry }: { entry: Entry }) {
  const [values, setValues] = useState<ControlValues<ControlSchema>>(() =>
    initialValues(entry.controls),
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{entry.summary}</p>
        {entry.source && (
          <p className="font-mono text-2xs text-subtle-foreground">{entry.source}</p>
        )}
      </div>

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

      {entry.notes && entry.notes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            What to look at
          </h2>
          <ul className="flex flex-col gap-2">
            {entry.notes.map((note) => (
              <li
                key={note}
                className="flex gap-3 text-sm text-muted-foreground before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-border-strong"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.matrix && (
        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
            Every variant
          </h2>
          <div className="rounded-xl bg-surface p-6 shadow-border">{entry.matrix()}</div>
        </section>
      )}
    </div>
  );
}
