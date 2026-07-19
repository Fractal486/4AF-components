"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";

/**
 * A single or multi-select — the accessible version, on Base UI.
 *
 * Base UI drives the behaviour — keyboard navigation, typeahead, focus into the list and
 * back, collision-aware placement, the hidden form input, full ARIA — which is exactly
 * what a hand-rolled dropdown gets wrong. The panel simply blurs and scales in from the
 * trigger's edge (a gap opens off it), the chevron flips, and it fades back out on close.
 *
 * The trade against the hand-rolled sibling: Base UI portals the popup, so there's no
 * gooey height *unfold* (`select-motion.tsx`) — but every keyboard and focus behaviour is
 * real rather than approximated. Pass `multiple` to keep the panel open while several
 * checkbox rows are toggled; the same value and item parts automatically switch to their
 * count and checkbox forms. That's the right default; the Motion one is what you reach
 * for when the entrance is the point.
 */

interface SelectContextValue {
  open: boolean;
  multiple: boolean;
  /** The current selection, always as an array (one entry for single-select). */
  values: unknown[];
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
  registerLabel: (value: unknown, label: ReactNode) => void;
  unregisterLabel: (value: unknown) => void;
  labelFor: (value: unknown) => ReactNode | undefined;
  firstItem: unknown;
  activeItem: unknown;
  setActiveItem: (value: unknown) => void;
  panelSearch: boolean;
  setPanelSearch: (enabled: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Reset the selection to none (single → null, multiple → empty). */
  clear: () => void;
}

const SelectContext = createContext<SelectContextValue>({
  open: false,
  multiple: false,
  values: [],
  registerIcon: () => {},
  unregisterIcon: () => {},
  iconFor: () => undefined,
  registerLabel: () => {},
  unregisterLabel: () => {},
  labelFor: () => undefined,
  firstItem: undefined,
  activeItem: undefined,
  setActiveItem: () => {},
  panelSearch: false,
  setPanelSearch: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  clear: () => {},
});

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// The pane blurs and scales in as one piece — no height unfold, no per-item stagger.
// Scales from `--transform-origin` (the trigger edge).
const FADE_HIDDEN = { opacity: 0, scale: 0.98, filter: "blur(4px)" };
const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

function focusPanelOption(
  list: HTMLElement | null,
  direction: "next" | "previous",
) {
  if (!list) return;

  const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (option) =>
      !option.hidden &&
      option.getAttribute("aria-disabled") !== "true" &&
      !(option instanceof HTMLButtonElement && option.disabled),
  );
  const option = direction === "next" ? options[0] : options.at(-1);
  option?.focus();
}

export interface SelectProps<Value, Multiple extends boolean | undefined = false>
  extends Omit<ComponentProps<typeof BaseSelect.Root<Value, Multiple>>, "children"> {
  /** Resolves the icon shown in the closed single-select value. */
  iconForValue?: (value: Value) => ReactNode | undefined;
  children: ReactNode;
}

