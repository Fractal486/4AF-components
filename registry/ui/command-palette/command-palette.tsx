"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Select as BaseSelect } from "@base-ui/react/select";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import {
  Fragment,
  createContext,
  useId,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { ease, spring } from "@/registry/lib/motion";
import { useAction } from "@/registry/lib/use-action";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Morph } from "@/registry/ui/morph/morph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  useSelectSearch,
} from "@/registry/ui/select/select";

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

/**
 * A keycap.
 *
 * A translucent lift rather than a fixed token, because a keycap has to sit just above
 * *whatever* it's printed on, and that isn't one surface: the palette panel is
 * `surface-raised`, a menu row is `surface`. `foreground` at 8% steps up from either, and
 * flips direction on its own between themes — a pale wash on ink in dark, a grey one on
 * white in light. A fixed value can only be right on one of them.
 */
const KBD =
  "shrink-0 rounded-xs bg-foreground/8 px-1.5 py-0.5 font-mono text-2xs text-subtle-foreground select-none";

export interface CommandPanelInputProps
  extends Omit<
    ComponentProps<typeof Autocomplete.Input>,
    "className" | "defaultValue" | "onKeyDown" | "value"
  > {
  /** An accessible label for the compact header field. Falls back to the panel title. */
  label?: string;
  /** Use a controlled value for the header field. Omit it for an uncontrolled field. */
  value?: string;
  /** Initial value for an uncontrolled header field. */
  defaultValue?: string;
  /** Optional key handler; Escape clears only `type="search"` fields, otherwise it goes back. */
  onKeyDown?: ComponentProps<"input">["onKeyDown"];
  /** Called with the current value whenever the header field changes. */
  onValueChange?: (value: string) => void;
  /** Optional input styling. The field remains aligned to the standard header geometry. */
  className?: string;
}

export interface CommandItem {
  /** Stable identity for the item — used as the React key. */
  id: string;
  /** The visible label, what the query ranks against, and where matches are bolded. */
  label: string;
  /** A dimmer second line under the label. */
  description?: string;
  /** An optional leading glyph. A Lucide icon at `size-4` sits right. */
  icon?: ReactNode;
  /** Marks an irreversible action; action menus render it with destructive styling. */
  destructive?: boolean;
  /** Optional trailing content, typically a `Badge`, shown beside the shortcut or chevron. */
  badge?: ReactNode;
  /** A display-only shortcut hint shown trailing, e.g. `⌘P`. */
  shortcut?: string;
  /** An executable key chord for `CommandPanelActions`, e.g. `mod+o`. */
  keybind?: string;
  /** Extra terms the query should match beyond the label ("prefs" → "Settings"). */
  keywords?: string[];
  disabled?: boolean;
  /** Sub-commands. When present, choosing the item drills into them instead of running. */
  items?: CommandItem[];
  /**
   * Drill into a custom panel — a form with its own inputs and buttons — instead of a
   * sub-list. Receives helpers to close, step back, or open another custom panel. Takes
   * precedence over `items`.
   */
  panel?: (helpers: CommandPanelHelpers) => ReactNode;
  /** Render a configurable text field in the custom panel header instead of the panel title. */
  panelInput?: CommandPanelInputProps;
  /** Render arbitrary controls at the right side of this item's header when it opens a page. */
  headerActions?: ReactNode;
  /** Run when a leaf item is chosen (click or Enter). The palette closes around it. */
  onSelect?: () => void;

  /* -- Actions-menu rows. Ignored in the main list; see `CommandPanelActions`. -------- */

