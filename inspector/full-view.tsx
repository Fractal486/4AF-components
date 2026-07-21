"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controls } from "./controls";
import { FullscreenProvider } from "./fullscreen";
import { getGroup } from "./index";
import {
  valuesFromParams,
  type ControlSchema,
  type ControlValues,
  type Entry,
} from "./schema";

/**
 * A demo on its own, at the size of the window.
 *
 * A fixed overlay rather than a separate root layout: in the App Router the root layout
 * wraps every route, so escaping the site chrome would mean splitting the app into two
 * root layouts for the sake of one view. Covering it costs one element.
 *
 * Entries live behind this client boundary because `render` is a function, and functions
 * don't cross from server to client — the route hands over a slug and a query string.
 */
export function FullView({
  slug,
  params,
}: {
  slug: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const group = getGroup(slug);
  if (!group) return null;

  const componentParam = Array.isArray(params.component)
    ? params.component[0]
    : params.component;
  const entry =
    group.entries.find((candidate) => candidate.slug === componentParam) ?? group.entries[0];
  if (!entry) return null;

  // Split so the state hook lives past the early returns above without breaking the rules
  // of hooks.
  return <FullViewInner entry={entry} groupSlug={group.slug} params={params} />;
}

function FullViewInner({
  entry,
  groupSlug,
  params,
}: {
  entry: Entry;
  groupSlug: string;
  params: Record<string, string | string[] | undefined>;
}) {
  // Seeded from the URL, then live: the mirrored panel drives the demo exactly like the
  // one in the inspector, so this tab isn't a frozen snapshot.
  const [values, setValues] = useState<ControlValues<ControlSchema>>(() =>
    valuesFromParams(entry.controls as ControlSchema, params),
  );
  const hasControls = Object.keys(entry.controls).length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      <FullscreenProvider>{entry.render(values)}</FullscreenProvider>

      {/* Fixed to the window, not the demo, so it stays reachable however tall the
          component renders. A plain link — this tab may have been opened directly. */}
      <Link
        href={`/c/${groupSlug}?component=${entry.slug}`}
        aria-label="Back to the inspector"
        title="Back to the inspector"
        className="fixed top-3 right-3 z-[70] flex size-8 items-center justify-center rounded-md bg-surface text-muted-foreground shadow-border outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </Link>

      {/* The same controls as the inspector, parked in the corner. rounded-lg children in
          a rounded-xl box with p-4 — concentric, like the inspector's own panel. */}
      {hasControls && (
        <aside className="fixed right-4 bottom-4 z-[60] max-h-[calc(100dvh-2rem)] w-60 overflow-auto rounded-xl bg-surface p-4 shadow-overlay-drop">
          <Controls
            schema={entry.controls}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }) as ControlValues<ControlSchema>)
            }
          />
        </aside>
      )}
    </div>
  );
}
