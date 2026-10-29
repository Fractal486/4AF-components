import { cn } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { SELECT_CLEAR_ACTION, SelectContext } from "./select.context";
import { SelectSeparator } from "./select.item";
import { FADE_EXIT, FADE_HIDDEN, FADE_SHOW, SIZE } from "./select.shared";
import { focusPanelOption } from "./select.utils";

/**
 * The active-item key for one caller-supplied footer button.
 *
 * Keyed by index rather than by a symbol per action so the mark survives a re-render that
 * rebuilds the array — a footer action is usually declared inline.
 */
const selectFooterAction = (index: number) => `select-footer-action:${String(index)}`;

/**
 * One button in a panel's footer row.
 *
 * A footer button is an action on the *selection*, not one more option to pick: Archive,
 * Clear, "Select all". It sits below the hairline in the same compact `xs` ghost style the
 * built-in clear uses, and it takes the panel's active mark on hover so the keyboard and
 * the pointer agree about what Enter would run.
 */
export interface SelectFooterAction {
  /** Stable across renders; also the React key. */
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** A trailing check, for an action that is also a state the selection is already in. */
  checked?: boolean;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Leave the panel open. By default running an action closes it, as picking a row does. */
  keepOpen?: boolean;
}

export function SelectContent({
  className,
  children,
  sideOffset = 6,
  side = "bottom",
  align: alignProp,
  width: widthProp,
  searchable = false,
  searchPosition = "top",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  autoFocusFirstItem = true,
  clearable = false,
  clearLabel = "Clear",
  clearIcon = <X />,
  footerActions,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> & {
  className?: string;
  children?: ReactNode;
  sideOffset?: number;
  /** Which side of the trigger to open on. Base UI still collision-flips from here. */
  side?: ComponentProps<typeof BaseSelect.Positioner>["side"];
  /**
   * Which trigger edge the panel lines up with. By default, the edge that holds still as the
   * trigger's text changes: `end` for a trigger pushed to the end of its row, `start`
   * otherwise. Read when the panel opens.
   */
  align?: ComponentProps<typeof BaseSelect.Positioner>["align"];
  /**
   * `trigger` keeps the panel the trigger's width (a default or ghost field select); `content`
   * sizes it to its own rows — the longest label plus the reserved check slot — and at least
   * 200px. When omitted, this follows the trigger: `plain` and `SelectSortTrigger` use
   * `content`, `default` and `ghost` use `trigger`.
   */
  width?: "trigger" | "content";
  /** Adds a plain filter field beside the list, separated from the options by a hairline. */
  searchable?: boolean;
  /**
   * Which end of the panel the filter field sits at. `bottom` suits a panel that opens
   * upward off a footer, where the field then lands next to the trigger it came from.
   */
  searchPosition?: "top" | "bottom";
  /** Placeholder for the optional panel filter field. */
  searchPlaceholder?: string;
  /** Message shown when a panel search has no matching options. */
  emptyMessage?: ReactNode;
  /**
   * Activate the current selection on open, or the most recent enabled selection in a
   * multi-select; otherwise activate the first enabled row. A query activates the first
   * enabled match. This is separate from search-field focus. Set false for menu-like uses.
   * @default true
   */
  autoFocusFirstItem?: boolean;
  /** A full-width, compact `xs` ghost footer button that resets the selection to none. */
  clearable?: boolean;
  /**
   * Buttons for the panel's footer row, laid out side by side and sharing its width.
   *
   * `clearable` is the shorthand for the commonest one and appends to these, so a panel
   * can offer its own actions and the built-in clear together.
   */
  footerActions?: readonly SelectFooterAction[];
  /** Text for the clear button. */
  clearLabel?: ReactNode;
  /** Glyph for the clear button. Pass `null` for a word on its own. */
  clearIcon?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const {
    open,
    setOpen,
    values,
    clear,
    size,
    hasVisibleItems,
    getOpeningItem,
    activeItem,
    setActiveItem,
    setPanelSearch,
    searchQuery,
    setSearchQuery,
    triggerSizing,
    panelEdge,
  } = useContext(SelectContext);
  const width = widthProp ?? (triggerSizing === "content" ? "content" : "trigger");
  const align = alignProp ?? panelEdge;
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Whether real focus on a row is something the reader asked for. In a searchable panel
  // the caret belongs in the field and the highlight is `data-panel-active`, so focus
  // arriving on a row is almost always the list moving under it — an option mounting or
  // unmounting as the query changes — and that silently swallows the rest of the word.
  // The arrow keys are the way it is meant, and they say so here.
  const rowFocusIntentRef = useRef(false);
  // A state node, not a ref: Base UI mounts the popup lazily, so on the first open the
  // positioner DOM doesn't exist yet when a ref-reading effect fires. A callback ref makes
  // the node's arrival a state change the measuring effect can depend on.
  const [positionerNode, setPositionerNode] = useState<HTMLDivElement | null>(null);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);

  // Derived during render, not from a post-render DOM query: `hasVisibleItems` is the same
  // predicate the items themselves hide on, so it's false exactly when nothing matches.
  // Computing it here means the list-hidden + empty-message swap happens in the *same* frame
  // as the filtering — an effect-set flag would flip a render late, giving one frame with an
  // empty (but not-yet-hidden) list. That extra frame is a second height change, and on the
  // upward-opening variant a late reposition paints the whole popup — search field and all —
  // one frame too high before it snaps down: the flash above the field.
  //
  // It is still one commit behind on *which* options exist. An item registers its
  // searchable text from the layout pass, so a row whose text tracks the query — "Create …"
  // over a filtered list — is briefly registered under the previous keystroke. Its own
  // `hidden` comes from current props and stays right; only this derived answer goes wrong,
  // and it flashed the empty state once per character typed. So wait for the registry to
  // catch up before believing it found nothing.
  //
  // The extra render that costs is the point, not an oversight: it is one per query change,
  // bounded by the query changing, and it is what keeps a settling list from being reported
  // as an empty one. A query that genuinely matches nothing registers nothing, so the latch
  // settles on the next commit either way and the empty state still arrives — just never
  // between keystrokes.
  //
  // A layout effect, so that next commit lands before the browser paints. The rows register
  // their text in layout effects too, so both updates go into one synchronous re-render and
  // the latch still sees the caught-up registry. As a passive effect the waiting commit was
  // painted: every row hidden, the message not yet shown, so the panel collapsed to its
  // search field for a frame and uncovered whatever lay beneath it.
  //
  // `null` until the first registration lands, which is also what keeps the panel from
  // opening on the empty state for a frame before its own options have announced
  // themselves. No real query can equal it.
  //
  // The answer is latched alongside the query, not just the query itself. Waiting only on
  // the query is right for *entering* the empty state and wrong for staying in it: every
  // further keystroke over an already-empty list made the latch stale again, so the panel
  // dropped the message, unhid an empty list and took it back on the next commit — a
  // height change per character, which on the upward-opening variant reads as the panel
  // flipping about under the caret. Holding the previous answer costs nothing, because a
  // row that registers late can only *add* a match, and that makes the question moot.
  const [settled, setSettled] = useState<{ query: string; empty: boolean } | null>(null);
  const nothingMatches = searchable && !hasVisibleItems;
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setSettled({ query: searchQuery, empty: !hasVisibleItems });
  }, [hasVisibleItems, searchQuery]);

  // Nothing to show covers both ways of having nothing: a query that ruled everything out,
  // and a panel with no options to begin with. They read the same to someone looking at it,
  // and a list area that is simply blank says less than a sentence does.
  const noResults =
    nothingMatches && (settled?.query === searchQuery || settled?.empty === true);

  useEffect(() => {
    setPanelSearch(searchable);
    return () => setPanelSearch(false);
  }, [searchable, setPanelSearch]);

  // Pin a content-width panel to its *unfiltered* width so an in-panel search can't resize
  // it while typing. `w-max` sizes to the widest visible row, so hiding rows would let the
  // panel narrow toward its longest remaining item; measuring the full set (query empty)
  // and holding it as a `min-width` floor keeps the panel the width it opened at.
  //
  // Runs only while the query is empty — the full set is on screen then — and stops once
  // typing begins, so it never captures a filtered (narrower) width. A `ResizeObserver`
  // rather than a one-shot read: on the *first* open Base UI's positioner hasn't been sized
  // by floating-ui yet when the effect fires, so an immediate `offsetWidth` reads 0. The
  // observer fires again once the panel gets its real width, and depending on `positionerNode`
  // means the effect also re-runs when the lazily-mounted popup first appears — the two
  // together are why the floor now sets on the first visit, not just the second. `offsetWidth`
  // is a layout metric, so the enter animation's `scale` doesn't distort it. Not cleared on
  // close: a stale-but-correct floor avoids a width jump during the exit blur, and the next
  // open re-measures (labels may have changed) as soon as its query resets to empty.
  useEffect(() => {
    if (!positionerNode || !open || !searchable || width !== "content") return;
    if (searchQuery.trim() !== "") return;

    const measure = () => {
      const measured = positionerNode.offsetWidth;
      if (measured) setLockedWidth((prev) => (prev === measured ? prev : measured));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(positionerNode);
    return () => observer.disconnect();
  }, [positionerNode, open, searchable, width, searchQuery]);

  const [openingItem, setOpeningItem] = useState<unknown>(undefined);
  useLayoutEffect(() => {
    if (!open) return;
    // Resolve after React has committed row insertion/reordering and item refs. Registration
    // order can change when labels or disabled props update; only DOM order is authoritative.
    setOpeningItem(getOpeningItem(listRef.current));
  }, [children, getOpeningItem, open]);

  // A panel never opens with nothing ready. It opens on the current selection, and on its
  // first row when there is none — see `openingItem`, which also moves to the new top row as
  // a query narrows the list rather than stranding the mark on a row the filter just hid.
  // Searchable panels keep DOM focus in their field but carry the same active-row state.
  useEffect(() => {
    if (!open || !autoFocusFirstItem) return;

    setActiveItem(openingItem);
    if (searchable || openingItem === undefined) return;

    // Focus follows the mark, because in a panel without a field focus *is* the highlight.
    const frame = requestAnimationFrame(() => {
      focusPanelOption(listRef.current, "active");
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirstItem, openingItem, open, searchable, setActiveItem]);

  // The caller's actions first, then the built-in clear: a shorthand belongs at the end
  // of what it was mixed into, and the clear is the one a reader expects last.
  const footerRow: Array<SelectFooterAction & { activeKey?: unknown }> = [
    ...(footerActions ?? []),
    ...(clearable
      ? [
          {
            key: "select-clear",
            label: clearLabel,
            icon: clearIcon,
            disabled: values.length === 0,
            onSelect: clear,
            // Keep the panel available for a replacement choice, including after a rejected clear.
            keepOpen: true,
            activeKey: SELECT_CLEAR_ACTION,
          } satisfies SelectFooterAction & { activeKey: unknown },
        ]
      : []),
  ];

  // Built once and placed at whichever end `searchPosition` names, so the two layouts
  // can't drift apart. The hairline goes on the side facing the options.
  const searchField = searchable ? (
    <div
      className={cn(
        "relative flex h-[38px] items-center px-3.5",
        searchPosition === "bottom" ? "border-t border-border" : "border-b border-border",
      )}
    >
      <Input
        ref={searchInputRef}
        aria-label="Search options"
        variant="plain"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            rowFocusIntentRef.current = true;
            focusPanelOption(listRef.current, event.key === "ArrowDown" ? "next" : "previous");
            return;
          }
          // Enter runs the row the panel is *showing* as active. The caret stays in the
          // field while a query narrows the list, so nothing in the list has DOM focus and
          // Base UI has no key target — the highlight would look armed and do nothing
          // until an arrow press moved real focus onto it. Reading the same
          // `data-panel-active` the row paints keeps the two from ever disagreeing.
          if (event.key === "Enter") {
            const active = listRef.current?.querySelector<HTMLElement>(
              '[role="option"][data-panel-active]:not([hidden]):not([aria-disabled="true"]):not([disabled])',
            );
            if (active) {
              event.preventDefault();
              active.click();
            }
            return;
          }
          // Keep Select's typeahead from treating input keystrokes as option jumps — but
          // only plain typing. A modifier chord is never typeahead, and swallowing it here
          // would stop app-level shortcuts (the chord that opened this panel, say) from
          // ever reaching their listener while the field has focus.
          if (event.key !== "Escape" && !event.metaKey && !event.ctrlKey) {
            event.stopPropagation();
          }
        }}
        placeholder={searchPlaceholder}
        className="h-full p-0"
      />
    </div>
  ) : null;

  return (
    <BaseSelect.Portal>
      {/* Base UI handles the positioning and collision flip; `--transform-origin` points
          at the trigger's edge, so the unfold grows *from* the trigger whichever side it
          lands on. */}
      <BaseSelect.Positioner
        data-slot="select-content-positioner"
        ref={setPositionerNode}
        sideOffset={sideOffset}
        align={align}
        alignItemWithTrigger={false}
        side={side}
        className={cn(
          "z-50 outline-none",
          // `trigger` keeps the panel the button's width (the default field select);
          // `content` sizes it to its own rows — the longest label plus the reserved check
          // slot — for a trigger sized to its own text, and never narrower than 200px.
          width === "trigger" ? "w-[var(--anchor-width)]" : "w-max min-w-50",
        )}
      >
        {/* The animation is driven off the `open` state, not Motion's mount: Base UI keeps
            the popup mounted in the DOM after the first open, so a mount-time
            `initial`/`animate` would only play once (the entrance would vanish on the 2nd
            open, until a reload remounted it). Animating on `open` re-runs it every time. */}
        <BaseSelect.Popup
          className={cn(
            // Same `border` as the trigger so the two edges match, plus the ring-less
            // overlay lift; the full shadow-overlay's hairline stacked on this border
            // read as a doubled, too-heavy edge.
            "overflow-hidden rounded-md border border-border bg-surface shadow-overlay-drop",
            className,
          )}
          render={
            <motion.div
              // The `min-width` floor lives on the popup — the visible bordered box — not
              // the positioner: the popup shrink-wraps its content, so when a search hides
              // the list (leaving only the empty message) the floor is what stops it
              // collapsing to that message's width. Content-width searchable panels only.
              style={{
                transformOrigin: "var(--transform-origin)",
                minWidth: width === "content" && lockedWidth ? lockedWidth : undefined,
              }}
              initial={reduceMotion ? { opacity: 0 } : FADE_HIDDEN}
              animate={
                reduceMotion
                  ? { opacity: open ? 1 : 0 }
                  : open
                    ? FADE_SHOW
                    : FADE_EXIT
              }
              transition={reduceMotion ? { duration: 0 } : { duration: duration.base, ease: ease.out }}
            />
          }
          // When a panel search filters everything out there's no option left to keep
          // active, so Base UI falls back to focusing the popup itself — which yanks the
          // caret out of the field mid-word. Bounce it straight back. Guarded on the popup
          // being the actual target, so focus landing on a child is left alone.
          onFocus={(event) => {
            if (searchable && event.target === event.currentTarget) {
              searchInputRef.current?.focus();
            }
          }}
          // The same rescue one level down. Base UI hands focus to a row when the list it
          // manages changes shape, which is what a filter does on every keystroke — and a
          // panel whose options come and go as the query narrows would otherwise take the
          // caret away mid-word. Focus a reader asked for is left alone.
          onFocusCapture={(event) => {
            if (!searchable) return;
            const input = searchInputRef.current;
            if (!input || event.target === input) return;
            if (rowFocusIntentRef.current) {
              rowFocusIntentRef.current = false;
              return;
            }
            // Only when the caret was in the field: focus moving from one row to the next
            // is Base UI's own list navigation, which is exactly what it should be doing.
            if (
              event.relatedTarget === input &&
              event.target instanceof HTMLElement &&
              event.target.closest('[role="option"]')
            ) {
              input.focus();
            }
          }}
          {...props}
        >
          {searchable && searchPosition === "top" && searchField}
          {/* Out of the tab order: the panel moves by arrow keys and scrolls its active row
              into view. */}
          <ScrollArea
            className={cn("max-h-[min(var(--available-height),18rem)]", noResults && "hidden")}
            viewportClassName="p-1"
            viewportProps={{ tabIndex: -1 }}
          >
            <BaseSelect.List ref={listRef}>{children}</BaseSelect.List>
          </ScrollArea>
          {noResults && (
            <div
              // One row tall, exactly: `m-1` mirrors the list's `p-1` and `py-1.5` is the
              // row's own vertical padding, so an empty panel and a panel holding a single
              // result come to the same height at every size. The shared row geometry keeps
              // the empty state aligned with the 24px/30px/34px control scale.
              className={cn(
                "m-1 flex items-center justify-center px-2.5 py-1.5 text-center text-muted-foreground",
                SIZE[size].row,
              )}
            >
              {emptyMessage}
            </div>
          )}
          {searchable && searchPosition === "bottom" && searchField}
          {footerRow.length > 0 && (
            <>
              {/* The separator sits outside the footer's padding so the list's bottom
                  inset and the footer's top inset do not stack with its list margins. */}
              <SelectSeparator className="mx-0 my-0 w-full" />
              {/* One button fills the row, as the clear always has; several share it
                  evenly, so a two-action footer reads as a pair rather than as a list. */}
              <div className="flex gap-1 p-1">
                {footerRow.map((action, index) => {
                  const key = action.activeKey ?? selectFooterAction(index);
                  return (
                    <Button
                      key={action.key}
                      variant="ghost"
                      size="xs"
                      data-panel-active={Object.is(activeItem, key) || undefined}
                      disabled={action.disabled}
                      onClick={(event) => {
                        action.onSelect(event);
                        if (!action.keepOpen) setOpen(false);
                      }}
                      onPointerMove={(event) => {
                        if (event.pointerType !== "mouse" || event.currentTarget.disabled) return;
                        setActiveItem(key);
                        // The mark is enough in a searchable panel: the caret belongs in
                        // the field, and taking focus here paints a focus ring on the
                        // button as well — the browser treats a programmatic focus as
                        // keyboard-driven when the last thing the reader did was type.
                        if (!searchable) event.currentTarget.focus({ preventScroll: true });
                      }}
                      // Flexible while the Button's xs size owns its compact geometry.
                      className="min-w-0 flex-1 rounded-xs px-2.5 data-[panel-active]:bg-muted data-[panel-active]:text-foreground"
                    >
                      {action.icon}
                      {action.label}
                      {action.checked ? <Check className="size-3.5 shrink-0" /> : null}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}
