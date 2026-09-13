"use client";

import dynamic from "next/dynamic";
import { RotateCcw } from "lucide-react";
import { Fragment, useState, type ComponentType } from "react";
import { Controls } from "@/inspector/controls";
import {
  initialValues,
  type ControlSchema,
  type Entry,
} from "@/inspector/schema";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Button } from "@/registry/ui/button/button";
import { cn } from "@/registry/lib/cn";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";

export type ComponentDemoName =
  | "action-button"
  | "action-toggle"
  | "alert"
  | "alert-dialog"
  | "ascii-loader"
  | "matrix-loader"
  | "badge"
  | "button"
  | "button-group"
  | "checkbox"
  | "collapsible"
  | "command-palette"
  | "copy-button"
  | "delete-button"
  | "dialog"
  | "dropdown-menu"
  | "empty"
  | "hover-card"
  | "input"
  | "morph"
  | "popover"
  | "progress"
  | "radio"
  | "select"
  | "select-sort"
  | "select-aligned"
  | "select-motion"
  | "select-motion-search"
  | "select-search"
  | "selection-toolbar"
  | "separator"
  | "sheet"
  | "sidebar"
  | "sidebar-layout"
  | "skeleton"
  | "slider"
  | "switch"
  | "data-table"
  | "table"
  | "table-of-contents"
  | "table-of-contents-lines"
  | "tabs"
  | "scramble-text"
  | "text-shimmer"
  | "textarea"
  | "toast"
  | "toggle"
  | "tooltip";