export function Select<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  children,
  multiple,
  iconForValue,
  ...props
}: SelectProps<Value, Multiple>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
  const [searchQuery, setSearchQuery] = useState("");

  // A panel search is transient: opening the list always starts with its full set of
  // choices, rather than retaining a filter from a previous visit.
  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  // Mirror the selection so a trigger can read it for its own display and styling — a
  // filter chip that shows its picks and dashes its border while nothing is chosen. Base
  // UI stays the source of truth via `value`/`onValueChange`; this just tracks a copy.
  const isValueControlled = value !== undefined;
  // `null` (not `undefined`) for an empty single-select, so Base UI stays controlled from
  // the first render rather than flipping controlled↔uncontrolled when a value lands.
  const [uncontrolledValue, setUncontrolledValue] = useState<Value | Value[] | null>(
    () => (defaultValue ?? (multiple ? ([] as Value[]) : null)) as Value | Value[] | null,
  );
  const currentValue = isValueControlled ? value : uncontrolledValue;
  const values = useMemo<unknown[]>(
    () =>
      multiple
        ? Array.isArray(currentValue)
          ? currentValue
          : []
        : currentValue == null
          ? []
          : [currentValue],
    [currentValue, multiple],
  );
  const handleValueChange = useCallback<
    NonNullable<SelectProps<Value, Multiple>["onValueChange"]>
  >(
    (next, details) => {
      onValueChange?.(next, details);
      if (!isValueControlled) setUncontrolledValue(next as Value | Value[]);
    },
    [isValueControlled, onValueChange],
  );

  const [labels, setLabels] = useState<Map<unknown, ReactNode>>(() => new Map());
  const registerLabel = useCallback((v: unknown, label: ReactNode) => {
    setLabels((current) => {
      if (label == null) {
        if (!current.has(v)) return current;
        const next = new Map(current);
        next.delete(v);
        return next;
      }

      if (Object.is(current.get(v), label)) return current;
      return new Map(current).set(v, label);
    });
  }, []);
  const unregisterLabel = useCallback((v: unknown) => {
    setLabels((current) => {
      if (!current.has(v)) return current;
      const next = new Map(current);
      next.delete(v);
      return next;
    });
  }, []);
  const labelFor = useCallback((v: unknown) => labels.get(v), [labels]);
  const firstItem = useMemo(() => labels.keys().next().value, [labels]);
  const [activeItem, setActiveItem] = useState<unknown>(undefined);
  const [panelSearch, setPanelSearch] = useState(false);

  useEffect(() => {
    if (!isOpen) setActiveItem(undefined);
  }, [isOpen]);

  const clear = useCallback(() => {
    const empty = (multiple ? ([] as Value[]) : null) as Value | Value[] | null;
    if (!isValueControlled) setUncontrolledValue(empty);
    // Notify a controlled consumer. A manual clear has no Base UI event details.
    (onValueChange as ((v: never, d?: never) => void) | undefined)?.(empty as never);
  }, [isValueControlled, multiple, onValueChange]);

  const [icons, setIcons] = useState<Map<unknown, ReactNode>>(() => new Map());
  const registerIcon = useCallback((value: unknown, icon: ReactNode | undefined) => {
    setIcons((current) => {
      if (icon == null) {
        if (!current.has(value)) return current;
        const next = new Map(current);
        next.delete(value);
        return next;
      }

      if (Object.is(current.get(value), icon)) return current;
      return new Map(current).set(value, icon);
    });
  }, []);
  const unregisterIcon = useCallback((value: unknown) => {
    setIcons((current) => {
      if (!current.has(value)) return current;
      const next = new Map(current);
      next.delete(value);
      return next;
    });
  }, []);
  const iconFor = useCallback(
    (value: unknown) =>
      icons.get(value) ??
      (value == null ? undefined : iconForValue?.(value as Value)),
    [iconForValue, icons],
  );

  const handleOpenChange = useCallback<
    NonNullable<SelectProps<Value, Multiple>["onOpenChange"]>
  >(
    (next, details) => {
      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SelectContext.Provider
      value={{
        open: isOpen,
        multiple: Boolean(multiple),
        values,
        registerIcon,
        unregisterIcon,
        iconFor,
        registerLabel,
        unregisterLabel,
        labelFor,
        firstItem,
        activeItem,
        setActiveItem,
        panelSearch,
        setPanelSearch,
        searchQuery,
        setSearchQuery,
        clear,
      }}
    >
      <BaseSelect.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        defaultOpen={defaultOpen}
        multiple={multiple}
        value={currentValue as never}
        onValueChange={handleValueChange as never}
        {...props}
      >
        {children}
      </BaseSelect.Root>
    </SelectContext.Provider>
  );
}

export function SelectValue({
  className,
  children,
  placeholder,
  render,
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  const { multiple, iconFor } = useContext(SelectContext);

  if (!multiple && render == null) {
    return (
      <BaseSelect.Value
        className={cn("truncate", className)}
        placeholder={placeholder}
        render={(valueProps, state) => (
          <span
            {...valueProps}
            className={cn("flex min-w-0 items-center gap-2 truncate", valueProps.className)}
          >
            <SelectItemIcon icon={iconFor(state.value)} />
            <span className="truncate">{valueProps.children}</span>
          </span>
        )}
        {...props}
      >
        {children}
      </BaseSelect.Value>
    );
  }

  return (
    <BaseSelect.Value
      className={cn("truncate", className)}
      placeholder={placeholder}
      render={render}
      {...props}
    >
      {children ?? ((value: unknown) => {
        const count = Array.isArray(value) ? value.length : 0;

        return count === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          `${count} selected`
        );
      })}
    </BaseSelect.Value>
  );
}