  /**
   * Work the row waits on, instead of choosing and closing. The menu stays open so the
   * outcome is visible. Given the state being moved *to* when the row is a toggle.
   *
   * With `checked`/`defaultChecked` it's the dropdown's `DropdownMenuCheckboxItem action`
   * — the row lands in the new state. Without, it's `DropdownMenuActionItem` — the row
   * confirms and reverts.
   */
  action?: (checked: boolean) => void | Promise<unknown>;
  /** Controlled toggle state. With no `action`, the flip is immediate. */
  checked?: boolean;
  /** Uncontrolled starting state. Its presence is what makes the row a toggle. */
  defaultChecked?: boolean;
  /** Called once the row has actually settled into the new state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Labels for the row's other states. Each falls back to `label`. */
  labels?: { checked?: ReactNode; pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /** Glyphs for the row's other states. Pending and error default to the loader and the
      warning triangle. */
  icons?: { checked?: ReactNode; pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /**
   * Make the row ask before it runs: the first press arms and morphs it, the second runs
   * `onSelect` and closes the menu like any other row. The menu-row form of
   * `DeleteButton`, and it disarms the same ways — Escape, the menu closing, or a timeout.
   */
  confirm?: {
    /** The armed label. Defaults to "Confirm?". */
    label?: ReactNode;
    /** The armed glyph. Defaults to the row's own icon. */
    icon?: ReactNode;
    /** How long it waits before disarming itself, in ms. `0` never does. @default 3000 */
    resetAfter?: number;
  };
  /** How long an outcome holds before the row returns to rest, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold the loader back this long, so a near-instant action doesn't flash it.
      @default 0 */
  pendingDelay?: number;
}

export interface CommandGroup {
  /** A section heading. Omit for an unlabelled group. */
  heading?: string;
  items: CommandItem[];
}

export interface CommandPanelHeaderOptions {
  /** Render arbitrary controls at the right side of this panel's header. */
  headerActions?: ReactNode;
}

export interface CommandPanelOptions extends CommandPanelHeaderOptions {
  /** The title shown when this panel is opened without a header input. */
  title: string;
  /** Render the panel body and footer. Receives a fresh helper scope for the new depth. */
  panel: (helpers: CommandPanelHelpers) => ReactNode;
  /** Optional configurable input rendered in the new panel's header. */
  panelInput?: CommandPanelInputProps;
}

export interface CommandPanelHelpers {
  /** Close the whole palette — call it once the form is submitted. */
  close: () => void;
  /** Step back to the page that opened the panel, keeping the palette open. */
  back: () => void;
  /** Push another custom panel on top of the current one. */
  openPanel: (options: CommandPanelOptions) => void;
  /** The current value of the custom-panel header field, when it is enabled. */
  query: string;
  /** Alias for `query` that is clearer when the header field is used as a text field. */
  inputValue: string;
  /** Set the custom-panel header field value. Controlled fields still require their owner to update `value`. */
  setInputValue: (value: string) => void;
}

export interface CommandPaletteProps {
  groups: CommandGroup[];
  /**
   * Drive the root results from a source instead of filtering `groups` locally — for a
   * server-backed search. Called (debounced) as the query changes; return the groups to
   * show, already ranked, and the palette renders them in that order without a second
   * local pass. A loading indicator shows while the promise is in flight, and stale
   * responses are dropped when a newer keystroke supersedes them (the `signal` aborts too).
   *
   * `groups` still renders whenever the query is empty, so it's the resting state —
   * recents or suggestions — with `onSearch` taking over the moment someone types. Only
   * the root page is affected; drilled-in pages and panels stay local. Omit it entirely
   * and the palette filters `groups` itself, exactly as before.
   */
  onSearch?: (query: string, signal: AbortSignal) => Promise<CommandGroup[]>;
  /** How long to wait after a keystroke before calling `onSearch`, in ms. @default 200 */
  searchDebounce?: number;
  /** Shown in place of the results while `onSearch` is in flight. @default "Searching…" */
  loadingMessage?: ReactNode;
  /** Shown when `onSearch` rejects. Receives the error when supplied as a function. */
  searchErrorMessage?: ReactNode | ((error: unknown) => ReactNode);
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

interface ParsedKeybind {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

function splitKeybind(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.includes("+")) {
    return trimmed.split(/\s*\+\s*/).filter(Boolean);
  }

  const compactModifier = /^(⌘|⌃|⌥|⇧|mod|cmd|command|meta|ctrl|control|alt|option|shift)(.+)$/i.exec(
    trimmed,
  );
  return compactModifier ? [compactModifier[1]!, compactModifier[2]!] : [trimmed];
}

function normalizeKey(value: string): string {
  switch (value.toLowerCase()) {
    case "esc":
      return "escape";
    case "return":
      return "enter";
    case "spacebar":
    case "space":
      return " ";
    case "del":
      return "delete";
    default:
      return value.toLowerCase();
  }
}

function parseKeybind(value: string): ParsedKeybind | null {
  let key: string | undefined;
  let mod = false;
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;

  for (const part of splitKeybind(value)) {
    switch (part.toLowerCase()) {
      case "mod":
        mod = true;
        break;
      case "cmd":
      case "command":
      case "meta":
      case "⌘":
        meta = true;
        break;
      case "ctrl":
      case "control":
      case "⌃":
        ctrl = true;
        break;
      case "alt":
      case "option":
      case "⌥":
        alt = true;
        break;
      case "shift":
      case "⇧":
        shift = true;
        break;
      default:
        key = normalizeKey(part);
    }
  }

  return key ? { key, mod, ctrl, meta, alt, shift } : null;
}

function formatKeybind(value: string): string[] {
  return splitKeybind(value).map((part) => {
    switch (part.toLowerCase()) {
      case "mod":
      case "cmd":
      case "command":
      case "meta":
      case "⌘":
        return "⌘";
      case "ctrl":
      case "control":
      case "⌃":
        return "Ctrl";
      case "alt":
      case "option":
      case "⌥":
        return "Alt";
      case "shift":
      case "⇧":
        return "Shift";
      case "esc":
        return "Esc";
      case "backspace":
        return "Backspace";
      default:
        return part.length === 1 ? part.toUpperCase() : part;
    }
  });
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function matchesKeybind(value: string, event: KeyboardEvent): boolean {
  const binding = parseKeybind(value);
  if (!binding) return false;

  const hasModifier = binding.mod || binding.ctrl || binding.meta || binding.alt || binding.shift;
  if (!hasModifier && isEditableTarget(event.target)) return false;

  if (binding.mod ? !(event.metaKey || event.ctrlKey) : event.metaKey !== binding.meta) {
    return false;
  }
  if (!binding.mod && event.ctrlKey !== binding.ctrl) return false;
  if (event.altKey !== binding.alt || event.shiftKey !== binding.shift) return false;

  return normalizeKey(event.key) === binding.key;
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
}

export interface UseCommandSearchOptions {
  /** Wait this long after a keystroke before calling `onSearch`, in ms. @default 200 */
  debounce?: number;
  /** Search only while this is true — e.g. a panel that isn't the active page. @default true */
  enabled?: boolean;
  /** Keep the panel header loader on for an additional async operation, such as pagination. */
  additionalRefreshing?: boolean;
}

// How a panel's `useCommandSearch` tells the palette to show the inline header loader.
// It reports only the *refresh* case (a search running over results already on screen),
// so the header spinner and a first-load `CommandPanelLoading` are mutually exclusive —
// exactly as the input-row and empty-region loaders are on the root list. The root's own
// `useCommandSearch` call sits outside this provider, so it reports to no one.
const PanelSearchContext = createContext<((refreshing: boolean) => void) | null>(null);

type PanelHighlightHandler = (value: unknown) => void;
type PanelHighlightRegistration = (handler: PanelHighlightHandler | null) => () => void;

// A custom panel can observe the shared Autocomplete highlight without reaching into the
// palette's root. This is used by server-backed panels that need to react when the last
// visible row becomes highlighted (for example, to fetch the next page).
const PanelHighlightContext = createContext<PanelHighlightRegistration | null>(null);

export function useCommandPanelHighlight(handler: PanelHighlightHandler | null): void {
  const register = useContext(PanelHighlightContext);

  useEffect(() => {
    if (!register) return;
    return register(handler);
  }, [handler, register]);
}

/**
 * Set while an actions menu is open, so the list behind it stops following the pointer.
 *
 * The menu belongs to one row. Leaving it with the cursor crosses back over the list, and
 * every row it passes would otherwise take the highlight — so the user returns to a menu
 * that now appears to belong to a different row than the one they opened it from. Freezing
 * the highlight keeps the two attached for as long as the menu is up.
 */
const ActionsOpenContext = createContext<((open: boolean) => void) | null>(null);

/**
 * The row the open actions menu belongs to.
 *
 * Base UI drops `data-highlighted` the moment focus leaves the list for the menu, so the
 * row can't keep the primitive's own highlight. The palette remembers which row was
 * highlighted when the menu opened and the rows paint that themselves — `data-frozen`,
 * styled identically to `data-highlighted`.
 */
const FrozenRowContext = createContext<unknown>(undefined);

/** True when this row is the one an open actions menu belongs to. */
function useFrozen(value: unknown): boolean {
  const frozen = useContext(FrozenRowContext);
  return frozen !== undefined && Object.is(frozen, value);
}

/**
 * The async-search engine behind the palette, exported so a custom panel gets the same
 * guarantees the root list does. Feed it the live query (a panel reads it from
 * `helpers.query`) and a source; it debounces, aborts the superseded request through its
 * `AbortSignal`, drops out-of-order responses, and reports `searching` *during render* —
 * derived from which query the current results answer — so no empty state flashes ahead of
 * the loading row.
 *
 * `results` is the last resolved value: it stays put while a refinement loads, so the list
 * doesn't blink to empty between keystrokes, and is `null` before the first result, while
 * the query is blank, or while `enabled` is false. The source ranks its own results —
 * render them in the order returned. Pair it with `CommandPanelLoading` for the row.
 */
export function useCommandSearch<T>(
  query: string,
  onSearch: ((query: string, signal: AbortSignal) => Promise<T>) | undefined,
  options: UseCommandSearchOptions = {},
): { results: T | null; searching: boolean; error: unknown | null } {
  const { additionalRefreshing = false, debounce = 200, enabled = true } = options;
  const [results, setResults] = useState<T | null>(null);
  const [resolvedTerm, setResolvedTerm] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  // The source lives behind a ref so an inline function (a fresh identity every render)
  // doesn't retrigger the effect and loop — it fires on the query, not the identity.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  // Monotonic id: only the newest request may commit, so a slow earlier response can't
  // overwrite a fast later one.
  const seqRef = useRef(0);
  const reportRefreshing = useContext(PanelSearchContext);
  const active = enabled && onSearch != null && query.trim() !== "";

  // Leaving search mode drops the stale results so the next entry starts clean — done on
  // the transition during render, not from the effect below. The effect owns a debounce
  // timer and an AbortController, which are genuinely external; this reset is not, and
  // from inside the effect it fired on every inactive render (a no-op each time, but a
  // cascading render by the letter of it).
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) {
      setResults(null);
      setResolvedTerm(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!active) return;
    const term = query.trim();
    const seq = ++seqRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError(null);
      Promise.resolve()
        .then(() => onSearchRef.current!(term, controller.signal))
        .then((result) => {
          if (seq !== seqRef.current) return;
          setResults(result);
          setResolvedTerm(term);
          setError(null);
        })
        .catch((reason: unknown) => {
          // An abort is the expected path when a newer keystroke supersedes this one — not
          // a failure, and the superseding run already owns the state.
          if (seq !== seqRef.current || controller.signal.aborted) return;
          setResults(null);
          setResolvedTerm(term);
          setError(reason || new Error("Search failed."));
        });
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, query, debounce]);

  // Derived, not stored: true from the keystroke until the results answer this exact
  // query, which is what keeps the loading indicator ahead of any empty state.
  const searching = active && resolvedTerm !== query.trim();

  // Tell a panel header when to show its inline loader — the refresh case only (a search
  // over results already on screen). First-load, when there's nothing yet, is left to the
  // centred `CommandPanelLoading`, so the two never overlap. A no-op at the root.
  const refreshing = additionalRefreshing || (searching && results != null);
  useEffect(() => {
    reportRefreshing?.(refreshing);
    return () => reportRefreshing?.(false);
  }, [reportRefreshing, refreshing]);

  return {
    results: active ? results : null,
    searching,
    error: active ? error : null,
  };
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
  className,
}: CommandPaletteProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const generatedPanelInputId = useId();

  const isRoot = pages.length === 0;
  // The root command search runs on the shared engine (below), which custom panels reuse.
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

  const goToDepth = useCallback((depth: number) => {
    setPages((prev) => prev.slice(0, depth));
    setQuery("");
  }, []);

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
      if (item.panel) {
        const panelInput = item.panelInput;
        setPages((prev) => [
          ...prev,
          {
            title: item.label,
            itemId: item.id,
            panel: item.panel,
            panelInput,
            headerActions: item.headerActions,
          },
        ]);
        setQuery(panelInput?.value ?? panelInput?.defaultValue ?? "");
        return;
      }
      if (item.items && item.items.length > 0) {
        setPages((prev) => [
          ...prev,
          {
            title: item.label,
            itemId: item.id,
            groups: [{ items: item.items! }],
            headerActions: item.headerActions,
          },
        ]);
        setQuery("");
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
      canGoBack: pages.length > 0,
    }),
    [setOpen, goToDepth, pages.length],
  );

  // Reported by an actions menu when it opens; freezes the highlight on the row that owns
  // it. Base UI keeps driving the keyboard highlight, so arrows and Enter inside the menu
  // are unaffected — only the pointer stops moving the row behind it.
  const [actionsOpen, setActionsOpen] = useState(false);
  // Only ever the last *real* highlight. Opening the menu blurs the list, which reports
  // `undefined` — so reading the live value at that moment would always come up empty.
  const lastHighlightedRef = useRef<unknown>(undefined);
  const panelHighlightRef = useRef<PanelHighlightHandler | null>(null);
  // Closing does *not* release the frozen row. Base UI restores its own highlight a frame
  // or two after focus returns to the list, and dropping ours the instant the menu closes
  // leaves that gap unlit — the highlight blinks off and back on the same row. The handover
  // happens below instead, when the real highlight actually arrives.
  const reportActionsOpen = useCallback((open: boolean) => {
    setActionsOpen(open);
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
              autoHighlight
              loopFocus={false}
              highlightItemOnHover={!actionsOpen}
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
                    "relative flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-(--duration-fast) before:absolute before:-inset-y-2 before:-left-2.5 before:w-9 before:rounded-sm before:content-[''] hover:text-foreground focus-visible:text-foreground",
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
            // Keep the top match ready so Enter runs it without an arrow press first.
            autoHighlight
            loopFocus={false}
            // Inert while an actions menu is open — see ActionsOpenContext.
            highlightItemOnHover={!actionsOpen}
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
                  className="flex shrink-0 items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground transition-colors duration-(--duration-fast) hover:bg-border"
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
              <div className="flex shrink-0 items-center gap-3 border-t border-border px-1.5 py-2">
                <Hint keys={["↑", "↓"]}>Navigate</Hint>
                <Hint keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>Select</Hint>
                <EscapeHint />
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

/**
 * The scrolling field area of a form panel. Pair it with `CommandPanelFooter`; use
 * `CommandPanelList` instead when the body contains navigable `CommandPanelRow`s:
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

/**
 * A custom-panel list backed by the same Base UI Autocomplete navigation as the main list.
 * Use it for `CommandPanelRow` children; the palette supplies the root and, when enabled,
 * the panel header input supplies the keyboard focus anchor.
 */
export function CommandPanelList({
  className,
  autoFocus = true,
  children,
}: {
  className?: string;
  /** Focus the list's hidden navigation input when there is no visible panel input field. */
  autoFocus?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      {autoFocus && (
        <Autocomplete.Input
          autoFocus
          aria-label="Navigate options"
          className="sr-only"
        />
      )}
      <Autocomplete.List
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5",
          SCROLLBAR,
          className,
        )}
      >
        {children}
      </Autocomplete.List>
    </>
  );
}

