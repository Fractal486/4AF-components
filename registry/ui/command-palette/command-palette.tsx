"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, CornerDownLeft, Plus, Search } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { ease, spring } from "@/registry/lib/motion";

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
 *
 * The enter/exit are Motion's, matching the Dialog: it scales up out of a blur and leaves
 * by fading and blurring rather than playing the entrance backwards. `keepMounted` hands
 * unmount timing to AnimatePresence so the exit finishes before the DOM is torn down.
 */

export interface CommandItem {
  /** Stable identity for the item — used as the React key. */
  id: string;
  /** The visible label, what the query ranks against, and where matches are bolded. */
  label: string;
  /** A dimmer second line under the label. */
  description?: string;
  /** An optional leading glyph. A Lucide icon at `size-4` sits right. */
  icon?: ReactNode;
  /** A shortcut hint shown trailing, e.g. `⌘P`. Display only — bind it yourself. */
  shortcut?: string;
  /** Extra terms the query should match beyond the label ("prefs" → "Settings"). */
  keywords?: string[];
  disabled?: boolean;
  /** Sub-commands. When present, choosing the item drills into them instead of running. */
  items?: CommandItem[];
  /**
   * Drill into a custom panel — a form with its own inputs and buttons — instead of a
   * sub-list. Receives helpers to close the palette or step back up once done. Takes
   * precedence over `items`.
   */
  panel?: (helpers: CommandPanelHelpers) => ReactNode;
  /** Run when a leaf item is chosen (click or Enter). The palette closes around it. */
  onSelect?: () => void;
}

export interface CommandGroup {
  /** A section heading. Omit for an unlabelled group. */
  heading?: string;
  items: CommandItem[];
}

export interface CommandPanelHelpers {
  /** Close the whole palette — call it once the form is submitted. */
  close: () => void;
  /** Step back to the page that opened the panel, keeping the palette open. */
  back: () => void;
}

export interface CommandPaletteProps {
  groups: CommandGroup[];
  /** Bind ⌘K / Ctrl-K to toggle the palette globally. @default true */
  shortcut?: boolean;
  placeholder?: string;
  /** Shown when the query matches nothing (and there's no create action). */
  emptyMessage?: ReactNode;
  /**
   * Turns a miss into an action: a `Create "<query>"` row appears at the foot of the root
   * page while typing, navigable and runnable like any item.
   */
  onCreate?: (query: string) => void;
  /**
   * Show the ↑↓ / ↵ / esc hint bar under the command list. Panel pages carry their own
   * bar instead — see `CommandPanelFooter`. @default true
   */
  footer?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const CREATE_ID = "__command_create__";

// A thin custom scrollbar, shared by the list and any drilled-in panel — Firefox via the
// standard properties, WebKit via the pseudo-elements.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

/* -- Fuzzy matching ------------------------------------------------------------------ */

/**
 * A subsequence match with a relevance score, or `null` if `query`'s characters don't
 * appear in `text` in order. Whitespace in the query is ignored, so "go p" still finds
 * "**G**o to **P**rofile". Bonuses reward the matches that read as intentional — the
 * start of the string, the start of a word, and runs of consecutive characters — while
 * gaps are gently penalised. The returned positions drive the bolding.
 */
function fuzzyMatch(text: string, query: string): { score: number; positions: number[] } | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, positions: [] };

  const t = text.toLowerCase();
  const positions: number[] = [];
  let from = 0;
  let prev = -2;
  let score = 0;

  for (const char of q) {
    const idx = t.indexOf(char, from);
    if (idx === -1) return null;

    let bonus = 1;
    if (idx === prev + 1) bonus += 4; // consecutive
    if (idx === 0) bonus += 5; // start of the string
    else if (/[\s\-_/.]/.test(t[idx - 1]!)) bonus += 3; // start of a word
    if (prev >= 0) bonus -= Math.min(idx - prev - 1, 3) * 0.5; // gap

    score += bonus;
    positions.push(idx);
    prev = idx;
    from = idx + 1;
  }

  // Prefer shorter labels and more complete matches when scores are otherwise close.
  score += (q.length / t.length) * 3;
  return { score, positions };
}

/** Best of the label and keywords. Label matches are biased up and keep their positions. */
function scoreItem(item: CommandItem, query: string): { score: number; positions: number[] } | null {
  const labelMatch = fuzzyMatch(item.label, query);
  let best = labelMatch ? { score: labelMatch.score + 2, positions: labelMatch.positions } : null;

  if (query.trim()) {
    for (const keyword of item.keywords ?? []) {
      const km = fuzzyMatch(keyword, query);
      if (km && (!best || km.score > best.score)) {
        best = { score: km.score, positions: labelMatch?.positions ?? [] };
      }
    }
  }
  return best;
}

/** Split a label so the matched characters can be emphasised. */
function highlightLabel(label: string, positions: number[]): ReactNode {
  if (positions.length === 0) return label;
  const set = new Set(positions);
  return label.split("").map((char, i) =>
    set.has(i) ? (
      <span key={i} className="font-semibold text-foreground">
        {char}
      </span>
    ) : (
      <Fragment key={i}>{char}</Fragment>
    ),
  );
}

