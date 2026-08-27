"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronRight, TriangleAlert } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Morph } from "@/registry/ui/morph/morph";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";

/**
 * A dropdown menu.
 *
 * Behaviour is Base UI's Menu: keyboard navigation and typeahead, focus into the list and
 * back to the trigger, collision-aware placement, submenus, checkbox and radio items with
 * real roles, and dismissal — none of which a hand-rolled menu gets right.
 *
 * The row highlight is a plain `data-[highlighted]` background with no transition — it has
 * to keep up with arrow-key navigation, and a sliding or fading highlight lags a keypress
 * behind, which reads as lag rather than polish. What *does* animate: the panel enter (a
 * scale-and-blur from the trigger edge off `data-starting-style`, like the popover), and a
 * checkbox tick that draws itself in and blurs out via `Morph` — those are state changes
 * you act on occasionally, not every arrow key.
 */

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

type DropdownMenuSelectValue<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value | null;

interface DropdownMenuSelectContextValue {
  disabled: boolean;
  multiple: boolean;
  values: unknown[];
  open: boolean;
  setOpen: (open: boolean) => void;
  selectSingle: (value: unknown) => void;
  toggleValue: (value: unknown, checked: boolean) => void;
  registerLabel: (value: unknown, label: ReactNode) => void;
  unregisterLabel: (value: unknown) => void;
  labelFor: (value: unknown) => ReactNode | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchesQuery: (text: string) => boolean;
  registerOptionText: (value: unknown, text: string) => void;
  unregisterOptionText: (value: unknown) => void;
  visibleOptionCount: number;
}

const DropdownMenuSelectContext = createContext<DropdownMenuSelectContextValue | null>(null);

function useDropdownMenuSelectContext() {
  const context = useContext(DropdownMenuSelectContext);

  if (!context) {
    throw new Error(
      "DropdownMenuSelectTrigger, DropdownMenuSelectContent, and DropdownMenuSelectItem must be used inside DropdownMenuSelect.",
    );
  }

  return context;
}

export interface DropdownMenuSelectProps<Value, Multiple extends boolean | undefined = false> {
  children: ReactNode;
  multiple?: Multiple;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  value?: DropdownMenuSelectValue<Value, Multiple>;
  defaultValue?: DropdownMenuSelectValue<Value, Multiple>;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: DropdownMenuSelectValue<Value, Multiple>) => void;
}

/**
 * A select panel that participates in the dropdown's real submenu tree.
 *
 * Using the menu submenu primitive here is important: it gives the nested select the same
 * safe hover path as every other submenu, so moving from the row to the panel doesn't close
 * it while the pointer crosses the gap.
 */