/**
 * The first-load state for a custom panel driven by `useCommandSearch` — centred exactly
 * like the root list's empty/loading region, since it stands in for the list when there's
 * nothing to show yet. Render it while a search is in flight *and* there are no results
 * yet (`searching && !results`); once results are on screen the panel header's inline
 * loader takes over, so the two never overlap. A plain block — the arrow keys step over it.
 */
export function CommandPanelLoading({
  children = "Searching…",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground",
        className,
      )}
    >
      <AsciiLoader className="text-sm text-subtle-foreground" />
      <span>{children}</span>
    </div>
  );
}

export interface CommandPanelRowProps
  extends Omit<ComponentProps<"div">, "children" | "onClick" | "onKeyDown"> {
  /** A stable value used by Base UI's keyboard navigation. Defaults to the row label. */
  value?: string;
  /** A leading icon rendered in the standard 16px palette icon slot. */
  icon?: ReactNode;
  /** Marks an irreversible row action; its label and icon use the destructive color. */
  destructive?: boolean;
  children?: ReactNode;
  /** Optional trailing content, typically a `Badge`, aligned with the checkbox slot. */
  badge?: ReactNode;
  /** Persistent selection state shown by the optional checkbox indicator. */
  selected?: boolean;
  /** Select the row when it is clicked or activated with Enter/Space. */
  onSelect?: () => void;
  /** Observe the activation event when a caller needs to distinguish keyboard activation. */
  onActivate?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Show a trailing checkbox indicator for the row's selection state. */
  checkbox?: boolean;
  onKeyDown?: ComponentProps<"div">["onKeyDown"];
}