/* -- Component ------------------------------------------------------------------------ */

interface Page {
  title: string;
  /** A drilled-in command list. */
  groups?: CommandGroup[];
  /** A drilled-in custom panel (form). Rendered instead of the list. */
  panel?: (helpers: CommandPanelHelpers) => ReactNode;
}

export function CommandPalette({
  groups,
  shortcut = true,
  placeholder = "Type a command or search…",
  emptyMessage = "No results found.",
  onCreate,
  footer = true,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: CommandPaletteProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const reduceMotion = useReducedMotion();

  const setOpen = useCallback(
    (next: boolean) => {
      // Closing resets the drill-down and the query so the palette always reopens clean.
      if (!next) {
        setPages([]);
        setQuery("");
      }
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

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

  const goToDepth = useCallback((depth: number) => {
    setPages((prev) => prev.slice(0, depth));
    setQuery("");
  }, []);

  const runItem = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      // A panel or a sub-list drills in rather than running; a leaf runs and closes.
      if (item.panel) {
        setPages((prev) => [...prev, { title: item.label, panel: item.panel }]);
        setQuery("");
        return;
      }
      if (item.items && item.items.length > 0) {
        setPages((prev) => [...prev, { title: item.label, groups: [{ items: item.items! }] }]);
        setQuery("");
        return;
      }
      setOpen(false);
      item.onSelect?.();
    },
    [setOpen],
  );

  const activePage = pages.length > 0 ? pages[pages.length - 1]! : null;
  // A panel page renders its form instead of the list. Called each render so its `close`
  // and `back` helpers always target the current stack depth.
  const panelNode = activePage?.panel
    ? activePage.panel({
        close: () => setOpen(false),
        back: () => goToDepth(pages.length - 1),
      })
    : null;
  // Filter + rank ourselves, drop groups that empty out, and append the create row on the
  // root page while typing. Base UI then renders this list as-is (`filter={null}`).
  const visibleGroups = useMemo(() => {
    const source = activePage ? (activePage.groups ?? []) : groups;
    const result = source
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
  }, [activePage, groups, query, onCreate, pages.length]);

  // Base UI wants the grouped shape (`{ items, …anyKeys }`); a heading-less group renders
  // no label. It filters/sorts nothing here — that already happened above.
  const items = visibleGroups.map((group) => ({ heading: group.heading, items: group.items }));

  return (
    <AnimatePresence>
      {isOpen && (
        <BaseDialog.Root
          open
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
        >
          {/* keepMounted so AnimatePresence, not Base UI, decides when the tree unmounts. */}
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
              // Top-anchored, x-centred with a translate so Motion's scale composes on top
              // (Tailwind keeps `translate` and Motion's `transform` separate). No
              // y-translate — the vertical offset is a plain `top`, which nothing animates.
              className={cn(
                "fixed top-[14vh] left-1/2 z-50 flex max-h-[min(34rem,calc(100dvh-16vh))] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-md border border-border bg-background shadow-overlay-drop",
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

              {panelNode ? (
                // A panel page: a Back button and title, the form body, and a slim footer.
                // No search input or Autocomplete here — the form owns its own fields, and
                // Backspace belongs to whichever input has focus. Escape still closes via the
                // Dialog; stepping back is the Back button (or the form's own `back` helper).
                <>
                  <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-2">
                    <button
                      type="button"
                      onClick={() => goToDepth(pages.length - 1)}
                      aria-label="Back"
                      className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="truncate text-sm font-medium text-foreground">
                      {activePage?.title}
                    </span>
                  </div>
                  {/* Just a column — the panel owns its own body/footer split, so a pinned
                      footer can sit outside the scroll area rather than sticky inside it. */}
                  <div className="flex min-h-0 flex-1 flex-col">{panelNode}</div>
                </>
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
                // Keep the top match ready so Enter runs it without an arrow press first.
                autoHighlight
              >
                <div className="flex items-center gap-2 border-b border-border px-3.5">
                  <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />

                  {/* Breadcrumb: one pill per drilled-in page, click to jump back. */}
                  {pages.map((page, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goToDepth(index)}
                      className="flex shrink-0 items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground transition-colors duration-(--duration-fast) hover:bg-border"
                    >
                      {page.title}
                    </button>
                  ))}

                  <Autocomplete.Input
                    autoFocus
                    placeholder={placeholder}
                    // The list is `inline open`, so Autocomplete swallows Escape (no popup to
                    // close). Drive navigation ourselves: Escape clears a non-empty query then
                    // closes; Backspace on an empty query steps back up the page stack.
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && query === "") setOpen(false);
                      if (event.key === "Backspace" && query === "" && pages.length > 0) {
                        event.preventDefault();
                        goToDepth(pages.length - 1);
                      }
                    }}
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle-foreground"
                  />

                  <kbd className="hidden shrink-0 rounded-xs bg-muted px-1.5 py-0.5 font-mono text-2xs text-subtle-foreground select-none sm:block">
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
                        <Autocomplete.GroupLabel className="px-2 pt-2 pb-1 text-xs font-medium text-subtle-foreground">
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
                  <div className="px-4 py-8">{emptyMessage}</div>
                </Autocomplete.Empty>

                {footer && (
                  <div className="flex shrink-0 items-center gap-3 border-t border-border px-3.5 py-2">
                    <Hint keys={["↑", "↓"]}>Navigate</Hint>
                    <Hint keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>Select</Hint>
                    <Hint keys={["esc"]}>Close</Hint>
                    {pages.length > 0 && <Hint keys={["⌫"]}>Back</Hint>}
                  </div>
                )}
              </Autocomplete.Root>
              )}
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      )}
    </AnimatePresence>
  );
}