export function DropdownMenuSelect<Value, Multiple extends boolean | undefined = false>({
  children,
  multiple,
  disabled = false,
  open,
  defaultOpen = false,
  value,
  defaultValue,
  onOpenChange,
  onValueChange,
}: DropdownMenuSelectProps<Value, Multiple>) {
  const isMultiple = Boolean(multiple);
  const isValueControlled = value !== undefined;
  const isOpenControlled = open !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<Value | Value[] | null>(
    () => (defaultValue ?? (isMultiple ? [] : null)) as Value | Value[] | null,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const currentValue = isValueControlled ? value : uncontrolledValue;
  const currentOpen = isOpenControlled ? open : uncontrolledOpen;
  const [searchQuery, setSearchQuery] = useState("");
  const values = useMemo<unknown[]>(
    () =>
      isMultiple
        ? Array.isArray(currentValue)
          ? currentValue
          : []
        : currentValue == null
          ? []
          : [currentValue],
    [currentValue, isMultiple],
  );

  // Opening the panel always starts from the full set of choices. Adjusted during render
  // rather than in an effect: nothing external is being synchronised, so an effect would
  // just paint the stale query for a frame and then schedule a second render.
  const [wasOpen, setWasOpen] = useState(currentOpen);
  if (wasOpen !== currentOpen) {
    setWasOpen(currentOpen);
    if (currentOpen) setSearchQuery("");
  }

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  const setSelection = useCallback(
    (nextValue: Value | Value[] | null) => {
      if (!isValueControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue as DropdownMenuSelectValue<Value, Multiple>);
    },
    [isValueControlled, onValueChange],
  );

  const selectSingle = useCallback(
    (nextValue: unknown) => {
      setSelection(nextValue as Value);
      setOpen(false);
    },
    [setOpen, setSelection],
  );

  const toggleValue = useCallback(
    (nextValue: unknown, checked: boolean) => {
      const nextValues = checked
        ? [...values, nextValue]
        : values.filter((current) => !Object.is(current, nextValue));
      setSelection(nextValues as Value[]);
    },
    [setSelection, values],
  );

  const [labels, setLabels] = useState<Map<unknown, ReactNode>>(() => new Map());
  const registerLabel = useCallback((valueToRegister: unknown, label: ReactNode) => {
    setLabels((current) => {
      if (Object.is(current.get(valueToRegister), label)) return current;
      return new Map(current).set(valueToRegister, label);
    });
  }, []);
  const unregisterLabel = useCallback((valueToUnregister: unknown) => {
    setLabels((current) => {
      if (!current.has(valueToUnregister)) return current;
      const next = new Map(current);
      next.delete(valueToUnregister);
      return next;
    });
  }, []);
  const labelFor = useCallback((valueToRead: unknown) => labels.get(valueToRead), [labels]);

  const [optionTexts, setOptionTexts] = useState<Map<unknown, string>>(() => new Map());
  const registerOptionText = useCallback((valueToRegister: unknown, text: string) => {
    setOptionTexts((current) => {
      if (current.get(valueToRegister) === text) return current;
      return new Map(current).set(valueToRegister, text);
    });
  }, []);
  const unregisterOptionText = useCallback((valueToUnregister: unknown) => {
    setOptionTexts((current) => {
      if (!current.has(valueToUnregister)) return current;
      const next = new Map(current);
      next.delete(valueToUnregister);
      return next;
    });
  }, []);
  const matchesQuery = useCallback(
    (text: string) => {
      const query = searchQuery.trim().toLocaleLowerCase();
      return query === "" || text.toLocaleLowerCase().includes(query);
    },
    [searchQuery],
  );
  const visibleOptionCount = useMemo(
    () => Array.from(optionTexts.values()).filter(matchesQuery).length,
    [matchesQuery, optionTexts],
  );

  const context = useMemo<DropdownMenuSelectContextValue>(
    () => ({
      disabled,
      multiple: isMultiple,
      values,
      open: currentOpen,
      setOpen,
      selectSingle,
      toggleValue,
      registerLabel,
      unregisterLabel,
      labelFor,
      searchQuery,
      setSearchQuery,
      matchesQuery,
      registerOptionText,
      unregisterOptionText,
      visibleOptionCount,
    }),
    [
      currentOpen,
      disabled,
      isMultiple,
      labelFor,
      matchesQuery,
      registerLabel,
      registerOptionText,
      selectSingle,
      setOpen,
      searchQuery,
      setSearchQuery,
      toggleValue,
      unregisterLabel,
      unregisterOptionText,
      visibleOptionCount,
      values,
    ],
  );

  return (
    <DropdownMenuSelectContext.Provider value={context}>
      <DropdownMenuSub open={currentOpen} onOpenChange={setOpen} disabled={disabled}>
        {children}
      </DropdownMenuSub>
    </DropdownMenuSelectContext.Provider>
  );
}

const itemBase = cn(
  // Compact rows: 12px text and 14px glyphs, a denser treatment than the 14px overlays.
  "relative flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-foreground outline-none select-none",
  // Instant — no transition, so the highlight tracks the keyboard rather than trailing it.
  "data-[highlighted]:bg-muted data-[popup-open]:bg-muted",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  // Size/inert every glyph, but only mute the *leading* icons (direct children) — the
  // nested check/dot indicators keep the item's foreground ink.
  "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&>svg]:text-muted-foreground",
  // A morphing icon is a leading icon too, and the rule above misses it: `Morph` wraps
  // its content in a span, so the glyph is a grandchild and inherits the row's full-ink
  // `text-foreground` instead — one row's icon brighter than every other row's, for no
  // reason the user could name. Matching through a direct-child Morph puts it back.
  //
  // Still scoped to direct children, so the check and dot indicators are untouched: both
  // sit inside an absolutely positioned span, and they're meant to read at full ink.
  "[&>[data-slot=morph]_svg]:text-muted-foreground",
  // A Morph reserves the width of its widest state and centres inside it, which is right
  // for a button and wrong for a label here: in a left-aligned row the shorter label
  // would sit indented, so a toggling item looks misaligned in one state only.
  //
  // Direct children only, and that scoping is load-bearing. A Morph swapping *glyphs* in
  // a fixed icon slot must stay centred — the ASCII loader is a narrow character next to
  // 14px icons, and start-aligning it inside the slot they share drags it left of every
  // other row's icon. Labels are written inline as direct children; glyph Morphs are
  // wrapped in their slot, one level down, and keep Morph's own centring.
  "[&>[data-slot=morph]]:place-items-start",
);

/**
 * The tick/dot slot, and it holds the same 14px box a leading icon does — `left-2.5` and
 * `size-3.5` against the row's `px-2.5` padding, so both run 10px to 24px and share a
 * centre.
 *
 * It used to be `left-2 size-4`: 8px to 24px. The two boxes shared a right edge but not a
 * centre, so a ticked row's glyph sat a pixel left of an icon row's, which is exactly the
 * kind of drift you can see in a column of rows and can't name. The labels were always
 * fine — the row's `pl-8` is 10 + 14 + 8 — so only the glyph column was off.
 */
const INDICATOR_SLOT =
  "pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center";

const selectItemBase = cn(
  "relative flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-xs outline-none select-none",
  "text-muted-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
  "data-[checked]:text-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
);

const selectItemIcon =
  "pointer-events-none flex size-3.5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

function DisabledReasonTooltip({
  disabled,
  reason,
  children,
}: {
  disabled?: boolean;
  reason?: ReactNode;
  children: ReactElement;
}) {
  if (!disabled || reason == null || reason === "") return children;

  return (
    <Tooltip content={reason} side="right" sideOffset={6} delay={0}>
      {children}
    </Tooltip>
  );
}

function focusDropdownMenuSelectItem(
  list: HTMLElement | null,
  direction: "next" | "previous",
) {
  if (!list) return;

  const items = Array.from(
    list.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitemcheckbox"]'),
  ).filter(
    (item) =>
      !item.hidden &&
      !item.closest("[hidden]") &&
      item.getAttribute("aria-disabled") !== "true",
  );
  const item = direction === "next" ? items[0] : items.at(-1);
  item?.focus();
}

const popupClassName = cn(
  // Same floating-panel material as the Select/Popover panels.
  "z-50 max-h-[var(--available-height)] min-w-[9rem] overflow-y-auto rounded-md border border-border bg-surface p-1 text-foreground shadow-overlay-drop outline-none",
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
  // Scale-and-blur enter from the trigger edge; only these properties change, so only
  // these are named. Base UI unmounts on transitionend, which fires because it's set.
  //
  // The Select family's numbers exactly — 0.95 and 3px in, 0.97 and 2px out, over
  // `--duration-base`. A menu and a select panel are the same object to a user: a list of
  // choices hanging off a control, often sat next to each other in the same toolbar. Two
  // lists that open at different speeds is a difference you feel without being able to name.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
);

export interface DropdownMenuContentProps
  extends Omit<ComponentProps<typeof BaseMenu.Popup>, "className"> {
  className?: string;
  side?: ComponentProps<typeof BaseMenu.Positioner>["side"];
  align?: ComponentProps<typeof BaseMenu.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
  /** Keep the popup mounted while closed when its contents need to register state early. */
  keepMounted?: boolean;
}

export function DropdownMenuContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  keepMounted = false,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <BaseMenu.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface DropdownMenuItemProps extends ComponentProps<typeof BaseMenu.Item> {
  variant?: "default" | "destructive";
  inset?: boolean;
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuItem({
  className,
  variant = "default",
  inset,
  children,
  disabled,
  disabledReason,
  ...props
}: DropdownMenuItemProps) {
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const item = (
    <BaseMenu.Item
      className={cn(
        itemBase,
        inset && "pl-8",
        hasReason && "data-[disabled]:pointer-events-auto",
        // Red ink only — the highlight stays the same neutral wash as any other row.
        variant === "destructive" && "text-destructive [&>svg]:text-destructive",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  );

  return (
    <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}

export interface DropdownMenuActionItemProps
  extends Omit<DropdownMenuItemProps, "onClick" | "children"> {
  /** The work. Return a promise and the row waits for it. */
  action: () => void | Promise<unknown>;
  /** The resting label. */
  children?: ReactNode;
  /** The resting glyph. */
  icon?: ReactNode;
  /** Labels per state. Each falls back to the resting label. */
  labels?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /** Glyphs per state. Default to the spinner, a check, and the warning triangle. */
  icons?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /** How long the outcome holds before the row returns to idle, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold back `pending` for this long, so a near-instant action doesn't flash a
      spinner on its way to the check. @default 0 */
  pendingDelay?: number;
  /** Announced to screen readers. A state change they can't see is one they don't know
      about — and in a menu the row may be the only thing that changed. */
  announce?: { pending?: string; success?: string; error?: string };
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * A row that runs something, shows how it went, and puts itself back — the menu's
 * ActionButton. "Copy link" becoming "Copied" with a check for a beat is the whole case.
 *
 * It defaults to `closeOnClick={false}`, which is the part that's easy to miss: a menu
 * row closes the menu on click, so an outcome shown on a row the user can no longer see
 * is no outcome at all. Pass `closeOnClick` explicitly to override that — worth doing for
 * an action whose result is visible on the page behind the menu.
 *
 * The state machine is `useAction`, shared with ActionButton, so a copy row and a copy
 * button behave identically: the same double-submit guard, the same revert clock, the
 * same refusal to render a failure as a success.
 */
export function DropdownMenuActionItem({
  action,
  children,
  icon,
  labels,
  icons,
  revertAfter,
  pendingDelay,
  announce,
  closeOnClick = false,
  disabled,
  onSuccess,
  onError,
  ...props
}: DropdownMenuActionItemProps) {
  const { status, run } = useAction({
    action,
    revertAfter,
    pendingDelay,
    onSuccess,
    onError,
  });

  const label = (override: ReactNode | undefined) => override ?? children;
  const glyph = (override: ReactNode | undefined, fallback: ReactNode) => override ?? fallback;

  return (
    <>
      <DropdownMenuItem
        closeOnClick={closeOnClick}
        onClick={run}
        // Not disabled while pending: a disabled item is skipped by the menu's roving
        // highlight, which would move focus off the row that is running. `useAction`'s ref
        // guard already refuses a re-entrant press.
        disabled={disabled}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        {...props}
      >
        {/* The glyph gets the same 14px box a plain row icon occupies, and the Morph
            centres inside it. Without the box the loader — one narrow character against
            three 14px icons — would sit wherever its own advance width put it, which is
            not where the icon above it in the menu sits. The muting is here rather than
            from `itemBase`, whose rule reaches a direct-child Morph and this one is a
            level down. */}
        <span className="flex size-3.5 shrink-0 items-center justify-center text-muted-foreground">
          {/* Every state at once, so the slot never resizes as it moves through them. */}
          <Morph
            activeKey={status}
            items={{
              idle: icon,
              pending: glyph(icons?.pending, <AsciiLoader />),
              success: glyph(icons?.success, <Check />),
              error: glyph(icons?.error, <TriangleAlert />),
            }}
          />
        </span>
        <Morph
          activeKey={status}
          items={{
            idle: children,
            pending: label(labels?.pending),
            success: label(labels?.success),
            error: label(labels?.error),
          }}
        />
      </DropdownMenuItem>

      {/* Politely, so it waits for a pause rather than interrupting — and outside the row,
          because a menu item's accessible name is built from its contents and an sr-only
          status in there would rename it to "Copy link Working" while it ran. */}
      <span aria-live="polite" className="sr-only">
        {status === "pending" && (announce?.pending ?? "Working")}
        {status === "success" && (announce?.success ?? "Done")}
        {status === "error" && (announce?.error ?? "Something went wrong")}
      </span>
    </>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends Omit<ComponentProps<typeof BaseMenu.CheckboxItem>, "render" | "children"> {
  /**
   * `children` may be a function of the checked state — return a different icon and label
   * for each, so a `menuitemcheckbox` can read as a toggle button (Bookmark ⇄ Bookmarked)
   * rather than a ticked row.
   *
   * It's also handed the action status, which only moves off `"idle"` when there's an
   * `action`. With `indicator={false}` there's no tick slot to put the loader in, so a
   * deferred row has to show the wait itself.
   */
  children?: ReactNode | ((checked: boolean, status: ActionStatus) => ReactNode);
  /**
   * The built-in left tick and its `pl-8` indent. Turn it off when the toggle state is
   * carried by the label/icon instead (the bookmark case).
   */
  indicator?: boolean;
  /**
   * Fill the item's icon when checked instead of morphing it — the same glyph, only its
   * weight changing (bookmark, star, heart). It's a `fill` transition on the one element
   * (no swap), which is the honest choice when there's nothing to morph *to*. This is the
   * Toggle's `fillIcon`. Pair with `indicator={false}` so the fill *is* the state.
   */
  fillIcon?: boolean;
  /**
   * Make the check conditional on work that has to succeed first — a setting that isn't
   * on until the server says so. It's handed the state being moved *to*.
   *
   * Without it the row is what it has always been: a synchronous checkbox that flips on
   * click. With it the row defers — the tick holds, the loader runs in its place, and
   * `onCheckedChange` fires only once the action has settled. A failure needs no rollback
   * because nothing moved; it shows briefly and the row goes quiet.
   *
   * This is `ActionToggle` for a menu row, and it works the same way for the same reason:
   * a row that already shows a tick while a spinner insists it's still working is telling
   * the user two things at once, and one of them is a guess.
   */
  action?: (checked: boolean) => void | Promise<unknown>;
  /** How long a failure is shown before the row goes quiet, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold back the loader for this long, so a near-instant action doesn't flash it.
      @default 0 */
  pendingDelay?: number;
  /** Announced while deferred. `aria-checked` covers the landing; the wait and the
      failure are otherwise silent. */
  announce?: { pending?: string; error?: string };
  onError?: (error: unknown) => void;
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  indicator = true,
  fillIcon = false,
  action,
  checked,
  defaultChecked,
  onCheckedChange,
  revertAfter,
  pendingDelay,
  announce,
  disabled,
  disabledReason,
  onError,
  ...props
}: DropdownMenuCheckboxItemProps) {
  const deferred = action !== undefined;
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const [uncontrolled, setUncontrolled] = useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const current = isControlled ? checked : uncontrolled;
  const target = !current;

  const { status, run } = useAction({
    action: () => action?.(target),
    revertAfter,
    pendingDelay,
    onSuccess: () => {
      if (!isControlled) setUncontrolled(target);
      // Base UI hands its own callback an event details object. This change came from a
      // promise settling rather than from an event, so there is nothing truthful to pass.
      (onCheckedChange as ((next: boolean, details?: never) => void) | undefined)?.(target);
    },
    onError,
  });

  // Untouched when there's no `action`: the consumer's own checked/onCheckedChange go
  // straight to Base UI and the row stays the synchronous checkbox it always was.
  const control = deferred
    ? {
        checked: current,
        onCheckedChange: () => void run(),
        // Same as the action row: staying enabled keeps the highlight on this row.
        disabled,
        "aria-busy": status === "pending" || undefined,
        "data-status": status,
      }
    : { checked, defaultChecked, onCheckedChange, disabled };

  return (
    <>
      <BaseMenu.CheckboxItem
        className={cn(
          itemBase,
          indicator && "pr-2 pl-8",
          hasReason && "data-[disabled]:pointer-events-auto",
          fillIcon && [
            "[&_svg]:transition-[fill] [&_svg]:duration-(--duration-fast) [&_svg]:ease-out",
            "data-[checked]:[&_svg]:fill-current",
          ],
          className,
        )}
        // Render function to read `checked`: the tick can Morph in and out (draw itself
        // in, blur out) instead of snapping, and `children` can swap on it.
        render={(itemProps, state) => (
          <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
            <div {...itemProps}>
              {indicator && (
                <span className={INDICATOR_SLOT}>
                  {/* The tick slot doubles as the status slot: while the action is in
                      flight the loader sits exactly where the tick will land, which is
                      what makes the wait read as "not yet" rather than as "nothing
                      happened". Both extra keys are unreachable without an `action`.

                      No size on the glyphs: `itemBase` sizes every svg in the row, and its
                      `.row svg` beats a class on the element itself, so anything set here
                      would be a statement the CSS quietly overrules. */}
                  <Morph
                    activeKey={
                      status === "pending" || status === "error"
                        ? status
                        : state.checked
                          ? "on"
                          : "off"
                    }
                    items={{
                      on: <Check />,
                      off: null,
                      pending: <AsciiLoader />,
                      error: <TriangleAlert />,
                    }}
                  />
                </span>
              )}
              {typeof children === "function" ? children(state.checked, status) : children}
            </div>
          </DisabledReasonTooltip>
        )}
        {...control}
        {...props}
      />

      {/* Outside the row, not inside it: a menu item's accessible name is built from its
          contents, so an sr-only status in there would rename the row to "Mute Working"
          for as long as it ran. */}
      {deferred && (
        <span aria-live="polite" className="sr-only">
          {status === "pending" && (announce?.pending ?? "Working")}
          {status === "error" && (announce?.error ?? "Something went wrong")}
        </span>
      )}
    </>
  );
}

export interface DropdownMenuRadioItemProps extends ComponentProps<typeof BaseMenu.RadioItem> {
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuRadioItem({
  className,
  children,
  disabled,
  disabledReason,
  ...props
}: DropdownMenuRadioItemProps) {
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const item = (
    <BaseMenu.RadioItem
      className={cn(
        itemBase,
        "pr-2 pl-8",
        hasReason && "data-[disabled]:pointer-events-auto",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span className={INDICATOR_SLOT}>
        {/* Base UI's own indicator, styled like the standalone Radio's dot. `keepMounted`
            matters: without it the indicator is transition-status-gated and can miss the
            group's initial value on first paint, which is why it showed empty. It scales
            in when selected and out when not. */}
        <BaseMenu.RadioItemIndicator
          keepMounted
          className={cn(
            "size-2 rounded-full bg-primary transition-[scale,opacity] duration-(--duration-fast)",
            "scale-0 opacity-0 data-[checked]:scale-100 data-[checked]:opacity-100",
          )}
        />
      </span>
      {children}
    </BaseMenu.RadioItem>
  );

  return (
    <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}

/**
 * A standalone section heading — a plain styled div, so it can sit directly in the content
 * (Base UI's `GroupLabel` throws unless it's inside a `Group`/`RadioGroup`). To label a
 * group for assistive tech, wrap items in `DropdownMenuGroup` and give it an `aria-label`.
 */
export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", inset && "pl-8", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        // The same keycap lift the command palette uses — 8% ink over whatever the row's
        // surface happens to be. Not `bg-muted`: that's the row highlight, so a shortcut
        // on a highlighted row would have disappeared into it.
        "ml-auto flex min-w-4 shrink-0 items-center justify-center rounded-xs bg-foreground/8 px-1 py-0.5 font-mono text-2xs text-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
}

export interface DropdownMenuSelectTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.SubmenuTrigger>, "children" | "className"> {
  /** An optional leading icon for the menu row. */
  icon?: ReactNode;
  /** The label shown on the left side of the trigger. */
  placeholder?: ReactNode;
  className?: string;
}

/**
 * The row that opens a select panel from inside a dropdown menu.
 *
 * It is a real submenu trigger for arrow-key navigation and hover-safe pointer movement.
 * The trigger keeps its label on the left and shows the selected value or count before
 * the chevron.
 */
export function DropdownMenuSelectTrigger({
  icon,
  placeholder = "Select",
  className,
  disabled,
  label,
  ...props
}: DropdownMenuSelectTriggerProps) {
  const context = useDropdownMenuSelectContext();
  const hasSelection = context.values.length > 0;
  const selectedValue = context.values[0];
  const summary = context.multiple
    ? hasSelection
      ? `${context.values.length} selected`
      : placeholder
    : hasSelection
      ? (context.labelFor(selectedValue) ?? placeholder)
      : placeholder;

  return (
    <DropdownMenuSubTrigger
      {...props}
      disabled={disabled || context.disabled}
      label={label ?? (typeof placeholder === "string" ? placeholder : undefined)}
      className={cn("min-w-0", className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-foreground">{label ?? placeholder}</span>
      {hasSelection && (
        <span className="ml-auto max-w-[50%] shrink-0 truncate text-muted-foreground">{summary}</span>
      )}
    </DropdownMenuSubTrigger>
  );
}

export interface DropdownMenuSelectContentProps extends DropdownMenuContentProps {
  /** Adds the same optional in-panel filter field as the standalone Select. */
  searchable?: boolean;
  /** Which end of the panel the filter field sits at. */
  searchPosition?: "top" | "bottom";
  /** Placeholder for the optional panel filter field. */
  searchPlaceholder?: string;
  /** Message shown when the filter has no matching options. */
  emptyMessage?: ReactNode;
  /** Focus the search field when the panel opens. */
  autoFocusFirstItem?: boolean;
}

/** The select panel opened by a `DropdownMenuSelectTrigger`, positioned as a submenu. */
export function DropdownMenuSelectContent({
  children,
  className,
  side = "right",
  align = "start",
  keepMounted = true,
  searchable = false,
  searchPosition = "top",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  autoFocusFirstItem = true,
  onFocus,
  ...props
}: DropdownMenuSelectContentProps) {
  const context = useDropdownMenuSelectContext();
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noResults =
    searchable && context.searchQuery.trim() !== "" && context.visibleOptionCount === 0;

  useEffect(() => {
    if (!searchable || !autoFocusFirstItem || !context.open) return;

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirstItem, context.open, searchable]);

  const items = context.multiple ? (
    children
  ) : (
    <DropdownMenuRadioGroup
      value={context.values[0] ?? null}
      onValueChange={context.selectSingle}
    >
      {children}
    </DropdownMenuRadioGroup>
  );

  const searchField = searchable ? (
    // A fixed 38px row, flush to the panel edge: the negative margins cancel the popup's
    // `p-1` so the strip runs from the panel's top edge to its separator line at exactly
    // 38px (the popup's `overflow-hidden` clips it to the rounded corners). `px-3.5` matches
    // the standalone Select's search inset and its 4px list + 10px row icon inset. Icon and
    // input are centred flex children rather than an absolute icon over a padded input.
    <div
      className={cn(
        "-mx-1 flex h-[38px] shrink-0 items-center gap-2 px-3.5",
        searchPosition === "bottom" ? "-mb-1 border-t border-border" : "-mt-1 border-b border-border",
      )}
    >
      <Input
        ref={searchInputRef}
        aria-label="Search options"
        variant="plain"
        value={context.searchQuery}
        onChange={(event) => context.setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            focusDropdownMenuSelectItem(
              listRef.current,
              event.key === "ArrowDown" ? "next" : "previous",
            );
            return;
          }

          if (!event.metaKey && !event.ctrlKey && event.key !== "Escape") {
            event.stopPropagation();
          }
        }}
        placeholder={searchPlaceholder}
        className="h-full border-0 p-0 text-xs"
      />
    </div>
  ) : null;

  return (
    <DropdownMenuSubContent
      side={side}
      align={align}
      keepMounted={keepMounted}
      className={cn(searchable && "overflow-hidden", className)}
      onFocus={(event) => {
        onFocus?.(event);
        if (searchable && event.target === event.currentTarget) {
          searchInputRef.current?.focus();
        }
      }}
      {...props}
    >
      {searchable && searchPosition === "top" && searchField}
      <div
        ref={listRef}
        className={cn(
          "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
          "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
          noResults && "hidden",
        )}
      >
        {items}
      </div>
      {noResults && (
        // `m-1` supplies the same 4px inset as the list's `p-1`; `h-7` matches one
        // select row, keeping the full panel height identical to a single result.
        <div className="m-1 flex h-7 items-center justify-center px-2.5 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {searchable && searchPosition === "bottom" && searchField}
    </DropdownMenuSubContent>
  );
}

export interface DropdownMenuSelectItemProps {
  value: unknown;
  children?: ReactNode;
  icon?: ReactNode;
  label?: string;
  disabled?: boolean;
  /** Explain why a disabled option is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
  className?: string;
  /** Text used by an ancestor searchable select panel to match this option. */
  searchValue?: string;
}

export function DropdownMenuSelectItem({
  value,
  children,
  icon,
  label,
  disabled,
  disabledReason,
  className,
  searchValue,
}: DropdownMenuSelectItemProps) {
  const context = useDropdownMenuSelectContext();
  const itemLabel = label ?? (typeof children === "string" ? children : String(value));
  const optionText = searchValue ?? (typeof children === "string" ? children : itemLabel);
  const hiddenBySearch = !context.matchesQuery(optionText);
  const isDisabled = disabled || context.disabled;
  const hasReason = isDisabled && disabledReason != null && disabledReason !== "";
  const checked = context.values.some((current) => Object.is(current, value));
  const {
    registerLabel,
    unregisterLabel,
    registerOptionText,
    unregisterOptionText,
  } = context;

  useEffect(() => {
    registerLabel(value, itemLabel);
    return () => unregisterLabel(value);
  }, [itemLabel, registerLabel, unregisterLabel, value]);
  useEffect(() => {
    registerOptionText(value, optionText);
    return () => unregisterOptionText(value);
  }, [optionText, registerOptionText, unregisterOptionText, value]);

  if (context.multiple) {
    return (
      <BaseMenu.CheckboxItem
        checked={checked}
        onCheckedChange={(nextChecked) => context.toggleValue(value, nextChecked)}
        disabled={isDisabled || hiddenBySearch}
        hidden={hiddenBySearch}
        label={itemLabel}
        className={cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto", className)}
        render={(itemProps, state) => (
          <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
            <div {...itemProps}>
              <Checkbox
                checked={state.checked}
                size="sm"
                aria-hidden
                tabIndex={-1}
                className="pointer-events-none shrink-0"
              />
              {icon && (
                <span aria-hidden="true" className={selectItemIcon}>
                  {icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{children}</span>
            </div>
          </DisabledReasonTooltip>
        )}
      />
    );
  }

  const item = (
    <BaseMenu.RadioItem
      value={value}
      disabled={isDisabled || hiddenBySearch}
      hidden={hiddenBySearch}
      label={itemLabel}
      className={cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto", className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <BaseMenu.RadioItemIndicator
        keepMounted
        className={cn(
          "ml-auto flex size-3.5 shrink-0 items-center justify-center text-foreground",
          "scale-0 opacity-0 transition-[opacity,scale] duration-(--duration-fast) ease-out",
          "data-[checked]:scale-100 data-[checked]:opacity-100",
        )}
      >
        <Check className="size-3.5" />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );

  return (
    <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}

export interface DropdownMenuSubTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.SubmenuTrigger>, "children"> {
  inset?: boolean;
  children?: ReactNode;
}

export function DropdownMenuSubTrigger({ className, inset, children, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger className={cn(itemBase, inset && "pl-8", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  children,
  side = "right",
  align = "start",
  sideOffset = 8,
  keepMounted = false,
  // Pull up by the popup's own top padding (`p-1`) so the first item lines up with the
  // trigger row rather than sitting a few pixels low.
  alignOffset = -4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <BaseMenu.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}