/**
 * A list row for custom panel content.
 *
 * Its inset, row height, hover treatment and icon slot match the main command list. The
 * checkbox is intentionally presentational — the row owns selection, while the containing
 * `CommandPanelList` owns the shared arrow-key navigation and `selected` is the only
 * persistent state signal.
 */
export function CommandPanelRow({
  className,
  value,
  icon,
  destructive = false,
  children,
  badge,
  selected = false,
  onSelect,
  onActivate,
  checkbox = false,
  onKeyDown,
  ...props
}: CommandPanelRowProps) {
  const interactive = onSelect != null || onActivate != null;
  const itemValue = value ?? props.id ?? String(children ?? "");
  const frozen = useFrozen(itemValue);

  return (
    <Autocomplete.Item
      {...props}
      value={itemValue}
      aria-selected={interactive ? selected : undefined}
      onClick={interactive ? (event) => {
        onSelect?.();
        onActivate?.(event);
      } : undefined}
      onKeyDown={onKeyDown}
      // Paints the highlight this row would have if Base UI hadn't dropped it when the
      // actions menu took focus. Styled from the same pair of rules, so the two states are
      // indistinguishable rather than merely similar.
      data-frozen={frozen ? "" : undefined}
      className={cn(
        "group flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm text-muted-foreground outline-none select-none",
        badge ? "py-1.5" : "py-2",
        interactive ? "cursor-pointer" : "cursor-default",
        destructive
          ? "text-destructive data-highlighted:bg-muted data-highlighted:text-destructive data-frozen:bg-muted data-frozen:text-destructive"
          : "data-highlighted:bg-muted data-highlighted:text-foreground data-frozen:bg-muted data-frozen:text-foreground",
        className,
      )}
    >
      {icon && (
        <CommandIcon
          className={cn(
            destructive
              ? "text-destructive group-data-highlighted:text-destructive group-data-frozen:text-destructive"
              : "text-subtle-foreground group-data-highlighted:text-foreground group-data-frozen:text-foreground",
          )}
        >
          {icon}
        </CommandIcon>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {(badge || checkbox) && (
        <span className="ml-auto -mr-1 flex shrink-0 items-center gap-1.5">
          {badge && <span className="shrink-0">{badge}</span>}
          {checkbox && (
            <Checkbox
              size="sm"
              checked={selected}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none"
            />
          )}
        </span>
      )}
    </Autocomplete.Item>
  );
}

/** The action bar for a panel page — see `CommandPanelBody` for the expected structure. */
export interface CommandPanelFooterProps {
  className?: string;
  /**
   * The panel's primary action — the one Enter runs. Its key chip is always the return
   * glyph: the bar describes the keyboard rather than configuring it, and a footer claiming
   * some other key would be describing a binding the panel does not have.
   */
  enter?: {
    label: ReactNode;
    onClick?: () => void;
    /** `"submit"` submits the panel's form instead of calling `onClick`. @default "button" */
    type?: "button" | "submit";
    disabled?: boolean;
  };
  /** The contextual actions menu, opened with a fixed Cmd/Ctrl + J. */
  actions?: CommandPanelActionsProps;
}

/**
 * The footer of a custom panel: the escape hint on the left, and at most two things on the
 * right — the Enter action, then the actions menu.
 *
 * Both are named slots rather than children, and that is the point. An open footer grows a
 * different set of affordances on every panel, each with its own key chip, so the same
 * palette ends up teaching a different keyboard depending on how deep you have drilled. Two
 * slots with fixed chords mean the bar can only ever say "return" and "Cmd J", and both
 * always mean the same thing.
 *
 * The menu is rightmost so it hangs off the bottom-right corner as it opens upward.
 */
export function CommandPanelFooter({ className, enter, actions }: CommandPanelFooterProps) {
  return (
    <div
      className={cn(
        // Same px/py as the list's hint bar, so both footers are exactly the same height.
        "flex shrink-0 items-center justify-between gap-3 border-t border-border px-1.5 py-2 text-2xs",
        className,
      )}
    >
      <EscapeHint />
      <div className="flex items-center gap-2">
        {enter && (
          <FooterAction
            type={enter.type ?? "button"}
            onClick={enter.onClick}
            disabled={enter.disabled}
          >
            {enter.label}
            <span className="flex items-center gap-0.5">
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>
            </span>
          </FooterAction>
        )}
        {actions && <CommandPanelActions {...actions} />}
      </div>
    </div>
  );
}

export interface CommandPanelActionsProps {
  /** A flat list of contextual actions. Kept for the simple menu form. */
  items?: CommandItem[];
  /** Grouped contextual actions. Group headings become section labels in the menu. */
  groups?: CommandGroup[];
  /** Trigger label. @default "Actions" */
  label?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
}

/**
 * A palette *inside* the palette — the contextual action menu for a panel page.
 *
 * It's the Select with its in-panel search field, not a bespoke popup: `searchable` gives
 * the filter field, `width="content"` sizes the panel to its rows rather than the tiny
 * trigger, and `autoFocusFirstItem={false}` is the documented switch for menu-like uses.
 * Base UI owns the anchoring, the dismiss, and the collision flip — the menu hangs off a
 * trigger sitting in the footer, so `side="top"` opens it upward into the panel.
 *
 * Nothing stays selected: `value` is pinned to `null` and the choice is handled as an
 * action, which is the difference between a menu and a select. Pass `groups` to add
 * section labels; each action can also provide an icon, `destructive`, and an executable
 * `keybind` that works while this menu is closed.
 */
/** Rendered only by `CommandPanelFooter`'s `actions` slot — see its note on the two slots. */
function CommandPanelActions({
  items,
  groups,
  label = "Actions",
  searchPlaceholder = "Search actions…",
  emptyMessage = "No actions found.",
}: CommandPanelActionsProps) {
  const [open, setOpen] = useState(false);
  const reportActionsOpen = useContext(ActionsOpenContext);

  // Every open/close goes through here so the list behind the menu learns about it in the
  // same event, not from an effect a render later.
  //
  // Resolved against `open` rather than inside a `setOpen` updater. React runs updaters
  // while rendering, so telling the palette from in there is a setState during another
  // component's render — which React warns about, and which would make the freeze depend
  // on when React chose to re-run the updater.
  const setMenuOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(open) : next;
      setOpen(resolved);
      reportActionsOpen?.(resolved);
    },
    [open, reportActionsOpen],
  );

  // A panel can be torn down with its menu still open — stepping back, or the palette
  // closing under it — and the frozen highlight would outlive the thing that froze it.
  useEffect(() => () => reportActionsOpen?.(false), [reportActionsOpen]);

  const actionGroups = useMemo(
    () => groups ?? [{ items: items ?? [] }],
    [groups, items],
  );
  const actionItems = useMemo(
    () => actionGroups.flatMap((group) => group.items),
    [actionGroups],
  );

  // Rows that run or toggle in place register here; the rest keep the original path of
  // closing the menu and calling `onSelect`.
  // State, not a ref: it is handed to a provider during render, and a ref read there
  // is exactly what `react-hooks/refs` forbids. The Map is created once and mutated in
  // effects, so the identity is as stable as a ref's either way.
  const [rowHandlers] = useState(() => new Map<string, () => boolean>());
  // Set by the selection so the close request that follows it knows to stand down. Base UI
  // fires the value change first, which is the only reason a flag works here.
  const stayOpenRef = useRef(false);
  const rowScope = useMemo(() => ({ handlers: rowHandlers, menuOpen: open }), [rowHandlers, open]);

  const runAction = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      const handler = rowHandlers.get(item.id);
      // A handler that returns false has decided the menu should close after all — the
      // confirming press of a confirm row — so it falls through to the ordinary path.
      if (handler && handler()) {
        stayOpenRef.current = true;
        return;
      }
      setMenuOpen(false);
      item.onSelect?.();
    },
    [rowHandlers, setMenuOpen],
  );

  // Base UI closes a Select when an item is pressed. A row that reports its outcome in
  // place needs the menu to stay up, so that one close request is cancelled — the same
  // move the multi-selects make to survive a checkbox press.
  const handleOpenChange = useCallback(
    (next: boolean, details?: { reason?: string; cancel?: () => void }) => {
      if (!next && details?.reason === "item-press" && stayOpenRef.current) {
        stayOpenRef.current = false;
        details.cancel?.();
        return;
      }
      setMenuOpen(next);
    },
    [setMenuOpen],
  );

  // Action keybinds intentionally live on the actions component rather than the popup:
  // the containing custom panel owns them even while this menu is closed.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const action = actionItems.find((item) => {
        return item.keybind != null && matchesKeybind(item.keybind, event);
      });
      if (!action || action.disabled) return;

      event.preventDefault();
      event.stopPropagation();
      runAction(action);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [actionItems, runAction]);

  // Cmd/Ctrl + J, and fixed. Deliberately not `k` — that is the palette's own global toggle,
  // and one chord cannot mean both "close the palette" and "open this menu". Not
  // configurable either: the chord is printed on the trigger, so panels choosing their own
  // would have the footer teaching a different keyboard on every page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === ACTIONS_HOTKEY && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setMenuOpen((current) => !current);
      }
    };
    // Capture phase: once the menu is open, focus is inside the Select's popup, and
    // anything there that stops propagation would otherwise keep the chord from reaching
    // this listener — so the same chord could open the menu but never close it.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // `setMenuOpen` is memoised on a `useState` setter from context, so listing it here
    // doesn't churn the listener the way an inline callback would.
  }, [setMenuOpen]);

  return (
    <Select<string | null>
      open={open}
      onOpenChange={handleOpenChange}
      value={null}
      onValueChange={(id) => {
        const item = id == null ? undefined : actionItems.find((candidate) => candidate.id === id);
        if (item) runAction(item);
      }}
    >
      <SelectTrigger outline={false} chevron={false} className={cn(ACTION_CLASS, "h-auto")}>
        {label}
        <span className="flex items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>{ACTIONS_HOTKEY.toUpperCase()}</Kbd>
        </span>
      </SelectTrigger>
      <SelectContent
        // Opens upward off the footer and hangs from its right edge, so the panel grows
        // into the palette from the bottom-right corner. The search field sits at the
        // bottom, landing right next to the trigger it was opened from.
        side="top"
        align="end"
        width="content"
        searchable
        searchPosition="bottom"
        // The top action is highlighted the moment the menu opens, while the caret stays
        // in the search field — so Enter runs it without an arrow press first.
        autoFocusFirstItem
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        className="min-w-56"
      >
        <ActionRowContext.Provider value={rowScope}>
          <CommandActionSections groups={actionGroups} />
        </ActionRowContext.Provider>
      </SelectContent>
    </Select>
  );
}

