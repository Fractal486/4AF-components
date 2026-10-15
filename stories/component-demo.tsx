"use client";

import { RotateCcw } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Controls } from "@/inspector/controls";
import { GenerationDemo } from "@/inspector/entries/generation-demo";
import {
  defineEntry,
  initialValues,
  type ControlSchema,
  type Entry,
} from "@/inspector/schema";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { LoaderProvider } from "@/registry/lib/loader";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
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
  | "classic-loader"
  | "badge"
  | "breadcrumb"
  | "button"
  | "button-group"
  | "checkbox"
  | "collapsible"
  | "command-palette"
  | "copy-button"
  | "date-picker"
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
  | "toggle"
  | "tooltip";

const LOADER_DEMOS = new Set([
  "button", "action-button", "action-toggle", "copy-button", "delete-button",
  "alert", "badge", "dropdown-menu", "command-palette", "selection-toolbar",
]);
// Sizing belongs to the demo shell; every entry uses the same reveal.
const DEMO_WIDTHS: Partial<Record<ComponentDemoName, string>> = {
  input: "max-w-sm", textarea: "max-w-sm", slider: "max-w-sm",
  progress: "max-w-sm", skeleton: "max-w-sm",
  select: "max-w-56", "select-search": "max-w-56", "select-aligned": "max-w-56",
  empty: "max-w-md", collapsible: "max-w-md", tabs: "max-w-md",
  separator: "max-w-xs", "selection-toolbar": "max-w-lg",
  table: "max-w-xl", "data-table": "max-w-xl",
  "table-of-contents": "max-w-2xl", "table-of-contents-lines": "max-w-2xl",
  sidebar: "max-w-full",
};
const LOADER_CONTROLS = {
  loader: { kind: "select", options: ["ascii", "classic"], defaultValue: "classic", label: "Loader" },
} as const;