/**
 * The scrolling field area of a panel page. Pair it with `CommandPanelFooter`:
 *
 *   <form className="flex min-h-0 flex-1 flex-col" onSubmit={…}>
 *     <CommandPanelBody className="flex flex-col gap-4">…fields…</CommandPanelBody>
 *     <CommandPanelFooter><CommandPanelAction type="submit" …/></CommandPanelFooter>
 *   </form>
 *
 * The split is what lets the footer be a plain sibling of the scroll area instead of
 * `sticky` inside it. Sticky is clamped to its containing block, so a footer inside a
 * padded scroll container can never reach the bottom edge — it strands the container's
 * bottom padding under the bar. Keeping both inside the `<form>` means `type="submit"`
 * and Enter still submit natively, with no `form="id"` plumbing.
 */
export function CommandPanelBody({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-4", SCROLLBAR, className)}
    >
      {children}
    </div>
  );
}

/** The action bar for a panel page — see `CommandPanelBody` for the expected structure. */
export function CommandPanelFooter({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        // Same px/py as the list's hint bar, so both footers are exactly the same height.
        // `text-2xs` sets the scale for whatever children get passed in.
        "flex shrink-0 items-center justify-between gap-3 border-t border-border px-3.5 py-2 text-2xs",
        className,
      )}
    >
      <Hint keys={["esc"]}>Close</Hint>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="flex min-w-4 items-center justify-center rounded-xs bg-muted px-1 py-0.5 font-mono text-subtle-foreground">
      {children}
    </kbd>
  );
}

function Hint({ keys, children }: { keys: ReactNode[]; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-2xs text-subtle-foreground">
      <span className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </span>
      {children}
    </span>
  );
}

/**
 * A footer action — the palette is keyboard-first, so this reads as a hint with a key
 * chip ("Save ⏎"), not as a button. The label leads and the key trails, mirroring the
 * `esc Close` hint on the other end of the bar. It's still a real `<button>`, so it
 * stays clickable and `type="submit"` submits the panel's form.
 */
export function CommandPanelAction({
  keys,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { keys?: ReactNode[] }) {
  return (
    <button
      type="button"
      className={cn(
        // No vertical padding: the key chip has to set the row height here exactly as it
        // does in `Hint`, or this bar sits taller than the list's.
        "flex cursor-pointer items-center gap-1.5 rounded-xs px-1 text-2xs text-subtle-foreground",
        "outline-none transition-colors duration-(--duration-fast)",
        "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {keys && keys.length > 0 && (
        <span className="flex items-center gap-0.5">
          {keys.map((key, i) => (
            <Kbd key={i}>{key}</Kbd>
          ))}
        </span>
      )}
    </button>
  );
}

function CommandRow({
  item,
  query,
  onRun,
}: {
  item: CommandItem;
  query: string;
  onRun: (item: CommandItem) => void;
}) {
  const isCreate = item.id === CREATE_ID;
  // Re-derive the match positions for bolding. Cheap on the handful of visible rows, and
  // it keeps item identity stable (cloning items per keystroke would reset the highlight).
  const positions = !isCreate && query ? (fuzzyMatch(item.label, query)?.positions ?? []) : [];
  const hasChildren = item.panel != null || (item.items != null && item.items.length > 0);

  return (
    <Autocomplete.Item
      value={item}
      disabled={item.disabled}
      onClick={() => onRun(item)}
      // The highlight is Base UI's `data-highlighted` (keyboard *and* pointer land on the
      // same attribute), applied instantly with no transition so it keeps up with a fast
      // ↑↓ and doesn't smear across rows under the pointer.
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-muted-foreground outline-none select-none",
        "data-highlighted:bg-muted data-highlighted:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
      )}
    >
      {item.icon && (
        <span className="flex size-4 shrink-0 items-center justify-center text-subtle-foreground group-data-highlighted:text-foreground [&_svg]:size-4">
          {item.icon}
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">
          {isCreate ? item.label : highlightLabel(item.label, positions)}
        </span>
        {item.description && (
          <span className="truncate text-xs text-subtle-foreground">{item.description}</span>
        )}
      </span>

      {hasChildren ? (
        <ChevronRight
          className="size-4 shrink-0 text-subtle-foreground group-data-highlighted:text-foreground"
          aria-hidden
        />
      ) : (
        item.shortcut && (
          <kbd className="shrink-0 font-mono text-2xs text-subtle-foreground">{item.shortcut}</kbd>
        )
      )}
    </Autocomplete.Item>
  );
}