export function SelectTrigger({
  className,
  children,
  outline = true,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Trigger>, "className"> & {
  className?: string;
  children?: ReactNode;
  /**
   * The bordered field box. Off leaves just the value and the chevron — a borderless,
   * fit-to-content trigger for a toolbar or inline label.
   */
  outline?: boolean;
}) {
  const { open } = useContext(SelectContext);
  const reduceMotion = useReducedMotion();

  return (
    <BaseSelect.Trigger
      className={cn(
        // h-9 matches Button's default `md` size and the Input — a select sat beside
        // either in a form row has to line up with it.
        "group flex h-9 items-center gap-2 rounded-md text-sm text-foreground",
        "cursor-pointer outline-none select-none",
        "transition-[background-color,border-color] duration-(--duration-base) ease-out",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        outline
          ? cn(
              "w-full justify-between border border-border bg-surface px-3.5",
              "hover:border-border-strong data-[popup-open]:border-border-strong",
              // Invalid mirrors the Input's treatment — red border + 3px red ring — so a
              // select in a form reads its error the same way. Pair with `FieldError`.
              "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
            )
          : "w-auto justify-between gap-1.5 px-0",
        className,
      )}
      {...props}
    >
      {children}
      <motion.span
        aria-hidden
        className="shrink-0 text-muted-foreground"
        animate={{ rotate: open ? 180 : 0 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
        }
      >
        <ChevronDown className="size-4" />
      </motion.span>
    </BaseSelect.Trigger>
  );
}

export interface SelectSortTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "className" | "children"> {
  className?: string;
  /** A leading icon. Optional — omit for a text-only chip. */
  icon?: ReactNode;
  /** A prefix, e.g. "Sort" or "Status", shown before the value(s). Optional. */
  label?: ReactNode;
  /** Draw the border and fill. Off makes it a borderless text button. */
  outline?: boolean;
  /** Append the selected value(s) after the label — "Status: Active, Paused". */
  showValue?: boolean;
  /** Shown (muted) in place of the value(s) while nothing is selected. */
  placeholder?: ReactNode;
}

/**
 * A sort / filter chip trigger — the toolbar counterpart to the full-width `SelectTrigger`.
 *
 * It sizes to its content and reads its own selection from context, so it can show the
 * picked value(s) after an optional label ("Status: Active, Paused"), and — while the
 * selection is empty (no active sort/filter) — dash its border to read as "unset". A
 * brighter fill marks the open panel. Every part is optional: with just `icon` and the
 * chevron and label/value off, it collapses to the plain icon button. Works in `multiple`
 * mode for filters, where the value list is what's shown.
 */
export function SelectSortTrigger({
  className,
  icon,
  label,
  outline = true,
  showValue = true,
  placeholder = "Any",
  ...props
}: SelectSortTriggerProps) {
  const { open, values, labelFor } = useContext(SelectContext);
  const reduceMotion = useReducedMotion();
  const selected = values.map((v) => labelFor(v) ?? (typeof v === "string" ? v : String(v)));
  const isUnset = selected.length === 0;
  // With no label and no value shown, the chip is a bare icon button — the chevron would
  // be the only text-ish thing, so drop it and let the icon stand alone.
  const iconOnly = !label && !showValue;
  const showChevron = !iconOnly;

  return (
    <BaseSelect.Trigger
      data-unset={isUnset || undefined}
      className={cn(
        "group inline-flex h-9 max-w-full cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-foreground outline-none select-none",
        "transition-[background-color,border-color] duration-(--duration-base) ease-out",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        outline
          ? cn(
              "border hover:border-border-strong",
              // Unset: dashed border on the plain surface. Set: solid border and a brighter
              // fill that persists (the chip reads as "active"). Open keeps that fill too.
              isUnset
                ? "border-dashed border-border-strong bg-surface"
                : "border-border bg-muted",
              "data-[popup-open]:border-border-strong data-[popup-open]:bg-muted",
            )
          : "hover:bg-muted data-[popup-open]:bg-muted",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            "shrink-0 [&>svg]:size-4",
            // Icon-only chip: the glyph carries the state, so it brightens to the
            // foreground once something's selected. Otherwise it stays a muted adornment.
            iconOnly && !isUnset ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
      )}
      {(label || showValue) && (
        <span className="min-w-0 truncate">
          {label && (
            <span className={isUnset && !showValue ? "text-muted-foreground" : undefined}>
              {label}
            </span>
          )}
          {showValue &&
            (isUnset ? (
              <span className="text-muted-foreground">
                {label ? ": " : null}
                {placeholder}
              </span>
            ) : (
              <span className="text-foreground">
                {label ? <span className="text-muted-foreground">: </span> : null}
                {selected.map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 ? ", " : null}
                    {item}
                  </Fragment>
                ))}
              </span>
            ))}
        </span>
      )}
      {showChevron && (
        // Same Motion spring as `SelectTrigger`, so the two chevrons flip identically.
        <motion.span
          aria-hidden
          className="shrink-0 text-muted-foreground"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
          }
        >
          <ChevronDown className="size-4" />
        </motion.span>
      )}
    </BaseSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  sideOffset = 6,
  align = "start",
  width = "trigger",
  searchable = false,
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  autoFocusFirstItem = true,
  clearable = false,
  clearLabel = "Clear",
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> & {
  className?: string;
  children?: ReactNode;
  sideOffset?: number;
  align?: ComponentProps<typeof BaseSelect.Positioner>["align"];
  /**
   * `trigger` keeps the panel the trigger's width (a bordered field select); `content`
   * sizes it to its own rows — for a narrow, borderless trigger or the sort chip.
   */
  width?: "trigger" | "content";
  /** Adds a plain filter field above the list, separated from the options by a hairline. */
  searchable?: boolean;
  /** Placeholder for the optional panel filter field. */
  searchPlaceholder?: string;
  /** Message shown when a panel search has no matching options. */
  emptyMessage?: ReactNode;
  /** Focus the first option when the panel opens. Turn this off for menu-like uses. */
  autoFocusFirstItem?: boolean;
  /** A full-width footer button that resets the selection to none. */
  clearable?: boolean;
  /** Text for the clear button. */
  clearLabel?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const {
    open,
    values,
    clear,
    firstItem,
    setActiveItem,
    setPanelSearch,
    searchQuery,
    setSearchQuery,
  } = useContext(SelectContext);
  const listRef = useRef<HTMLDivElement>(null);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    setPanelSearch(searchable);
    return () => setPanelSearch(false);
  }, [searchable, setPanelSearch]);

  useEffect(() => {
    if (!searchable || searchQuery.trim() === "") {
      setNoResults(false);
      return;
    }

    const hasVisibleOption = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    ).some((option) => !option.hidden);
    setNoResults(!hasVisibleOption);
  }, [searchQuery, searchable]);

  // Every non-sort select begins on its first row, even when another value is selected.
  // Searchable panels retain DOM focus in their field, but carry the same active-row state.
  useEffect(() => {
    if (!open || !autoFocusFirstItem || firstItem === undefined) return;

    setActiveItem(firstItem);
    if (searchable) return;

    const frame = requestAnimationFrame(() => {
      focusPanelOption(listRef.current, "next");
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirstItem, firstItem, open, searchable, setActiveItem]);

  return (
    <BaseSelect.Portal>
      {/* Base UI handles the positioning and collision flip; `--transform-origin` points
          at the trigger's edge, so the unfold grows *from* the trigger whichever side it
          lands on. */}
      <BaseSelect.Positioner
        sideOffset={sideOffset}
        align={align}
        alignItemWithTrigger={false}
        side="bottom"
        className={cn(
          "z-50 outline-none",
          // `trigger` keeps the panel the button's width (the default field select);
          // `content` sizes it to its own rows — the longest label plus the reserved check
          // slot — for a narrow, borderless trigger.
          width === "trigger" ? "w-[var(--anchor-width)]" : "w-max",
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
              style={{ transformOrigin: "var(--transform-origin)" }}
              initial={reduceMotion ? { opacity: 0 } : FADE_HIDDEN}
              animate={
                reduceMotion
                  ? { opacity: open ? 1 : 0 }
                  : open
                    ? FADE_SHOW
                    : FADE_HIDDEN
              }
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            />
          }
          {...props}
        >
          {searchable && (
            <div className="relative border-b border-border px-2 py-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search options"
                variant="plain"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusPanelOption(
                      listRef.current,
                      event.key === "ArrowDown" ? "next" : "previous",
                    );
                    return;
                  }
                  // Keep Select's typeahead from treating input keystrokes as option jumps.
                  if (event.key !== "Escape") event.stopPropagation();
                }}
                placeholder={searchPlaceholder}
                className="h-8 pl-8"
              />
            </div>
          )}
          <div
            className={cn(
              "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
              SCROLLBAR,
              noResults && "hidden",
            )}
          >
            <BaseSelect.List ref={listRef}>{children}</BaseSelect.List>
          </div>
          {noResults && (
            <div className="m-1 flex h-8 items-center justify-center px-2.5 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
          {clearable && (
            // A footer, not a listbox row — pinned below the scroll area, and disabled
            // while there's nothing to clear. Clearing leaves the panel open so a new
            // choice can follow immediately.
            <div className="p-1">
              <Button
                variant="outline"
                disabled={values.length === 0}
                onClick={() => clear()}
                // Match a row's highlight box exactly (`rounded-xs px-2.5 py-1.5 text-sm`),
                // so the clear button lines up with the options above it.
                className="h-auto w-full rounded-xs px-2.5 py-1.5 text-sm"
              >
                {clearLabel}
              </Button>
            </div>
          )}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export type SelectItemProps = Omit<
  ComponentProps<typeof BaseSelect.Item>,
  "className" | "disabled"
> & {
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  /** Text used by an ancestor searchable `SelectContent` to match this option. */
  searchValue?: string;
};

function SelectItemIcon({ icon }: { icon?: ReactNode }) {
  if (icon == null) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none flex size-4 shrink-0 items-center justify-center [&>svg]:size-4"
    >
      {icon}
    </span>
  );
}

export function SelectItem({
  className,
  icon,
  children,
  value,
  disabled = false,
  searchValue,
  ...props
}: SelectItemProps) {
  const {
    multiple,
    registerIcon,
    unregisterIcon,
    registerLabel,
    unregisterLabel,
    open,
    activeItem,
    panelSearch,
    setActiveItem,
    searchQuery,
  } = useContext(SelectContext);
  const optionText = searchValue ?? (typeof children === "string" ? children : String(value));
  const hiddenBySearch =
    searchQuery.trim() !== "" && !optionText.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase());
  const itemDisabled = disabled || hiddenBySearch;
  const panelActive = open && Object.is(activeItem, value);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  // Register the label so a chip trigger can render the selected value(s) by name.
  useEffect(() => {
    registerLabel(value, children);
    return () => unregisterLabel(value);
  }, [children, registerLabel, unregisterLabel, value]);

  if (multiple) {
    return (
      <BaseSelect.Item
        value={value}
        disabled={itemDisabled}
        hidden={hiddenBySearch}
        data-panel-active={panelActive || undefined}
        onFocusCapture={() => setActiveItem(value)}
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
          "text-muted-foreground",
          !panelSearch && "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
          "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
          "data-[selected]:text-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className,
        )}
        {...props}
      >
        <BaseSelect.ItemIndicator
          keepMounted
          className="shrink-0"
          render={(indicatorProps, state) => (
            <span {...indicatorProps}>
              <Checkbox
                checked={state.selected}
                size="sm"
                aria-hidden
                tabIndex={-1}
                className="pointer-events-none shrink-0"
              />
            </span>
          )}
        />
        <SelectItemIcon icon={icon} />
        <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      </BaseSelect.Item>
    );
  }

  return (
    <BaseSelect.Item
      value={value}
      disabled={itemDisabled}
      hidden={hiddenBySearch}
      data-panel-active={panelActive || undefined}
      onFocusCapture={() => setActiveItem(value)}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
        "text-muted-foreground",
        // Base UI moves this highlight with the keyboard as well as the pointer; it snaps
        // (no transition) so it keeps up with arrow-key navigation rather than lagging.
        !panelSearch && "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectItemIcon icon={icon} />
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A fixed slot so the check's width is reserved on every row (selected or not),
          keeping the panel a stable "longest label + check" wide. */}
      <span className="flex size-3.5 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator className="text-foreground">
          <Check className="size-3.5" />
        </BaseSelect.ItemIndicator>
      </span>
    </BaseSelect.Item>
  );
}
