"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { motion, type Transition, useReducedMotion, type Variants } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { ease } from "@/registry/lib/motion";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";

/**
 * A select whose panel is hand-animated with Motion — the original beUI feel.
 *
 * There is no behaviour primitive here: the whole thing is built by hand, which is
 * the point of keeping it as a *variant*. It buys one thing Base UI can't give us —
 * the panel is a plain inline element, kept mounted, so it can animate its own
 * `height` from zero and *pinch* off the trigger. The trade is real: no typeahead,
 * no roving focus into the list, a hand-rolled outside-click and Escape. For the
 * accessible version, see the sibling `select.tsx`.
 *
 * Pass `multiple` for a checkbox multi-select. It keeps this same unfold but leaves the
 * panel open as options are toggled and shows a count in the trigger. The checkboxes are
 * visual only: each listbox option owns the interaction and ARIA state.
 *
 * The signature move: the panel starts flush against the trigger (height 0, no gap,
 * facing corners flat — reading as one shape), then springs its height open while a
 * margin gap opens it apart and the facing corners round. The springs are smooth (no
 * overshoot). Position-aware: it opens upward when there isn't room below.
 */

const INSTANT: Transition = { duration: 0 };

// Bouncy spring for the unfold/separation; the chevron flips on the same feel.
const CHEVRON_TRANSITION: Transition = { type: "spring", duration: 0.21, bounce: 0 };

// The panel's items cascade in behind the unfold.
const LIST_VARIANTS: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.011, delayChildren: 0.01 } },
};
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
  // An explicit, short settle so the last staggered item lands with the rest of the
  // open rather than trailing it.
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.15, ease: ease.out } },
};

// Our resting corner is --radius-md (7px), matching the default Button; the keyframes
// morph to and from it.
const RADIUS = 7;

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

type Placement = "bottom" | "top";

interface SelectContextValue {
  value: string | undefined;
  values: readonly string[];
  multiple: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  registerIcon: (value: string, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: string) => void;
  iconFor: (value: string | undefined) => ReactNode | undefined;
  reduce: boolean;
  triggerId: string;
  listId: string;
  disabled: boolean;
  placement: Placement;
  setPlacement: (p: Placement) => void;
  activeItem: string | undefined;
  setActiveItem: (value: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error(`${component} must be used within <Select>`);
  return ctx;
}

function focusPanelOption(
  list: HTMLElement | null,
  current: HTMLElement | null,
  direction: "next" | "previous",
) {
  if (!list) return undefined;

  const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (option) =>
      !option.hidden &&
      option.getAttribute("aria-disabled") !== "true" &&
      !(option instanceof HTMLButtonElement && option.disabled),
  );
  const currentIndex = current ? options.indexOf(current) : -1;
  const nextIndex =
    direction === "next"
      ? Math.min(currentIndex + 1, options.length - 1)
      : currentIndex < 0
        ? options.length - 1
        : Math.max(currentIndex - 1, 0);

  const option = options[nextIndex];
  option?.focus();
  return option;
}

interface SelectBaseProps {
  disabled?: boolean;
  className?: string;
  /** Resolves the icon shown in the closed single-select value. */
  iconForValue?: (value: string) => ReactNode | undefined;
  children: ReactNode;
}

export interface SingleSelectProps extends SelectBaseProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  multiple?: false | undefined;
}

export interface MultiSelectProps extends SelectBaseProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  multiple: true;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

