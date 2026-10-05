"use client";

import { cn } from "@/registry/lib/cn";
import { ease, spring } from "@/registry/lib/motion";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ChevronLeft, CornerDownLeft, Plus, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { CommandIcon, EscapeHint, Hint, KBD, SCROLLBAR } from "./command-palette.chrome";
import {
  ActionsOpenContext,
  FrozenRowContext,
  PaletteControlsContext,
  PanelHighlightContext,
  PanelSearchContext,
  type PaletteControls,
  type PanelHighlightHandler,
  type PanelHighlightRegistration,
} from "./command-palette.context";
import { CommandRow } from "./command-palette.panels";
import { CREATE_ID, scoreItem, useCommandSearch } from "./command-palette.search";
import type {
  CommandGroup,
  CommandItem,
  CommandPaletteProps,
  CommandPanelHelpers,
  CommandPanelInputProps,
  CommandPanelOptions,
} from "./command-palette.types";

// Keep the installable component's public API at this entry point.
export { CommandIcon, Kbd } from "./command-palette.chrome";
export { useCommandPanelHighlight } from "./command-palette.context";
export {
  CommandPanelBody,
  CommandPanelFooter,
  CommandPanelList,
  CommandPanelLoading,
  CommandPanelRow,
} from "./command-palette.panels";
export { useCommandSearch } from "./command-palette.search";
export {
  CommandPanelTab,
  CommandPanelTabList,
  CommandPanelTabPanel,
  CommandPanelTabs,
} from "./command-palette.tabs";
export type {
  CommandGroup,
  CommandItem,
  CommandPaletteProps,
  CommandPanelActionsProps,
  CommandPanelFooterProps,
  CommandPanelHeaderOptions,
  CommandPanelHelpers,
  CommandPanelInputProps,
  CommandPanelOptions,
  CommandPanelRowProps,
  CommandPanelTabListProps,
  CommandPanelTabPanelProps,
  CommandPanelTabProps,
  CommandPanelTabsProps,
  UseCommandSearchOptions,
} from "./command-palette.types";

/**
 * A command / search palette — the ⌘K overlay.
 *
 * Two Base UI primitives, each doing the job it owns and nothing hand-rolled:
 *
 * - **Autocomplete** (`inline open`) drives the roving highlight with the arrow keys,
 *   runs the highlighted item on Enter, and wires the `role="listbox"` relationships.
 *   `inline` is what lets its list render *inside* our panel instead of an anchored popup.
 * - **Dialog** traps focus, scroll-locks and inerts the page behind, and dismisses on
 *   Escape or an outside click. It's the same primitive our Dialog is built on.
 *
 * Filtering and ranking are *ours*, not the primitive's: a fuzzy scorer sorts the list
 * best-match-first and bolds the matched characters, then we hand Base UI the already
 * filtered/sorted items with `filter={null}` so it doesn't second-guess the order. This
 * is the one place worth overriding the primitive — its default is a plain contains-match
 * in declaration order, and a palette lives or dies on how the typing feels.
 *
 * Items can nest: an item carrying its own `items` drills into a sub-page instead of
 * running, Backspace on an empty query pops back, and a breadcrumb tracks the trail.
 * Custom panels can push another panel with `helpers.openPanel` when a flow needs a
 * second form step.
 *
 * Its enter and exit mirror Dialog: the backdrop fades, the panel scales in from a small
 * blur, and the exit fades and blurs without reversing the entrance. Base UI's `keepMounted`
 * hands the unmount timing to AnimatePresence so the exit can finish before teardown.
 */

function omitCommandPanelInputProps(input: CommandPanelInputProps) {
  const attributes = { ...input };
  delete attributes.label;
  delete attributes.value;
  delete attributes.defaultValue;
  delete attributes.onValueChange;
  delete attributes.onKeyDown;
  delete attributes.className;
  return attributes;
}