/**
 * The grouped rows of `CommandPanelActions`, rendered inside the Select so they can read its
 * in-panel search state. A section heading is dropped when the filter hides every one of its
 * items — an always-on heading over an empty section reads as a bug — and the divider above a
 * heading is drawn only when a visible section actually precedes it, so filtering down to a
 * single section never leaves a stray top border.
 */
/** True when the row runs or toggles in place instead of choosing and closing. */
function staysOpen(item: CommandItem): boolean {
  return (
    item.action != null ||
    item.checked !== undefined ||
    item.defaultChecked !== undefined ||
    item.confirm != null
  );
}

/**
 * Lets a stay-open row hand its press handler to the menu that owns the selection, and
 * lets it see when that menu closes. A handler returns `true` to keep the menu open; a
 * confirm row returns `false` on the press that commits, so the menu closes down the same
 * path an ordinary row takes.
 */
interface ActionRowScope {
  handlers: Map<string, () => boolean>;
  menuOpen: boolean;
}

const ActionRowContext = createContext<ActionRowScope | null>(null);

/** How long a press is ignored after arming, so one double-click can't confirm. */
const DOUBLE_PRESS_GUARD = 350;

/**
 * One actions row, in whichever of the three shapes its item describes.
 *
 * They're the dropdown menu's three, expressed as data rather than children, because a
 * palette action *is* data — the caller passes `CommandItem`s, not JSX:
 *
 * - `action` alone — runs, confirms, reverts. `DropdownMenuActionItem`.
 * - `action` + `checked` — runs, then lands in the new state. `DropdownMenuCheckboxItem`
 *   with an `action`.
 * - `checked` alone — flips at once, morphing between the two. The `Morph` toggle.
 *
 * Neither of the last two shows a success tick: the row having *become* the other thing is
 * the confirmation, and a check on top of that would be a second one.
 */