function EntryPreview<S extends ControlSchema>({ entry }: { entry: Entry<S> }) {
  const [values, setValues] = useState(() => initialValues(entry.controls));
  const [replayKey, setReplayKey] = useState(0);
  const [loader, setLoader] = useState<"ascii" | "classic">("classic");
  const hasLoaderSetting = LOADER_DEMOS.has(entry.slug);
  const hasControls = Object.keys(entry.controls).length > 0;
  const isAppShell = entry.slug === "sidebar";
  const isScrambleText = entry.slug === "scramble-text";
  const demoWidth = DEMO_WIDTHS[entry.slug as ComponentDemoName];
  const settingsKey = JSON.stringify([values, loader]);

  return (
    <div className="not-prose first:mt-0 my-6">
      <div
        data-demo-box
        className={cn(
          "relative isolate grid h-[42rem] min-w-0 grid-rows-[minmax(0,1fr)_auto] items-center justify-items-center gap-8 overflow-hidden rounded-xl bg-background p-6 shadow-border",
          isAppShell && "min-h-0 items-stretch justify-items-stretch gap-3 p-3",
          // Reserve the bottom row for the replay control.
          "pb-14",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 items-center justify-center",
            isAppShell && "items-stretch",
          )}
        >
          {isScrambleText && (
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
          )}
          <LoaderProvider loader={loader === "ascii" ? <AsciiLoader /> : undefined}>
            <GenerationDemo
              key={entry.slug}
              name={entry.name}
              contentKey={settingsKey}
              loading={entry.slug === "table" && values.loading === true}
              className={cn(
                "flex min-w-0 max-w-full flex-col items-center",
                demoWidth && "w-full",
                demoWidth,
                (entry.slug === "table" || entry.slug === "data-table" || entry.slug === "collapsible") && "self-start",
                isAppShell && "h-full min-h-0 items-stretch",
              )}
              targetClassName={cn(
                "flex min-w-0 w-fit max-w-full items-center justify-center",
                demoWidth && "w-full",
                isAppShell && "h-full min-h-0 items-stretch",
              )}
            >
              {(revealed) => (
                <Fragment key={`${settingsKey}-${replayKey}`}>
                  {entry.render(isScrambleText && !revealed ? { ...values, intervalMs: 0 } : values)}
                </Fragment>
              )}
            </GenerationDemo>
          </LoaderProvider>
        </div>
        {hasControls || hasLoaderSetting ? (
          <section
            aria-label={`${entry.name} settings`}
            // Same 12px as the rows inside each Controls block, so the shared Loader row
            // reads as one more row rather than butting against the last one.
            className="@container mx-auto flex w-full min-w-0 max-w-[400px] flex-col gap-3 px-3 py-2"
          >
            <Controls
              idPrefix={`docs-${entry.slug}`}
              schema={entry.controls}
              values={values}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
            {hasLoaderSetting && (
              <Controls
                idPrefix={`docs-${entry.slug}-loader`}
                schema={LOADER_CONTROLS}
                values={{ loader }}
                onChange={(_key, value) => setLoader(value as "ascii" | "classic")}
              />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function loadingPreview() {
  // Reserve the EntryPreview height so loading a demo does not move the article.
  return (
    <div className="not-prose first:mt-0 my-6 grid h-[42rem] place-items-center rounded-xl bg-background shadow-border">
      <ClassicLoader label="Loading component demo" />
    </div>
  );
}

type DemoName = ComponentDemoName;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntry = Entry<any>;

/** Demos already downloaded this session, so a page that has one renders it immediately. */
const loaded = new Map<DemoName, AnyEntry>();

function loadDemo(name: DemoName) {
  return demos[name]().then((entry) => {
    loaded.set(name, entry);
    return entry;
  });
}

let preloadScheduled = false;

/**
 * Downloads the remaining demos one at a time while the browser is idle, once the first
 * demo has rendered. Page switches stay instant because each page still needs only its own
 * demo up front; this just makes it likely that demo is already here when the page opens.
 */
function preloadRemainingDemos() {
  if (preloadScheduled) return;
  preloadScheduled = true;
  const whenIdle = (task: () => void) =>
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(task, { timeout: 2000 })
      : globalThis.setTimeout(task, 200);
  const queue = (Object.keys(demos) as DemoName[]).filter((name) => !loaded.has(name));
  const next = () => {
    const name = queue.shift();
    if (!name) return;
    if (loaded.has(name)) return whenIdle(next);
    // A failed speculative download must not stop the queue or reject unobserved.
    void loadDemo(name).then(() => whenIdle(next), () => whenIdle(next));
  };
  whenIdle(next);
}

function LazyDemo({ name }: { name: DemoName }) {
  // Nothing is loaded on the server or during hydration, so both render the placeholder.
  const [entry, setEntry] = useState<AnyEntry | undefined>(() =>
    typeof window === "undefined" ? undefined : loaded.get(name),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Already here: the initial state picked it up, so only the background queue remains.
    if (entry) {
      preloadRemainingDemos();
      return;
    }
    let active = true;
    void loadDemo(name).then(
      (next) => {
        if (!active) return;
        setEntry(() => next);
        preloadRemainingDemos();
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
    // Keyed by `name` at the call site, so `entry` only matters on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (entry) return <EntryPreview entry={entry} />;
  if (failed) {
    return (
      <div className="not-prose first:mt-0 my-6 grid h-[42rem] place-items-center rounded-xl bg-background shadow-border">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <p role="alert" className="text-sm text-muted-foreground">This demo couldn’t load. Reload the page to try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </div>
    );
  }
  return loadingPreview();
}

const demos: Record<DemoName, () => Promise<AnyEntry>> = {
  "ascii-loader": async () => defineEntry({
    slug: "ascii-loader",
    name: "ASCII Loader",
    controls: {},
    render: () => <AsciiLoader label="Loading" className="text-sm text-muted-foreground" />,
  }),
  "action-button": async () => (await import("@/inspector/entries/action-button")).actionButtonEntry,
  "action-toggle": async () => (await import("@/inspector/entries/action-toggle")).actionToggleEntry,
  alert: async () => (await import("@/inspector/entries/alert")).alertEntry,
  "alert-dialog": async () => (await import("@/inspector/entries/alert-dialog")).alertDialogEntry,
  badge: async () => (await import("@/inspector/entries/badge")).badgeEntry,
  breadcrumb: async () => (await import("@/inspector/entries/breadcrumb")).breadcrumbEntry,
  button: async () => (await import("@/inspector/entries/button")).buttonEntry,
  "button-group": async () => (await import("@/inspector/entries/button-group")).buttonGroupEntry,
  checkbox: async () => (await import("@/inspector/entries/checkbox")).checkboxEntry,
  collapsible: async () => (await import("@/inspector/entries/collapsible")).collapsibleEntry,
  "command-palette": async () => (await import("@/inspector/entries/command-palette")).commandPaletteEntry,
  "copy-button": async () => (await import("@/inspector/entries/copy-button")).copyButtonEntry,
  "date-picker": async () => (await import("@/inspector/entries/date-picker")).datePickerEntry,
  "delete-button": async () => (await import("@/inspector/entries/delete-button")).deleteButtonEntry,
  dialog: async () => (await import("@/inspector/entries/dialog")).dialogEntry,
  "dropdown-menu": async () => (await import("@/inspector/entries/dropdown-menu")).dropdownMenuEntry,
  empty: async () => (await import("@/inspector/entries/empty")).emptyEntry,
  "hover-card": async () => (await import("@/inspector/entries/hover-card")).hoverCardEntry,
  input: async () => (await import("@/inspector/entries/input")).inputEntry,
  "matrix-loader": async () => (await import("@/inspector/entries/matrix-loader")).matrixLoaderEntry,
  "classic-loader": async () => (await import("@/inspector/entries/classic-loader")).classicLoaderEntry,
  morph: async () => (await import("@/inspector/entries/morph")).morphEntry,
  popover: async () => (await import("@/inspector/entries/popover")).popoverEntry,
  progress: async () => (await import("@/inspector/entries/progress")).progressEntry,
  radio: async () => (await import("@/inspector/entries/radio")).radioEntry,
  select: async () => (await import("@/inspector/entries/select")).selectEntry,
  "select-sort": async () => (await import("@/inspector/entries/select-sort")).selectSortEntry,
  "select-aligned": async () => (await import("@/inspector/entries/select-aligned")).selectAlignedEntry,
  "select-search": async () => (await import("@/inspector/entries/select-search")).selectSearchEntry,
  "selection-toolbar": async () => (await import("@/inspector/entries/selection-toolbar")).selectionToolbarEntry,
  separator: async () => (await import("@/inspector/entries/separator")).separatorEntry,
  sheet: async () => (await import("@/inspector/entries/sheet")).sheetEntry,
  sidebar: async () => (await import("@/inspector/entries/sidebar")).sidebarEntry,
  "sidebar-layout": async () => (await import("@/inspector/entries/sidebar")).sidebarEntry,
  skeleton: async () => (await import("@/inspector/entries/skeleton")).skeletonEntry,
  slider: async () => (await import("@/inspector/entries/slider")).sliderEntry,
  switch: async () => (await import("@/inspector/entries/switch")).switchEntry,
  "data-table": async () => (await import("@/inspector/entries/data-table")).dataTableEntry,
  table: async () => (await import("@/inspector/entries/table")).tableEntry,
  "table-of-contents": async () => (await import("@/inspector/entries/table-of-contents")).tableOfContentsEntry,
  "table-of-contents-lines": async () => (await import("@/inspector/entries/table-of-contents-lines")).tableOfContentsLinesEntry,
  tabs: async () => (await import("@/inspector/entries/tabs")).tabsEntry,
  "scramble-text": async () => (await import("@/inspector/entries/scramble-text")).scrambleTextEntry,
  "text-shimmer": async () => (await import("@/inspector/entries/text-shimmer")).textShimmerEntry,
  textarea: async () => (await import("@/inspector/entries/textarea")).textareaEntry,
  toggle: async () => (await import("@/inspector/entries/toggle")).toggleEntry,
  tooltip: async () => (await import("@/inspector/entries/tooltip")).tooltipEntry,
};

export function ComponentDemo({ name }: { name: ComponentDemoName }) {
  return <LazyDemo key={name} name={name} />;
}