function consumeHeaderEscape(event: {
  preventDefault: () => void;
  stopPropagation: () => void;
  preventBaseUIHandler?: () => void;
}) {
  event.preventDefault();
  event.stopPropagation();
  event.preventBaseUIHandler?.();
}

function findCommandItem(items: CommandItem[], id: string): CommandItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.items) {
      const nested = findCommandItem(item.items, id);
      if (nested) return nested;
    }
  }
  return undefined;
}

function findCommandItemInGroups(groups: CommandGroup[], id: string): CommandItem | undefined {
  for (const group of groups) {
    const item = findCommandItem(group.items, id);
    if (item) return item;
  }
  return undefined;
}

/* -- Component ------------------------------------------------------------------------ */

interface Page {
  title: string;
  itemId?: string;
  /** A drilled-in command list. */
  groups?: CommandGroup[];
  /** A drilled-in custom panel (form). Rendered instead of the list. */
  panel?: (helpers: CommandPanelHelpers) => ReactNode;
  panelInput?: CommandPanelInputProps;
  /** Controls rendered at the right side of this page's header. */
  headerActions?: ReactNode;
  /**
   * The page the palette was opened straight into (`initialItemId`). Stepping back out of
   * it closes the palette rather than revealing a root list nobody asked for.
   */
  entry?: boolean;
}

/** The page an item drills into: its custom panel, or its sub-list. */
function pageForItem(item: CommandItem): Page | null {
  if (item.panel) {
    return {
      title: item.label,
      itemId: item.id,
      panel: item.panel,
      panelInput: item.panelInput,
      headerActions: item.headerActions,
    };
  }
  if (item.items && item.items.length > 0) {
    return {
      title: item.label,
      itemId: item.id,
      groups: [{ items: item.items }],
      headerActions: item.headerActions,
    };
  }
  return null;
}

/** The pages to open with when the palette is summoned straight into one item. */
function entryPages(groups: CommandGroup[], itemId: string | null | undefined): Page[] {
  if (!itemId) return [];
  const item = findCommandItemInGroups(groups, itemId);
  const page = item && !item.disabled ? pageForItem(item) : null;
  return page ? [{ ...page, entry: true }] : [];
}

function initialQuery(pages: Page[]): string {
  return pages[0]?.panelInput?.value ?? pages[0]?.panelInput?.defaultValue ?? "";
}

