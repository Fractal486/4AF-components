import { cn } from "@/registry/lib/cn";
import { useAction } from "@/registry/lib/use-action";
import { LoadingIndicator } from "@/registry/lib/loader";
import { Morph } from "@/registry/ui/morph/morph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  useSelectSearch,
} from "@/registry/ui/select/select";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, TriangleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ACTION_CLASS, CommandKeybindHint, Kbd } from "./command-palette.chrome";
import { ActionsOpenContext } from "./command-palette.context";
import { matchesKeybind } from "./command-palette.keybinds";
import type { CommandGroup, CommandItem, CommandPanelActionsProps } from "./command-palette.types";

/**
 * A palette *inside* the palette — the contextual action menu for a panel page.
 *
 * It's the Select with its in-panel search field, not a bespoke popup: `searchable` gives
 * the filter field, `width="content"` sizes the panel to its rows (at least 200px) rather
 * than the tiny trigger, and `autoFocusFirstItem` activates the first row while keeping
 * the caret in the search field, so Enter can run an action immediately.
 * Base UI owns the anchoring, the dismiss, and the collision flip — the menu hangs off a
 * trigger sitting in the footer, so `side="top"` opens it upward into the panel.
 *
 * Nothing stays selected: `value` is pinned to `null` and the choice is handled as an
 * action, which is the difference between a menu and a select. Pass `groups` to add
 * section labels; each action can also provide an icon, `destructive`, and an executable
 * `keybind` that works while this menu is closed.
 */
/** Rendered only by `CommandPanelFooter`'s `actions` slot — see its note on the two slots. */
export function CommandPanelActions({
  items,
  groups,
  label = "Actions",
  searchPlaceholder = "Search actions…",
  emptyMessage = "No actions found.",
}: CommandPanelActionsProps) {
  const [open, setOpen] = useState(false);
  const reportActionsOpen = useContext(ActionsOpenContext);
  const pendingActionRef = useRef<string | null>(null);
  const stayOpenRef = useRef(false);

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
      if (!resolved) {
        pendingActionRef.current = null;
        stayOpenRef.current = false;
      }
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
  const runAction = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      const handler = rowHandlers.get(item.id);
      // Stateful rows mount with the popup. Open it first, then let registration deliver
      // this press: a missing handler must never bypass confirmation or drop an action.
      if (staysOpen(item) && (!open || !handler)) {
        pendingActionRef.current = item.id;
        setMenuOpen(true);
        return;
      }
      // A handler that returns false has decided the menu should close after all — the
      // confirming press of a confirm row — so it falls through to the ordinary path.
      if (handler && handler()) {
        stayOpenRef.current = true;
        return;
      }
      setMenuOpen(false);
      item.onSelect?.();
    },
    [open, rowHandlers, setMenuOpen],
  );

  const registerHandler = useCallback((item: CommandItem, handler: () => boolean) => {
    rowHandlers.set(item.id, handler);
    if (open && pendingActionRef.current === item.id) {
      pendingActionRef.current = null;
      runAction(item);
    }
    return () => {
      if (rowHandlers.get(item.id) === handler) rowHandlers.delete(item.id);
    };
  }, [open, rowHandlers, runAction]);
  const rowScope = useMemo(() => ({ registerHandler, menuOpen: open }), [registerHandler, open]);

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
          <Kbd>Ctrl/⌘</Kbd>
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
  registerHandler: (item: CommandItem, handler: () => boolean) => () => void;
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
    if (!scope || !staysOpen(item)) return;
    return scope.registerHandler(item, press);
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
          pending: item.icons?.pending ?? <LoadingIndicator loader={item.loader} />,
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

/** The actions menu's chord, fixed so the footer can print it and always be right. */
const ACTIONS_HOTKEY = "j";
