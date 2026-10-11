import { cn } from "@/registry/lib/cn";
import { LoadingIndicator } from "@/registry/lib/loader";
import { useMergedRefs } from "@/registry/lib/refs";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { ChevronRight, CornerDownLeft } from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CommandPanelActions } from "./command-palette.actions";
import {
  CommandIcon,
  EscapeHint,
  FooterAction,
  Kbd,
  SCROLLBAR,
  snapFirstRowToTop,
} from "./command-palette.chrome";
import { useFrozen } from "./command-palette.context";
import { CREATE_ID, fuzzyMatch } from "./command-palette.search";
import type {
  CommandItem,
  CommandPanelFooterProps,
  CommandPanelRowProps,
} from "./command-palette.types";

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

/**
 * The scrolling field area of a form panel. Pair it with `CommandPanelFooter`; use
 * `CommandPanelList` instead when the body contains navigable `CommandPanelRow`s:
 *
 *   <form className="flex min-h-0 flex-1 flex-col" onSubmit={…}>
 *     <CommandPanelBody className="flex flex-col gap-4">…fields…</CommandPanelBody>
 *     <CommandPanelFooter enter={{ label: "Save", type: "submit" }} />
 *   </form>
 *
 * The split is what lets the footer be a plain sibling of the scroll area instead of
 * `sticky` inside it. Sticky is clamped to its containing block, so a footer inside a
 * padded scroll container can never reach the bottom edge — it strands the container's
 * bottom padding under the bar. Keeping both inside the `<form>` means `type="submit"`
 * and Enter still submit natively, with no `form="id"` plumbing.
 */
export function CommandPanelBody({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-4", SCROLLBAR, className)}
      {...props}
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
  const listRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRefs<HTMLDivElement>(listRef, snapFirstRowToTop);

  // The panel root runs `mode="none"` with no `items` collection, so Base UI's
  // `autoHighlight` has nothing to pick a first row from — a panel opened with the header
  // field focused sat with no row ready, and the first arrow press was spent lighting one up
  // rather than moving. Rows register in the DOM, so prime off that instead, using the same
  // channel a press uses. No dependency array: rows come and go as a panel's query filters
  // them, and the guard means this only acts when the panel has no highlight at all.
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.querySelector("[data-highlighted]")) return;

    const first = list.querySelector<HTMLElement>('[role="option"]');
    if (first) dispatchSelectionMove(first);
  });

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
        ref={ref}
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
  loader,
}: {
  children?: ReactNode;
  className?: string;
  loader?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground",
        className,
      )}
    >
      <LoadingIndicator loader={loader} className="text-sm text-subtle-foreground" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Lets the pointer *press* a row into the selection without letting it *hover* one there.
 *
 * `Autocomplete` is `aria-activedescendant` driven — no row is ever focused — so the only
 * route from the pointer to the selection is the item's own `mousemove`, which Base UI gates
 * behind `highlightItemOnHover`. That gate is all-or-nothing, and both settings are wrong for
 * a palette: on, and sweeping the cursor across the list quietly reassigns what Enter runs;
 * off, and clicking a row doesn't select it either, which strands the selection on the first
 * row of any panel that stays open after a press — a checkbox list, most visibly.
 *
 * So the gate stays open and the events are filtered instead. Hover's `mousemove` is stopped
 * in the capture phase, before Base UI's handler on the same element can see it (React's
 * `stopPropagation` stops the native event at the root container, so the bubble pass never
 * runs). A press then dispatches one `mousemove` of its own and waves it through. Base UI
 * resolves that exactly as it would a real one — `listRef.indexOf(event.currentTarget)` — so
 * the row pressed is the row selected, and there is no second highlight state to keep in sync
 * with the one Enter actually reads.
 */
let passingSyntheticMove = false;

/**
 * Hands Base UI a row to resolve as highlighted, through the one channel it listens on.
 *
 * Module scope rather than a per-row ref because the priming below dispatches onto a row it
 * does not own. The dispatch is synchronous, so the flag is only ever set across the single
 * handler it is meant to wave through.
 */
function dispatchSelectionMove(row: HTMLElement) {
  passingSyntheticMove = true;
  row.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  passingSyntheticMove = false;
}

function usePointerSelection() {
  return useMemo(
    () => ({
      onMouseMoveCapture(event: ReactMouseEvent<HTMLElement>) {
        if (passingSyntheticMove) return;
        event.stopPropagation();
      },
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        dispatchSelectionMove(event.currentTarget);
      },
    }),
    [],
  );
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
  const pointerSelection = usePointerSelection();

  return (
    <Autocomplete.Item
      {...props}
      // Hover paints; a press selects. See `usePointerSelection`. The row owns both handlers,
      // which is why they are omitted from its props.
      {...pointerSelection}
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
        // Hover is a fill at half strength and nothing else: no text lift, so it cannot be
        // mistaken for the selection. Scoped out of the selected and frozen states so the two
        // never compete for the same row.
        interactive && "not-data-highlighted:not-data-frozen:hover:bg-muted/50",
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

export function CommandRow({
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
  const pointerSelection = usePointerSelection();

  return (
    <Autocomplete.Item
      value={item}
      disabled={item.disabled}
      onClick={() => onRun(item)}
      // Hover paints; a press selects. See `usePointerSelection`.
      {...pointerSelection}
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
        // Hover is a fill at half strength and nothing else: no text lift, so it cannot be
        // mistaken for the selection. Scoped out of the selected and frozen states so the two
        // never compete for the same row.
        "not-data-highlighted:not-data-frozen:hover:bg-muted/50",
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