function CommandActionRow({ item, end }: { item: CommandItem; end?: ReactNode }) {
  const scope = useContext(ActionRowContext);
  const menuOpen = scope?.menuOpen ?? false;
  const isToggle = item.checked !== undefined || item.defaultChecked !== undefined;
  const isControlled = item.checked !== undefined;
  const [uncontrolled, setUncontrolled] = useState(item.defaultChecked ?? false);
  const checked = isControlled ? item.checked! : uncontrolled;
  const target = !checked;

  const land = useCallback(() => {
    if (!isControlled) setUncontrolled(target);
    item.onCheckedChange?.(target);
  }, [isControlled, item, target]);

  const { status, run } = useAction({
    action: () => item.action?.(target),
    revertAfter: item.revertAfter,
    pendingDelay: item.pendingDelay,
    onSuccess: isToggle ? land : undefined,
  });

  // Arming is this row's own state: a confirm row is not "checked", it's waiting.
  const [armed, setArmed] = useState(false);
  const armedAt = useRef(0);

  // Standing down when the menu closes, adjusted during render — reopening a menu onto a
  // row still reading "Confirm?" would put a destructive press one click away with no
  // memory of having armed it.
  const [wasMenuOpen, setWasMenuOpen] = useState(menuOpen);
  if (wasMenuOpen !== menuOpen) {
    setWasMenuOpen(menuOpen);
    if (!menuOpen && armed) setArmed(false);
  }

  const resetAfter = item.confirm?.resetAfter ?? 3000;
  useEffect(() => {
    if (!armed || resetAfter <= 0) return;
    const timer = setTimeout(() => setArmed(false), resetAfter);
    return () => clearTimeout(timer);
  }, [armed, resetAfter]);

  /** Returns true when the menu should stay open. */
  const press = useCallback((): boolean => {
    if (item.confirm) {
      if (!armed) {
        armedAt.current = Date.now();
        setArmed(true);
        return true;
      }
      // A double-click shouldn't confirm what it only just armed.
      if (Date.now() - armedAt.current < DOUBLE_PRESS_GUARD) return true;
      setArmed(false);
      // Falls through to the ordinary path: the menu closes and `onSelect` runs.
      return false;
    }
    if (item.action) {
      void run();
      return true;
    }
    // No work to wait on: the morph toggle flips on the press itself.
    land();
    return true;
  }, [armed, item.action, item.confirm, land, run]);

  // Registered by id so the menu can route its selection here and leave itself open.
  useEffect(() => {
    const handlers = scope?.handlers;
    if (!handlers || !staysOpen(item)) return;
    handlers.set(item.id, press);
    return () => {
      handlers.delete(item.id);
    };
  }, [scope, item, press]);

  // A toggle's outcome is the new state, so `success` rests rather than confirming.
  const key = armed
    ? "armed"
    : status === "pending" || status === "error"
      ? status
      : !isToggle && status === "success"
        ? "success"
        : checked
          ? "on"
          : "off";

  // Memoised on the state they show, and that is load-bearing rather than an
  // optimisation: `SelectItem` registers its icon and label into the Select by identity,
  // so a freshly built element every render would set state every render — an unbounded
  // re-render loop rather than a slow one.
  const glyphNode = useMemo(() => {
    if (!item.icon && !isToggle && !item.action) return undefined;
    return (
      <Morph
        activeKey={key}
        items={{
          off: item.icon,
          on: item.icons?.checked ?? item.icon,
          pending: item.icons?.pending ?? <AsciiLoader />,
          success: item.icons?.success ?? <Check />,
          error: item.icons?.error ?? <TriangleAlert />,
          armed: item.confirm?.icon ?? item.icon,
        }}
      />
    );
  }, [item, isToggle, key]);

  const textNode = useMemo(
    () => (
      <Morph
        activeKey={key}
        className="place-items-start"
        items={{
          off: item.label,
          on: item.labels?.checked ?? item.label,
          pending: item.labels?.pending ?? item.label,
          success: item.labels?.success ?? item.label,
          error: item.labels?.error ?? item.label,
          armed: item.confirm?.label ?? "Confirm?",
        }}
      />
    ),
    [item, key],
  );

  return (
    <SelectItem
      // The row's *id*, not the item object. A consumer's `actionGroups` is normally a
      // memo over real dependencies, so toggling one of these rows rebuilds every item —
      // and an active row tracked by object identity would be stranded on the previous
      // object the moment its own action changed anything.
      value={item.id}
      // The filter matches the resting label, so a row doesn't fall out of the list
      // while it happens to read "Muting…".
      searchValue={item.label}
      icon={glyphNode}
      end={end}
      // Not disabled while pending, deliberately. A disabled row is skipped by the
      // roving highlight, so the list would move focus off the row the user just ran
      // and their next Enter would fire a different action. `useAction` already drops
      // a re-entrant press with a ref guard, which is the real protection; `aria-busy`
      // is what says it's working.
      disabled={item.disabled}
      aria-busy={status === "pending" || undefined}
      data-status={status}
      data-armed={armed || undefined}
      className={cn(
        "gap-2.5",
        item.destructive &&
          "text-destructive data-[highlighted]:text-destructive data-[panel-active]:text-destructive",
      )}
    >
      {textNode}
    </SelectItem>
  );
}

