"use client";

import { Fragment, useEffect, useState } from "react";
import { Controls } from "@/inspector/controls";
import {
  defineEntry,
  initialValues,
  type ControlSchema,
  type ControlValues,
  type Entry,
} from "@/inspector/schema";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { LoaderProvider } from "@/registry/lib/loader";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import { Button } from "@/registry/ui/button/button";
import { cn } from "@/registry/lib/cn";
import type { ComponentDemoName } from "./demo-names";

export type { ComponentDemoName } from "./demo-names";

const LOADER_DEMOS = new Set([
  "button", "action-button", "action-toggle", "copy-button", "delete-button",
  "alert", "badge", "dropdown-menu", "command-palette", "selection-toolbar",
]);
// Sizing belongs to the demo shell.
const DEMO_WIDTHS: Partial<Record<ComponentDemoName, string>> = {
  input: "max-w-sm", textarea: "max-w-sm", slider: "max-w-sm",
  progress: "max-w-sm", skeleton: "max-w-sm",
  select: "max-w-56", "select-search": "max-w-56", "select-aligned": "max-w-56",
  empty: "max-w-md", collapsible: "max-w-md", tabs: "max-w-md",
  "scroll-area": "max-w-sm", separator: "max-w-xs", "selection-toolbar": "max-w-lg",
  table: "max-w-xl", "data-table": "max-w-xl",
  "table-of-contents": "max-w-2xl", "table-of-contents-lines": "max-w-2xl",
  sidebar: "max-w-full",
};
const LOADER_CONTROLS = {
  loader: { kind: "select", options: ["ascii", "classic"], defaultValue: "classic", label: "Loader" },
} as const;

type DemoName = ComponentDemoName;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntry = Entry<any>;
type LoaderChoice = "ascii" | "classic";
type Values = ControlValues<ControlSchema>;

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

/**
 * One demo's download and settings. The playground draws the canvas and the settings in
 * different columns, so the state lives here and both read it. Key the caller by `name`: a
 * different demo starts from its own defaults.
 */
export interface ComponentDemoState {
  status: "loading" | "failed" | "ready";
  entry?: AnyEntry;
  values: Values;
  setValue: (key: string, value: unknown) => void;
  hasLoaderSetting: boolean;
  loader: LoaderChoice;
  setLoader: (loader: LoaderChoice) => void;
  /** Whether the demo is a one-shot entrance worth replaying from the toolbar. */
  replayable: boolean;
  /** Bumped by `replay` to remount the demo. */
  replayKey: number;
  replay: () => void;
}

export function useComponentDemo(name: DemoName): ComponentDemoState {
  // Nothing is loaded on the server or during hydration, so both render the placeholder.
  const [entry, setEntry] = useState<AnyEntry | undefined>(() =>
    typeof window === "undefined" ? undefined : loaded.get(name),
  );
  const [failed, setFailed] = useState(false);
  const [values, setValues] = useState<Values>();
  const [loader, setLoader] = useState<LoaderChoice>("classic");
  const [replayKey, setReplayKey] = useState(0);

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

  const defaults = (): Values => (entry ? initialValues(entry.controls) : {});

  return {
    status: entry ? "ready" : failed ? "failed" : "loading",
    entry,
    values: values ?? defaults(),
    setValue: (key, value) =>
      setValues((current) => ({ ...(current ?? defaults()), [key]: value as Values[string] })),
    hasLoaderSetting: LOADER_DEMOS.has(name),
    loader,
    setLoader,
    replayable: name === "scramble-text" || name === "blur-text",
    replayKey,
    replay: () => setReplayKey((current) => current + 1),
  };
}

/**
 * The demo itself, centred in whatever box the caller gives it. Changing a setting remounts
 * the demo, so every state is seen from its entrance.
 */
export function DemoCanvas({ demo }: { demo: ComponentDemoState }) {
  if (demo.status === "failed") {
    return (
      <div className="grid h-full min-h-full place-items-center">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <p role="alert" className="text-sm text-muted-foreground">This demo couldn’t load. Reload the page to try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </div>
    );
  }
  if (!demo.entry) {
    return (
      <div className="grid h-full min-h-full place-items-center">
        <ClassicLoader label="Loading component demo" />
      </div>
    );
  }

  const { entry, values, loader, replayKey } = demo;
  const isAppShell = entry.slug === "sidebar";
  const demoWidth = DEMO_WIDTHS[entry.slug as ComponentDemoName];
  const settingsKey = JSON.stringify([values, loader]);

  return (
    <div
      className={cn(
        // Safe centring: a demo taller than the canvas starts at the top and scrolls, rather
        // than overflowing above it where it can't be reached.
        "relative isolate flex min-h-full w-full min-w-0 items-center-safe justify-center-safe p-6",
        isAppShell && "h-full items-stretch p-3",
      )}
    >
      <LoaderProvider loader={loader === "ascii" ? <AsciiLoader /> : undefined}>
        <div
          className={cn(
            "flex min-w-0 max-w-full flex-col items-center",
            demoWidth && "w-full",
            demoWidth,
            isAppShell && "h-full min-h-0 items-stretch",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 w-fit max-w-full items-center justify-center",
              demoWidth && "w-full",
              isAppShell && "h-full min-h-0 items-stretch",
            )}
          >
            <Fragment key={`${settingsKey}-${replayKey}`}>{entry.render(values)}</Fragment>
          </div>
        </div>
      </LoaderProvider>
    </div>
  );
}

export function hasDemoSettings(demo: ComponentDemoState) {
  return demo.hasLoaderSetting || Object.keys(demo.entry?.controls ?? {}).length > 0;
}

/** The demo's settings rows; nothing until the demo has loaded. */
export function DemoSettings({ demo, idPrefix }: { demo: ComponentDemoState; idPrefix: string }) {
  if (!demo.entry) return null;
  const schema: ControlSchema = demo.entry.controls;

  return (
    <>
      <Controls
        idPrefix={idPrefix}
        schema={schema}
        values={demo.values}
        onChange={(key, value) => demo.setValue(key as string, value)}
      />
      {demo.hasLoaderSetting && (
        <Controls
          idPrefix={`${idPrefix}-loader`}
          schema={LOADER_CONTROLS}
          values={{ loader: demo.loader }}
          onChange={(_key, value) => demo.setLoader(value as LoaderChoice)}
        />
      )}
    </>
  );
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
  "scroll-area": async () => (await import("@/inspector/entries/scroll-area")).scrollAreaEntry,
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
  "blur-text": async () => (await import("@/inspector/entries/blur-text")).blurTextEntry,
  "text-shimmer": async () => (await import("@/inspector/entries/text-shimmer")).textShimmerEntry,
  textarea: async () => (await import("@/inspector/entries/textarea")).textareaEntry,
  toggle: async () => (await import("@/inspector/entries/toggle")).toggleEntry,
  tooltip: async () => (await import("@/inspector/entries/tooltip")).tooltipEntry,
};