export function CommandPalette({
  groups,
  onSearch,
  searchDebounce = 200,
  loadingMessage = "Searching…",
  searchErrorMessage = "Search failed. Try again.",
  shortcut = true,
  placeholder = "Type a command or search…",
  emptyMessage = "No results found.",
  onCreate,
  footer = true,
  open,
  defaultOpen = false,
  onOpenChange,
  initialItemId,
  className,
}: CommandPaletteProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
  const reduceMotion = useReducedMotion();
  const [pages, setPages] = useState<Page[]>(() => (isOpen ? entryPages(groups, initialItemId) : []));
  const [query, setQuery] = useState(() => initialQuery(pages));
  const generatedPanelInputId = useId();

  const isRoot = pages.length === 0;
  // The root command search runs on the shared engine, which custom panels reuse.
  // Async only governs the root: a non-empty query there hands off to the source, while
  // drilled-in pages and panels stay local (or run their own `useCommandSearch`).
  const {
    results: asyncResults,
    searching,
    error: searchError,
  } = useCommandSearch<CommandGroup[]>(
    query,
    onSearch,
    { debounce: searchDebounce, enabled: isRoot },
  );
  const asyncActive = onSearch != null && isRoot && query.trim() !== "";
  // A drilled-in panel running its own `useCommandSearch` reports its refresh state here,
  // so the panel header can show the same inline loader the root input row does.
  const [panelSearching, setPanelSearching] = useState(false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const [frozenRow, setFrozenRow] = useState<unknown>(undefined);
  // A controlled owner can reject a close request by leaving `open` true. Reset only after
  // the rendered state actually closes, otherwise an Escape key would erase its query/page
  // — which is why this keys off `isOpen` rather than the close handler. Adjusted during
  // render: it's derived from the transition, nothing external is involved.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setPages([]);
      setQuery("");
      // A frozen row is released by the next real highlight; if the palette closes before
      // one arrives, this is what stops it outliving the thing it was frozen on.
      setFrozenRow(undefined);
    } else {
      const entry = entryPages(groups, initialItemId);
      setPages(entry);
      setQuery(initialQuery(entry));
    }
  }

  // Global ⌘K / Ctrl-K. Toggling is deliberate — the same chord that summons the palette
  // dismisses it, which is what every palette that owns the shortcut does.
  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, isOpen, setOpen]);

  // Stepping out of the page the palette was opened into closes it: the root list behind
  // it is not where anyone was, and showing it would be a second thing to dismiss.
  const leavesEntry = pages[0]?.entry === true;
  const goToDepth = useCallback((depth: number) => {
    if (depth === 0 && leavesEntry) {
      setOpen(false);
      return;
    }
    setPages((prev) => prev.slice(0, depth));
    setQuery("");
  }, [leavesEntry, setOpen]);

  const openPanel = useCallback((options: CommandPanelOptions) => {
    setPages((prev) => [
      ...prev,
      {
        title: options.title,
        panel: options.panel,
        panelInput: options.panelInput,
        headerActions: options.headerActions,
      },
    ]);
    setQuery(options.panelInput?.value ?? options.panelInput?.defaultValue ?? "");
  }, []);

  const runItem = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      // A panel or a sub-list drills in rather than running; a leaf runs and closes.
      const page = pageForItem(item);
      if (page) {
        setPages((prev) => [...prev, page]);
        setQuery(page.panelInput?.value ?? page.panelInput?.defaultValue ?? "");
        return;
      }
      setOpen(false);
      item.onSelect?.();
    },
    [setOpen],
  );

  const controls = useMemo<PaletteControls>(
    () => ({
      close: () => setOpen(false),
      back: () => goToDepth(pages.length - 1),
      canGoBack: pages.length > 0 && !(pages.length === 1 && leavesEntry),
    }),
    [setOpen, goToDepth, pages.length, leavesEntry],
  );

  // Only ever the last *real* highlight. Opening the menu blurs the list, which reports
  // `undefined` — so reading the live value at that moment would always come up empty.
  const lastHighlightedRef = useRef<unknown>(undefined);
  const panelHighlightRef = useRef<PanelHighlightHandler | null>(null);
  // Closing does *not* release the frozen row. Base UI restores its own highlight a frame
  // or two after focus returns to the list, and dropping ours the instant the menu closes
  // leaves that gap unlit — the highlight blinks off and back on the same row. The handover
  // happens below instead, when the real highlight actually arrives.
  // Reported by an actions menu when it opens: the row that owns the menu keeps its
  // highlight while focus is inside it. Base UI still drives the keyboard highlight, so the
  // arrows and Enter within the menu are unaffected.
  const reportActionsOpen = useCallback((open: boolean) => {
    if (open) setFrozenRow(lastHighlightedRef.current);
  }, []);

  const rememberHighlight = useCallback((value: unknown) => {
    if (value === undefined) return;
    lastHighlightedRef.current = value;
    // Base UI has the highlight again, so ours can stand down. The two are styled
    // identically, so overlapping for a frame is invisible where a gap is not.
    setFrozenRow(undefined);
  }, []);
  const notifyItemHighlighted = useCallback(
    (value: unknown) => {
      rememberHighlight(value);
      panelHighlightRef.current?.(value);
    },
    [rememberHighlight],
  );
  const registerPanelHighlight = useCallback<PanelHighlightRegistration>((handler) => {
    const previous = panelHighlightRef.current;
    panelHighlightRef.current = handler;
    return () => {
      if (panelHighlightRef.current === handler) panelHighlightRef.current = previous;
    };
  }, []);

  const activePage = pages.length > 0 ? pages[pages.length - 1]! : null;
  const activePanelItem = activePage?.itemId
    ? findCommandItemInGroups(groups, activePage.itemId)
    : undefined;
  const activePanel = activePanelItem?.panel ?? activePage?.panel;
  const panelInput = activePanelItem
    ? activePanelItem.panelInput
    : activePage?.panelInput;
  const activeHeaderActions = activePanelItem
    ? activePanelItem.headerActions
    : activePage?.headerActions;
  const panelInputValue = panelInput?.value ?? query;
  const setPanelInputValue = useCallback(
    (value: string) => {
      setQuery(value);
      panelInput?.onValueChange?.(value);
    },
    [panelInput],
  );
  // A panel page renders its form instead of the list. Called each render so its `close`
  // and `back` helpers always target the current stack depth.
  const panelNode = activePanel
    ? activePanel({
        close: () => setOpen(false),
        back: () => goToDepth(pages.length - 1),
        openPanel,
        query: panelInputValue,
        inputValue: panelInputValue,
        setInputValue: setPanelInputValue,
      })
    : null;
  const panelInputAttributes = panelInput ? omitCommandPanelInputProps(panelInput) : {};
  const panelInputId = panelInput?.id ?? generatedPanelInputId;
  // The panel header's trailing cluster: an inline loader (while the panel is refreshing a
  // search) sitting left of the panel's own filter/sort controls, mirroring the root input
  // row. Rendered whenever either is present. With actions, `-mr-1.5` pulls their padded
  // hit areas snug to the edge; a lone loader drops it so its right edge lands on `pr-3`
  // (12px) — the same rail the rows' trailing badge column sits on.
  const panelHeaderTrailing =
    panelSearching || activeHeaderActions ? (
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5",
          activeHeaderActions && "-mr-1.5",
        )}
      >
        {panelSearching && <AsciiLoader className="text-sm text-subtle-foreground" />}
        {activeHeaderActions}
      </div>
    ) : null;
  // Filter + rank ourselves, drop groups that empty out, and append the create row on the
  // root page while typing. Base UI then renders this list as-is (`filter={null}`).
  const visibleGroups = useMemo(() => {
    // Async mode: the source already filtered and ranked, so we render its groups as they
    // came, only dropping any that arrived empty. Local mode: score, sort and prune here.
    const result = asyncActive
      ? (asyncResults ?? [])
          .map((group) => ({ heading: group.heading, items: group.items }))
          .filter((group) => group.items.length > 0)
      : (activePage ? (activePage.groups ?? []) : groups)
          .map((group) => ({
            heading: group.heading,
            items: group.items
              .map((item) => ({ item, match: scoreItem(item, query) }))
              .filter((entry) => entry.match !== null)
              .sort((a, b) => b.match!.score - a.match!.score)
              .map((entry) => entry.item),
          }))
          .filter((group) => group.items.length > 0);

    if (onCreate && pages.length === 0 && query.trim()) {
      const term = query.trim();
      result.push({
        heading: undefined,
        items: [
          {
            id: CREATE_ID,
            label: `Create “${term}”`,
            icon: <Plus />,
            onSelect: () => onCreate(term),
          },
        ],
      });
    }
    return result;
  }, [asyncActive, asyncResults, activePage, groups, query, onCreate, pages.length]);

  // `searching` (from the engine) drives a moving indicator: whenever there's a list to
  // show it rides quietly in the input row ("refreshing"); with nothing to show it stands
  // in for the list via the Empty region below, so the two never both appear.
  const hasVisibleItems = visibleGroups.some((group) => group.items.length > 0);
  const renderedSearchError = searchError
    ? typeof searchErrorMessage === "function"
      ? searchErrorMessage(searchError)
      : searchErrorMessage
    : null;

  // Base UI wants the grouped shape (`{ items, …anyKeys }`); a heading-less group renders
  // no label. It filters/sorts nothing here — that already happened above.
  const items = visibleGroups.map((group) => ({ heading: group.heading, items: group.items }));

  return (
    <BaseDialog.Root
      open={isOpen}
      onOpenChange={(next, details) => {
        if (next) return;
        // Escape inside a drilled-in page steps back out of it instead of dismissing
        // the whole palette — cancelling Base UI's close is what keeps it open. Only
        // the root level actually closes on Escape.
        if (details.reason === "escape-key" && pages.length > 0) {
          details.cancel();
          goToDepth(pages.length - 1);
          return;
        }
        setOpen(false);
      }}
    >
      <AnimatePresence>
        {isOpen && (
          // keepMounted on the Portal keeps the subtree in the DOM so AnimatePresence, not
          // Base UI, owns when it's torn down.
          <BaseDialog.Portal keepMounted>
            <BaseDialog.Backdrop
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: ease.out }}
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                />
              }
            />
            <BaseDialog.Popup
              onKeyDown={(event) => {
                if (
                  !panelNode || event.defaultPrevented || event.key !== "Tab" ||
                  event.altKey || event.ctrlKey || event.metaKey ||
                  !event.currentTarget.contains(event.target as Node)
                ) return;

                // The header lives outside the tabs root. Cycle from anywhere in the
                // panel without moving focus away from its search field. Portalled
                // menus keep their own keyboard handling (the containment check above).
                const list = event.currentTarget.querySelector<HTMLElement>(
                  '[data-slot="command-panel-tab-list"]',
                );
                if (!list) return;
                const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'))
                  .filter((tab) => tab.closest('[role="tablist"]') === list &&
                    !tab.matches('[disabled], [aria-disabled="true"], [data-disabled]'));
                if (tabs.length === 0) return;

                const selected = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
                const next = selected < 0
                  ? (event.shiftKey ? tabs.length - 1 : 0)
                  : (selected + (event.shiftKey ? -1 : 1) + tabs.length) % tabs.length;
                const nextTab = tabs[next];
                if (!nextTab) return;
                event.preventDefault();
                // Activate through Base UI so controlled values and cancellation work.
                nextTab.click();
              }}
              // Top-anchored and x-centred. The vertical offset is a plain `top`, and the
              // horizontal centring a `-translate-x-1/2` now composes with Motion's scale.
              className={cn(
                "fixed top-[14vh] left-1/2 z-50 flex max-h-[min(34rem,calc(100dvh-16vh))] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-md border border-border bg-surface-raised shadow-overlay-drop outline-none",
                className,
              )}
              render={
                <motion.div
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? { opacity: 0, transition: { duration: 0 } }
                      : {
                          opacity: 0,
                          filter: "blur(8px)",
                          transition: { duration: 0.2, ease: ease.out },
                        }
                  }
                  transition={reduceMotion ? { duration: 0 } : spring.smooth}
                />
              }
            >
          <BaseDialog.Title className="sr-only">Command palette</BaseDialog.Title>

          <PaletteControlsContext.Provider value={controls}>
          <ActionsOpenContext.Provider value={reportActionsOpen}>
          <FrozenRowContext.Provider value={frozenRow}>
          {panelNode ? (
            <Autocomplete.Root
              inline
              open
              mode="none"
              // `"always"`, not a bare `true`: `true` waits for the user to type, so a list
              // that opens on an empty query sits with no row ready and Enter does nothing
              // until an arrow press.
              autoHighlight="always"
              loopFocus={false}
              // See the note on the root list below.
              {...({ keepHighlight: true } as Record<string, unknown>)}
              highlightItemOnHover
              onItemHighlighted={notifyItemHighlighted}
              value={panelInputValue}
              onValueChange={setPanelInputValue}
            >
            {/* A panel page: a Back button and either a title or an opt-in input field,
                then the form body and a slim footer. The header field drives
                `helpers.query` / `helpers.inputValue`; regular panels leave their own
                fields in charge. Escape clears a search field, but goes back from a
                traditional text field. Backspace steps back when the field is empty,
                while the Back button and the panel's own `back` helper remain available. */}
            <>
              <div
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2.5 border-b border-border pl-4 pr-3",
                )}
              >
                <button
                  type="button"
                  onClick={() => goToDepth(pages.length - 1)}
                  aria-label="Back"
                  className={cn(
                    "relative flex size-4 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-(--duration-fast) before:absolute before:-inset-y-2 before:-left-2.5 before:w-9 before:rounded-[6px] before:content-[''] hover:text-foreground focus-visible:text-foreground",
                  )}
                >
                  <CommandIcon>
                    <ChevronLeft />
                  </CommandIcon>
                </button>
                {panelInput ? (
                  <>
                    {panelInput.label && (
                      <label htmlFor={panelInputId} className="sr-only">
                        {panelInput.label}
                      </label>
                    )}
                    <Autocomplete.Input
                      {...panelInputAttributes}
                      id={panelInputId}
                      autoFocus={panelInput.autoFocus ?? true}
                      aria-label={
                        panelInput["aria-label"] ??
                        (panelInput.label ? undefined : activePage?.title)
                      }
                      onKeyDown={(event) => {
                        panelInput.onKeyDown?.(event);
                        if (event.defaultPrevented) return;

                        if (event.key === "Escape") {
                          if (panelInput.type === "search" && panelInputValue !== "") {
                            consumeHeaderEscape(event);
                            setPanelInputValue("");
                            return;
                          }
                          consumeHeaderEscape(event);
                          goToDepth(pages.length - 1);
                          return;
                        }
                        if (event.key === "Backspace" && panelInputValue === "") {
                          event.preventDefault();
                          goToDepth(pages.length - 1);
                        }
                      }}
                      placeholder={panelInput.placeholder ?? placeholder}
                      className={cn(
                        "h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle-foreground [&::-webkit-search-cancel-button]:appearance-none",
                        panelInput.className,
                      )}
                    />
                    {panelHeaderTrailing}
                  </>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {activePage?.title}
                  </span>
                )}
                {!panelInput && panelHeaderTrailing}
              </div>
              {/* Just a column — the panel owns its own body/footer split, so a pinned
                  footer can sit outside the scroll area rather than sticky inside it.
                  The provider lets the panel's own `useCommandSearch` light the header
                  loader above. */}
              <div className="flex min-h-0 flex-1 flex-col">
                <PanelSearchContext.Provider value={setPanelSearching}>
                  <PanelHighlightContext.Provider value={registerPanelHighlight}>
                    {panelNode}
                  </PanelHighlightContext.Provider>
                </PanelSearchContext.Provider>
              </div>
            </>
            </Autocomplete.Root>
          ) : (
          <Autocomplete.Root
            // `inline open`: the list lives in this panel, always visible. Controlled
            // query so it resets on close and on page changes. `filter={null}` because
            // we've already filtered and ranked the items ourselves.
            inline
            open
            items={items}
            filter={null}
            value={query}
            onValueChange={setQuery}
            itemToStringValue={(item: CommandItem) => item.label}
            // The first row carries the selection from the moment the list appears, and the
            // first *match* once a query narrows it, so Enter always has an answer and the
            // arrows start somewhere visible. A bare `true` would only do this after typing.
            autoHighlight="always"
            loopFocus={false}
            // Two states, not one. `data-highlighted` is the *selection* — what Enter runs —
            // and hovering must not move it, or sweeping the cursor across the list on the way
            // to somewhere else quietly reassigns what Enter does. Pressing a row does move it.
            //
            // Base UI has one gate for both (see `usePointerSelection`, which is why this stays
            // on): the rows filter hover out and let a press through, so the prop is left open
            // for the press to travel down.
            highlightItemOnHover
            // Leaving the list keeps the row rather than resetting it — without this,
            // `autoHighlight` would put the selection straight back on row one the moment the
            // pointer wandered out of the panel.
            {...({ keepHighlight: true } as Record<string, unknown>)}
            onItemHighlighted={rememberHighlight}
          >
            <div
              data-searching={searching ? "" : undefined}
              className="flex h-12 items-center gap-2.5 border-b border-border pl-4 pr-3"
            >
              <CommandIcon className="text-subtle-foreground" aria-hidden>
                <Search />
              </CommandIcon>

              {/* Breadcrumb: one pill per drilled-in page, click to jump back. */}
              {pages.map((page, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToDepth(index)}
                  className="flex shrink-0 items-center gap-1 rounded-[6px] bg-muted px-2 py-1 text-xs font-medium text-foreground transition-colors duration-(--duration-fast) hover:bg-border"
                >
                  {page.title}
                </button>
              ))}

              <Autocomplete.Input
                autoFocus
                placeholder={placeholder}
                // The list is `inline open`, so Autocomplete swallows Escape (no popup to
                // close). Drive navigation ourselves: Escape clears a non-empty query;
                // once empty, it steps back or closes. Backspace on an empty query steps
                // back up the page stack.
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    // A query clears first; then Escape steps back out of a sub-page;
                    // only at the root does it dismiss the palette.
                    if (query !== "") {
                      consumeHeaderEscape(event);
                      setQuery("");
                      return;
                    }
                    if (pages.length > 0) {
                      event.preventDefault();
                      goToDepth(pages.length - 1);
                      return;
                    }
                    setOpen(false);
                    return;
                  }
                  if (event.key === "Backspace" && query === "" && pages.length > 0) {
                    event.preventDefault();
                    goToDepth(pages.length - 1);
                  }
                }}
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle-foreground"
              />

              {searching && hasVisibleItems && (
                <AsciiLoader className="shrink-0 text-sm text-subtle-foreground" />
              )}

              <kbd className={cn(KBD, "hidden sm:block")}>
                Esc
              </kbd>
            </div>

            <Autocomplete.List
              className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5", SCROLLBAR)}
            >
              {(group: { heading?: string; items: CommandItem[] }) => (
                <Autocomplete.Group
                  key={group.heading ?? "group"}
                  items={group.items}
                  className="mb-1 last:mb-0"
                >
                  {group.heading && (
                    <Autocomplete.GroupLabel className="px-2.5 pt-2 pb-1 text-xs font-medium text-subtle-foreground">
                      {group.heading}
                    </Autocomplete.GroupLabel>
                  )}
                  <Autocomplete.Collection>
                    {(item: CommandItem) => (
                      <CommandRow key={item.id} item={item} query={query} onRun={runItem} />
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>

            {/* Empty's box must stay mounted — it's an ARIA live region — and only its
                *children* clear when there are results. The padding lives on an inner
                element that comes and goes with the message, so the outer box collapses
                to nothing rather than leaving a dead band under the list. */}
            <Autocomplete.Empty className="text-center text-sm text-muted-foreground">
              {searching ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8">
                  <AsciiLoader className="text-sm text-subtle-foreground" />
                  <span>{loadingMessage}</span>
                </div>
              ) : searchError ? (
                <div role="alert" className="px-4 py-8">
                  {renderedSearchError}
                </div>
              ) : (
                <div className="px-4 py-8">{emptyMessage}</div>
              )}
            </Autocomplete.Empty>

            {footer && (
              // The same two ends as a panel footer: escape at the left, the Enter action
              // pinned right. Drilling into a panel then swaps what sits between them, rather
              // than moving both of the things that are always there.
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-1.5 py-2">
                <div className="flex items-center gap-3">
                  <EscapeHint />
                  <Hint keys={["↑", "↓"]}>Navigate</Hint>
                </div>
                <Hint trailingKeys keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>
                  Select
                </Hint>
              </div>
            )}
          </Autocomplete.Root>
          )}
          </FrozenRowContext.Provider>
          </ActionsOpenContext.Provider>
          </PaletteControlsContext.Provider>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        )}
      </AnimatePresence>
    </BaseDialog.Root>
  );
}