function CommandActionSections({ groups }: { groups: CommandGroup[] }) {
  const { matches } = useSelectSearch();
  // Worked out up front rather than by advancing a counter inside the map. A running
  // total reassigned from a render callback is a variable whose value depends on how many
  // times that callback happened to run, which React can make no promises about — so the
  // question each row actually asks ("is there a visible section above me?") is answered
  // from the list instead.
  const visibleSections = groups.map((group) => group.items.some((item) => matches(item.label)));
  const hasVisibleSectionAbove = visibleSections.map((_, index) =>
    visibleSections.slice(0, index).some(Boolean),
  );

  return (
    <>
      {groups.map((group, groupIndex) => {
        const hasVisibleItems = visibleSections[groupIndex] ?? false;
        const showHeading = Boolean(group.heading) && hasVisibleItems;
        const withDivider = showHeading && (hasVisibleSectionAbove[groupIndex] ?? false);

        return (
          <BaseSelect.Group key={`${group.heading ?? "group"}-${groupIndex}`}>
            {showHeading && (
              <BaseSelect.GroupLabel
                className={cn(
                  "px-2.5 pt-2 pb-1 text-xs font-medium text-subtle-foreground",
                  withDivider && "mt-1 border-t border-border",
                )}
              >
                {group.heading}
              </BaseSelect.GroupLabel>
            )}
            {group.items.map((item) => {
              const binding = item.keybind ?? item.shortcut;
              const end = item.badge || binding ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  {item.badge && <span className="shrink-0">{item.badge}</span>}
                  {binding && <CommandKeybindHint value={binding} />}
                </span>
              ) : undefined;

              return <CommandActionRow key={item.id} item={item} end={end} />;
            })}
          </BaseSelect.Group>
        );
      })}
    </>
  );
}