export function Select({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  iconForValue,
  children,
}: SelectProps) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | string[] | undefined>(() =>
    multiple
      ? Array.isArray(defaultValue)
        ? defaultValue
        : []
      : typeof defaultValue === "string"
        ? defaultValue
        : undefined,
  );
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [icons, setIcons] = useState<Map<string, ReactNode>>(new Map());
  const [placement, setPlacement] = useState<Placement>("bottom");
  const [activeItem, setActiveItem] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const values = useMemo(
    () =>
      multiple
        ? Array.isArray(current)
          ? current
          : []
        : typeof current === "string"
          ? [current]
          : [],
    [current, multiple],
  );
  const selectedValue = multiple ? undefined : values[0];

  // A panel filter belongs to this open session only. Reopening shows the full list.
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setActiveItem(undefined);
    }
  }, [open]);

  const select = useCallback(
    (next: string) => {
      if (multiple) {
        const nextValues = values.includes(next)
          ? values.filter((value) => value !== next)
          : [...values, next];

        if (!controlled) setInternal(nextValues);
        (onValueChange as MultiSelectProps["onValueChange"])?.(nextValues);
        return;
      }

      if (!controlled) setInternal(next);
      (onValueChange as SingleSelectProps["onValueChange"])?.(next);
      setOpen(false);
    },
    [controlled, multiple, onValueChange, values],
  );

  const register = useCallback((v: string, label: string) => {
    setLabels((m) => (m.get(v) === label ? m : new Map(m).set(v, label)));
  }, []);
  const unregister = useCallback((v: string) => {
    setLabels((m) => {
      if (!m.has(v)) return m;
      const next = new Map(m);
      next.delete(v);
      return next;
    });
  }, []);
  const registerIcon = useCallback((v: string, icon: ReactNode | undefined) => {
    setIcons((m) => {
      if (icon == null) {
        if (!m.has(v)) return m;
        const next = new Map(m);
        next.delete(v);
        return next;
      }

      if (Object.is(m.get(v), icon)) return m;
      return new Map(m).set(v, icon);
    });
  }, []);
  const unregisterIcon = useCallback((v: string) => {
    setIcons((m) => {
      if (!m.has(v)) return m;
      const next = new Map(m);
      next.delete(v);
      return next;
    });
  }, []);

  // Close on outside pointer / Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value: selectedValue,
      values,
      multiple,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor: (v) => (v === undefined ? undefined : labels.get(v)),
      registerIcon,
      unregisterIcon,
      iconFor: (v) =>
        v === undefined ? undefined : icons.get(v) ?? iconForValue?.(v),
      reduce,
      triggerId: `${baseId}-trigger`,
      listId: `${baseId}-list`,
      disabled,
      placement,
      setPlacement,
      activeItem,
      setActiveItem,
      searchQuery,
      setSearchQuery,
    }),
    [
      selectedValue,
      values,
      multiple,
      open,
      select,
      register,
      unregister,
      labels,
      registerIcon,
      unregisterIcon,
      icons,
      iconForValue,
      reduce,
      baseId,
      disabled,
      placement,
      activeItem,
      searchQuery,
    ],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <div ref={rootRef} className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function SelectTrigger({ className, children, ...aria }: SelectTriggerProps) {
  const ctx = useSelectContext("SelectTrigger");
  const isTop = ctx.placement === "top";
  // The edge facing the panel flattens then rounds; the far edge stays rounded. All
  // four are specified so none gets stranded square when the placement flips.
  const kf = ctx.open ? [0, 0, RADIUS] : [RADIUS, 0, RADIUS];
  const kfT: Transition = ctx.reduce
    ? INSTANT
    : ctx.open
      ? { duration: 0.6, times: [0, 0.4, 1], ease: ease.out }
      : { duration: 0.42, times: [0, 0.5, 1], ease: ease.out };
  return (
    <motion.button
      {...aria}
      type="button"
      id={ctx.triggerId}
      disabled={ctx.disabled}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      aria-controls={ctx.listId}
      onClick={() => ctx.setOpen(!ctx.open)}
      // Gooey: the edge facing the panel snaps flat (panel attached) then rounds back
      // once the panel pulls away — the two pinch apart.
      initial={false}
      animate={{
        borderTopLeftRadius: isTop ? kf : RADIUS,
        borderTopRightRadius: isTop ? kf : RADIUS,
        borderBottomLeftRadius: isTop ? RADIUS : kf,
        borderBottomRightRadius: isTop ? RADIUS : kf,
      }}
      transition={{
        borderTopLeftRadius: isTop ? kfT : INSTANT,
        borderTopRightRadius: isTop ? kfT : INSTANT,
        borderBottomLeftRadius: isTop ? INSTANT : kfT,
        borderBottomRightRadius: isTop ? INSTANT : kfT,
      }}
      className={cn(
        "relative z-10 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm text-foreground outline-none transition-colors",
        "hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Invalid mirrors the Input's treatment — red border + 3px red ring. Pair with `FieldError`.
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
      <motion.span
        aria-hidden
        animate={{ rotate: ctx.open ? 180 : 0 }}
        transition={ctx.reduce ? INSTANT : CHEVRON_TRANSITION}
        className="text-muted-foreground"
      >
        <ChevronDown className="size-4" />
      </motion.span>
    </motion.button>
  );
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const ctx = useSelectContext("SelectValue");
  const label = ctx.labelFor(ctx.value);
  const icon = ctx.multiple ? undefined : ctx.iconFor(ctx.value);
  const hasValue = ctx.multiple ? ctx.values.length > 0 : label !== undefined;
  const displayValue = ctx.multiple
    ? ctx.values.length === 0
      ? (placeholder ?? "Select")
      : `${ctx.values.length} selected`
    : (label ?? placeholder ?? "Select");

  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2 truncate",
        hasValue ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      <SelectItemIcon icon={icon} />
      <span className="truncate">{displayValue}</span>
    </span>
  );
}

export interface SelectContentProps {
  className?: string;
  children: ReactNode;
  /** Adds a plain filter field above the options, separated by a hairline. */
  searchable?: boolean;
  /** Placeholder for the optional panel filter field. */
  searchPlaceholder?: string;
  /** Message shown when a panel search has no matching options. */
  emptyMessage?: ReactNode;
}

export function SelectContent({
  className,
  children,
  searchable = false,
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
}: SelectContentProps) {
  const ctx = useSelectContext("SelectContent");
  const innerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [height, setHeight] = useState(0);
  const [noResults, setNoResults] = useState(false);
  const open = ctx.open;
  const { setActiveItem, setPlacement, searchQuery } = ctx;

  // Unlike the Base UI popup, this inline panel does not manage an active row for us.
  // Always mark the first visible option active; searchable panels then return DOM focus
  // to their input so typing remains immediate.
  useLayoutEffect(() => {
    if (!open) return;
    const option = focusPanelOption(listRef.current, null, "next");
    setActiveItem(option?.dataset.selectValue);
    if (searchable) searchRef.current?.focus();
  }, [open, searchable, searchQuery, setActiveItem]);

  useLayoutEffect(() => {
    if (!searchable || searchQuery.trim() === "") {
      setNoResults(false);
      return;
    }

    const hasVisibleOption = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    ).some((option) => !option.hidden);
    setNoResults(!hasVisibleOption);
  }, [searchQuery, searchable]);

  useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  });

  // On open, flip upward when there isn't room below and there's more above.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = document.getElementById(ctx.triggerId);
    const node = innerRef.current;
    if (!trigger || !node) return;
    const rect = trigger.getBoundingClientRect();
    const h = node.offsetHeight;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    setPlacement(below < h + 16 && above > below ? "top" : "bottom");
  }, [open, ctx.triggerId, setPlacement]);

  // Every corner + both margins are set each render. The near edge (facing the
  // trigger) animates flat->round and the gap opens on that side; the far edge stays
  // rounded with its margin pinned to 0. Setting all of them avoids a stranded square
  // corner when the placement flips between opens.
  const isTop = ctx.placement === "top";
  const nearGap = open ? 8 : 0;
  const nearRadius = open ? RADIUS : 0;

  const gapT: Transition = open
    ? { type: "spring", duration: 0.2, bounce: 0, delay: 0.03 }
    : { type: "spring", duration: 0.19, bounce: 0 };
  const radiusT: Transition = open
    ? { duration: 0.15, ease: ease.out, delay: 0.03 }
    : { duration: 0.11, ease: ease.out };

  // The panel stays mounted (open just animates it) so each item's label registration
  // persists — otherwise the trigger would fall back to the placeholder the moment the
  // panel closed.
  return (
    <motion.div
      aria-hidden={!open}
      initial={false}
      animate={
        ctx.reduce
          ? { opacity: open ? 1 : 0, height: open ? height : 0 }
          : {
              opacity: open ? 1 : 0,
              height: open ? height : 0,
              marginTop: isTop ? 0 : nearGap,
              marginBottom: isTop ? nearGap : 0,
              borderTopLeftRadius: isTop ? RADIUS : nearRadius,
              borderTopRightRadius: isTop ? RADIUS : nearRadius,
              borderBottomLeftRadius: isTop ? nearRadius : RADIUS,
              borderBottomRightRadius: isTop ? nearRadius : RADIUS,
            }
      }
      transition={
        ctx.reduce
          ? { duration: 0.12 }
          : {
              opacity: open ? { duration: 0.12 } : { duration: 0.11, delay: 0.08 },
              height: open
                ? { type: "spring", duration: 0.23, bounce: 0 }
                : { duration: 0.16, ease: ease.out, delay: 0.08 },
              marginTop: isTop ? INSTANT : gapT,
              marginBottom: isTop ? gapT : INSTANT,
              borderTopLeftRadius: isTop ? INSTANT : radiusT,
              borderTopRightRadius: isTop ? INSTANT : radiusT,
              borderBottomLeftRadius: isTop ? radiusT : INSTANT,
              borderBottomRightRadius: isTop ? radiusT : INSTANT,
            }
      }
      style={{
        transformOrigin: isTop ? "bottom" : "top",
        overflow: "hidden",
        pointerEvents: open ? "auto" : "none",
      }}
      className={cn(
        // Same `border` as the trigger so the two edges match, plus the ring-less
        // overlay lift (the full shadow-overlay adds its own hairline, which stacked
        // with this border into a doubled, too-heavy edge).
        "absolute right-0 left-0 z-20 rounded-md border border-border bg-surface shadow-overlay-drop",
        isTop ? "bottom-full" : "top-full",
        className,
      )}
    >
      <motion.div
        ref={innerRef}
        // The header sits outside the listbox: an input cannot be a listbox child.
        // `innerRef` still measures both parts, so the panel's unfold includes it.
      >
        {searchable && (
          <div className="relative border-b border-border px-2 py-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={searchRef}
              aria-label="Search options"
              variant="plain"
              value={ctx.searchQuery}
              onChange={(event) => ctx.setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  focusPanelOption(
                    listRef.current,
                    null,
                    event.key === "ArrowDown" ? "next" : "previous",
                  );
                  return;
                }
                if (event.key !== "Escape") event.stopPropagation();
              }}
              placeholder={searchPlaceholder}
              className="h-8 pl-8"
            />
          </div>
        )}
        <motion.div
          ref={listRef}
          id={ctx.listId}
          role="listbox"
          aria-labelledby={ctx.triggerId}
          aria-multiselectable={ctx.multiple || undefined}
          variants={ctx.reduce ? undefined : LIST_VARIANTS}
          initial={false}
          animate={open ? "show" : "hidden"}
          // Capped so a long list scrolls (the panel unfolds to this height) rather than
          // growing without bound. Not portaled, so `--available-height` isn't set — 18rem.
          className={cn("max-h-72 overflow-y-auto p-1", SCROLLBAR, noResults && "hidden")}
        >
          {children}
        </motion.div>
        {noResults && (
          <div className="m-1 flex h-8 items-center justify-center px-2.5 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  children: ReactNode;
  /** Text used by an ancestor searchable `SelectContent` to match this option. */
  searchValue?: string;
}

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
  value,
  disabled = false,
  className,
  icon,
  children,
  searchValue,
}: SelectItemProps) {
  const ctx = useSelectContext("SelectItem");
  const { register, unregister } = ctx;
  const { registerIcon, unregisterIcon } = ctx;
  const [pointerHighlighted, setPointerHighlighted] = useState(false);
  const selected = ctx.values.includes(value);
  const label = typeof children === "string" ? children : value;
  const optionText = searchValue ?? label;
  const hiddenBySearch =
    ctx.searchQuery.trim() !== "" &&
    !optionText.toLocaleLowerCase().includes(ctx.searchQuery.trim().toLocaleLowerCase());
  const itemDisabled = disabled || hiddenBySearch;
  const panelActive = ctx.open && ctx.activeItem === value;

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  useLayoutEffect(() => {
    register(value, label);
    return () => unregister(value);
  }, [register, unregister, value, label]);

  const itemClassName = cn(
    "flex w-full cursor-pointer items-center rounded-xs px-2.5 py-1.5 text-left text-sm outline-none",
    ctx.multiple ? "gap-2.5" : "gap-2",
    ctx.multiple
      ? "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[selected]:text-foreground"
      : selected
        ? "text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
    "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    className,
  );

  const pointerHighlightProps = {
    "data-highlighted": pointerHighlighted ? "" : undefined,
    onPointerEnter: () => {
      setPointerHighlighted(true);
      ctx.setActiveItem(value);
    },
    onPointerLeave: () => setPointerHighlighted(false),
  };

  if (ctx.multiple) {
    return (
      <motion.li
        variants={ctx.reduce ? undefined : ITEM_VARIANTS}
        role="option"
        aria-selected={selected}
        aria-disabled={itemDisabled || undefined}
        data-selected={selected ? "" : undefined}
        data-panel-active={panelActive || undefined}
        data-select-value={value}
        hidden={hiddenBySearch}
        tabIndex={itemDisabled ? -1 : 0}
        {...pointerHighlightProps}
        onFocus={() => ctx.setActiveItem(value)}
        onClick={itemDisabled ? undefined : () => ctx.select(value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusPanelOption(
              document.getElementById(ctx.listId),
              event.currentTarget,
              event.key === "ArrowDown" ? "next" : "previous",
            );
            return;
          }
          if (itemDisabled || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          ctx.select(value);
        }}
        className={itemClassName}
      >
        {/* The real Checkbox is inert: this option owns the click and listbox ARIA. */}
        <Checkbox
          checked={selected}
          size="sm"
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none shrink-0"
        />
        <SelectItemIcon icon={icon} />
        <span className="flex-1 truncate">{children}</span>
      </motion.li>
    );
  }

  return (
    <motion.li variants={ctx.reduce ? undefined : ITEM_VARIANTS}>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        data-selected={selected ? "" : undefined}
        data-panel-active={panelActive || undefined}
        data-select-value={value}
        disabled={itemDisabled}
        hidden={hiddenBySearch}
        {...pointerHighlightProps}
        onFocus={() => ctx.setActiveItem(value)}
        onClick={() => ctx.select(value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusPanelOption(
              document.getElementById(ctx.listId),
              event.currentTarget,
              event.key === "ArrowDown" ? "next" : "previous",
            );
          }
        }}
        className={cn("justify-between", itemClassName)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <SelectItemIcon icon={icon} />
          <span className="truncate">{children}</span>
        </span>
        {selected ? <Check className="size-3.5 shrink-0" /> : null}
      </button>
    </motion.li>
  );
}