function EntryPreview<S extends ControlSchema>({ entry }: { entry: Entry<S> }) {
  const [values, setValues] = useState(() => initialValues(entry.controls));
  const [replayKey, setReplayKey] = useState(0);
  const hasControls = Object.keys(entry.controls).length > 0;
  const isAppShell = entry.slug === "sidebar";
  const isScrambleText = entry.slug === "scramble-text";

  return (
    <div className="not-prose first:mt-0 my-6">
      <div
        className={cn(
          "relative grid h-[42rem] min-w-0 grid-rows-[minmax(0,1fr)_auto] items-center justify-items-center gap-8 overflow-hidden rounded-xl bg-background p-6 shadow-border",
          isAppShell && "min-h-0 items-stretch justify-items-stretch gap-3 p-3",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 items-center justify-center",
            isAppShell && "items-stretch",
          )}
        >
          {isScrambleText ? (
            <>
              <Tooltip content="Replay animation" delay={0}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Replay Scramble Text animation"
                  className="absolute top-3 right-3 z-10"
                  onClick={() => setReplayKey((current) => current + 1)}
                >
                  <RotateCcw />
                </Button>
              </Tooltip>
              <Fragment key={replayKey}>{entry.render(values)}</Fragment>
            </>
          ) : (
            entry.render(values)
          )}
        </div>
        {hasControls ? (
          <section
            aria-label={`${entry.name} settings`}
            className="mx-auto w-[400px] px-3 py-2"
          >
            <Controls
              idPrefix={`docs-${entry.slug}`}
              schema={entry.controls}
              values={values}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function loadingPreview() {
  return (
    <div className="not-prose first:mt-0 my-6 grid min-h-72 place-items-center rounded-xl bg-background shadow-border">
      <AsciiLoader label="Loading component demo" />
    </div>
  );
}

function lazyEntry<S extends ControlSchema>(
  load: () => Promise<Entry<S>>,
): ComponentType {
  return dynamic(
    async () => {
      const entry = await load();
      return function LoadedEntry() {
        return <EntryPreview entry={entry} />;
      };
    },
    { ssr: false, loading: loadingPreview },
  );
}

const demos: Record<Exclude<ComponentDemoName, "ascii-loader">, ComponentType> = {
  "action-button": lazyEntry(async () => (await import("@/inspector/entries/action-button")).actionButtonEntry),
  "action-toggle": lazyEntry(async () => (await import("@/inspector/entries/action-toggle")).actionToggleEntry),
  alert: lazyEntry(async () => (await import("@/inspector/entries/alert")).alertEntry),
  "alert-dialog": lazyEntry(async () => (await import("@/inspector/entries/alert-dialog")).alertDialogEntry),
  badge: lazyEntry(async () => (await import("@/inspector/entries/badge")).badgeEntry),
  button: lazyEntry(async () => (await import("@/inspector/entries/button")).buttonEntry),
  "button-group": lazyEntry(async () => (await import("@/inspector/entries/button-group")).buttonGroupEntry),
  checkbox: lazyEntry(async () => (await import("@/inspector/entries/checkbox")).checkboxEntry),
  collapsible: lazyEntry(async () => (await import("@/inspector/entries/collapsible")).collapsibleEntry),
  "command-palette": lazyEntry(async () => (await import("@/inspector/entries/command-palette")).commandPaletteEntry),
  "copy-button": lazyEntry(async () => (await import("@/inspector/entries/copy-button")).copyButtonEntry),
  "delete-button": lazyEntry(async () => (await import("@/inspector/entries/delete-button")).deleteButtonEntry),
  dialog: lazyEntry(async () => (await import("@/inspector/entries/dialog")).dialogEntry),
  "dropdown-menu": lazyEntry(async () => (await import("@/inspector/entries/dropdown-menu")).dropdownMenuEntry),
  empty: lazyEntry(async () => (await import("@/inspector/entries/empty")).emptyEntry),
  "hover-card": lazyEntry(async () => (await import("@/inspector/entries/hover-card")).hoverCardEntry),
  input: lazyEntry(async () => (await import("@/inspector/entries/input")).inputEntry),
  "matrix-loader": lazyEntry(async () => (await import("@/inspector/entries/matrix-loader")).matrixLoaderEntry),
  morph: lazyEntry(async () => (await import("@/inspector/entries/morph")).morphEntry),
  popover: lazyEntry(async () => (await import("@/inspector/entries/popover")).popoverEntry),
  progress: lazyEntry(async () => (await import("@/inspector/entries/progress")).progressEntry),
  radio: lazyEntry(async () => (await import("@/inspector/entries/radio")).radioEntry),
  select: lazyEntry(async () => (await import("@/inspector/entries/select")).selectEntry),
  "select-sort": lazyEntry(async () => (await import("@/inspector/entries/select-sort")).selectSortEntry),
  "select-aligned": lazyEntry(async () => (await import("@/inspector/entries/select-aligned")).selectAlignedEntry),
  "select-motion": lazyEntry(async () => (await import("@/inspector/entries/select-motion")).selectMotionEntry),
  "select-motion-search": lazyEntry(async () => (await import("@/inspector/entries/select-motion-search")).selectMotionSearchEntry),
  "select-search": lazyEntry(async () => (await import("@/inspector/entries/select-search")).selectSearchEntry),
  "selection-toolbar": lazyEntry(async () => (await import("@/inspector/entries/selection-toolbar")).selectionToolbarEntry),
  separator: lazyEntry(async () => (await import("@/inspector/entries/separator")).separatorEntry),
  sheet: lazyEntry(async () => (await import("@/inspector/entries/sheet")).sheetEntry),
  sidebar: lazyEntry(async () => (await import("@/inspector/entries/sidebar")).sidebarEntry),
  "sidebar-layout": lazyEntry(async () => (await import("@/inspector/entries/sidebar")).sidebarEntry),
  skeleton: lazyEntry(async () => (await import("@/inspector/entries/skeleton")).skeletonEntry),
  slider: lazyEntry(async () => (await import("@/inspector/entries/slider")).sliderEntry),
  switch: lazyEntry(async () => (await import("@/inspector/entries/switch")).switchEntry),
  "data-table": lazyEntry(async () => (await import("@/inspector/entries/data-table")).dataTableEntry),
  table: lazyEntry(async () => (await import("@/inspector/entries/table")).tableEntry),
  "table-of-contents": lazyEntry(async () => (await import("@/inspector/entries/table-of-contents")).tableOfContentsEntry),
  "table-of-contents-lines": lazyEntry(async () => (await import("@/inspector/entries/table-of-contents-lines")).tableOfContentsLinesEntry),
  tabs: lazyEntry(async () => (await import("@/inspector/entries/tabs")).tabsEntry),
  "scramble-text": lazyEntry(async () => (await import("@/inspector/entries/scramble-text")).scrambleTextEntry),
  "text-shimmer": lazyEntry(async () => (await import("@/inspector/entries/text-shimmer")).textShimmerEntry),
  textarea: lazyEntry(async () => (await import("@/inspector/entries/textarea")).textareaEntry),
  toast: lazyEntry(async () => (await import("@/inspector/entries/toast")).toastEntry),
  toggle: lazyEntry(async () => (await import("@/inspector/entries/toggle")).toggleEntry),
  tooltip: lazyEntry(async () => (await import("@/inspector/entries/tooltip")).tooltipEntry),
};

export function ComponentDemo({ name }: { name: ComponentDemoName }) {
  if (name === "ascii-loader") {
    return (
      <div className="not-prose first:mt-0 my-6 grid min-h-72 place-items-center rounded-xl bg-background shadow-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AsciiLoader label="Loading" />
          <span>Loading</span>
        </div>
      </div>
    );
  }

  const Demo = demos[name];
  return <Demo />;
}