/**
 * Every footer affordance — the escape hint, the panel actions, the actions-menu trigger —
 * shares this, so the bar can't end up with two different-looking buttons.
 *
 * `py-1 -my-1` is the trick that lets a hover background exist without the bar growing:
 * the padding gives the highlight a box to fill, and the negative margin hands the height
 * back, so the key chip still sets the row height exactly as it does in a static hint.
 */
const ACTION_CLASS = cn(
  "flex cursor-pointer items-center gap-1.5 rounded-xs -my-1 px-1.5 py-1 text-2xs text-subtle-foreground",
  "outline-none transition-colors duration-(--duration-fast)",
  "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-50",
);

/** The actions menu's chord, fixed so the footer can print it and always be right. */
const ACTIONS_HOTKEY = "j";

const INERT_HINT_CLASS =
  "flex items-center gap-1 rounded-xs -my-1 px-1.5 py-1 text-2xs text-subtle-foreground";

/** A standard 16px icon slot for palette rows and custom panel content. */
export function CommandIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("flex size-4 shrink-0 items-center justify-center [&_svg]:size-4", className)}
      {...props}
    />
  );
}

/** Lets the footer parts drive the palette without threading props through the panel. */
interface PaletteControls {
  close: () => void;
  back: () => void;
  /** True whenever a page has been drilled into, so Escape means "back", not "close". */
  canGoBack: boolean;
}

const PaletteControlsContext = createContext<PaletteControls | null>(null);

/**
 * The escape affordance. Escape steps back out of a drilled-in page and only dismisses the
 * palette from the root, so the hint has to say which one it currently does.
 */
function EscapeHint() {
  const controls = useContext(PaletteControlsContext);
  if (!controls) return null;

  return controls.canGoBack ? (
    <Hint keys={["esc"]} onClick={controls.back}>
      Back
    </Hint>
  ) : (
    <Hint keys={["esc"]} onClick={controls.close}>
      Close
    </Hint>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className={cn(KBD, "flex min-w-4 items-center justify-center px-1")}>
      {children}
    </kbd>
  );
}

function CommandKeybindHint({ value }: { value: string }) {
  const parts = formatKeybind(value);
  if (parts.length === 0) return null;

  return (
    <span aria-label={value} className="flex shrink-0 items-center gap-0.5">
      {parts.map((part, index) => (
        <Kbd key={`${part}-${index}`}>{part}</Kbd>
      ))}
    </span>
  );
}

function Hint({
  keys,
  children,
  onClick,
}: {
  keys: ReactNode[];
  children: ReactNode;
  /** Given one, the hint becomes a real button that performs what it describes. */
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </span>
      {children}
    </>
  );

  // Without an action it's documentation (↑↓ Navigate has nothing to click), so it stays
  // an inert span rather than a button that lies about being pressable.
  if (!onClick) {
    return (
      <span className={INERT_HINT_CLASS}>{content}</span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(ACTION_CLASS, "gap-1")}>
      {content}
    </button>
  );
}

/**
 * The Enter slot's button. The palette is keyboard-first, so it reads as a hint with a key
 * chip ("Open" + return) rather than as a button: the label leads and the key trails,
 * mirroring the escape hint at the other end of the bar. Still a real `<button>`, so it
 * stays clickable and `type="submit"` submits the panel's form.
 *
 * Not exported. The footer is the only thing that may put something in that corner, and the
 * chip it draws is fixed.
 */
function FooterAction({ children, className, ...props }: ComponentProps<"button">) {
  return (
    <button className={cn(ACTION_CLASS, className)} {...props}>
      {children}
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
  const compactRow = Boolean(item.badge) && !item.description;
  const frozen = useFrozen(item);

  return (
    <Autocomplete.Item
      value={item}
      disabled={item.disabled}
      onClick={() => onRun(item)}
      // See CommandPanelRow: `data-frozen` stands in for the highlight Base UI drops when
      // an actions menu takes focus.
      data-frozen={frozen ? "" : undefined}
      // The highlight is Base UI's `data-highlighted` (keyboard *and* pointer land on the
      // same attribute), applied instantly with no transition so it keeps up with a fast
      // ↑↓ and doesn't smear across rows under the pointer.
      className={cn(
        "group flex min-h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-sm text-muted-foreground outline-none select-none",
        compactRow ? "py-1.5" : "py-2",
        item.destructive
          ? "data-highlighted:bg-muted text-destructive data-highlighted:text-destructive data-frozen:bg-muted data-frozen:text-destructive"
          : "data-highlighted:bg-muted data-highlighted:text-foreground data-frozen:bg-muted data-frozen:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
      )}
    >
      {item.icon && (
        <CommandIcon
          className={cn(
            item.destructive
              ? "text-destructive group-data-highlighted:text-destructive group-data-frozen:text-destructive"
              : "text-subtle-foreground group-data-highlighted:text-foreground group-data-frozen:text-foreground",
          )}
        >
          {item.icon}
        </CommandIcon>
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">
          {isCreate ? item.label : highlightLabel(item.label, positions)}
        </span>
        {item.description && (
          <span className="truncate text-xs text-subtle-foreground">{item.description}</span>
        )}
      </span>

      {(item.badge || hasChildren || item.shortcut) && (
        <span className="ml-auto flex shrink-0 items-center gap-2.5">
          {item.badge && <span className="shrink-0">{item.badge}</span>}
          {hasChildren ? (
            <ChevronRight
              className="size-4 shrink-0 text-subtle-foreground group-data-highlighted:text-foreground"
              aria-hidden
            />
          ) : (
            item.shortcut && (
              <Kbd>{item.shortcut}</Kbd>
            )
          )}
        </span>
      )}
    </Autocomplete.Item>
  );
}
