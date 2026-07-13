"use client";

import { useState } from "react";
import { Controls } from "./controls";
import { getEntry } from "./index";
import { initialValues, type ControlSchema, type ControlValues } from "./schema";

/**
 * Takes a slug, not an entry: entries carry `render` functions, and functions
 * don't cross the server/client boundary. The page stays a server component and
 * the lookup happens here.
 */
export function Inspector({ slug }: { slug: string }) {
  const entry = getEntry(slug);
  if (!entry) return null;

  return <InspectorView key={entry.slug} entry={entry} />;
}

function InspectorView({ entry }: { entry: NonNullable<ReturnType<typeof getEntry>> }) {
  const [values, setValues] = useState<ControlValues<ControlSchema>>(() =>
    initialValues(entry.controls),
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{entry.name}</h1>
        <p className="text-sm text-muted-foreground">{entry.summary}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_15rem] md:items-start">
        {/* The canvas. Deliberately tall and empty: the component should be the
            only thing you can look at, and centred so its optical alignment is
            judged against nothing but space. */}
        <div className="grid min-h-72 place-items-center rounded-xl bg-surface p-8 shadow-border">
          {entry.render(values)}
        </div>

        {/* rounded-lg (10px) inside rounded-xl (14px) with 4px padding: concentric. */}
        <aside className="rounded-xl bg-surface p-4 shadow-border">
          <Controls
            schema={entry.controls}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }) as ControlValues<ControlSchema>)
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
