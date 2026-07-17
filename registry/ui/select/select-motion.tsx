"use client";

import { Check, ChevronDown } from "lucide-react";
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
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  reduce: boolean;
  triggerId: string;
  listId: string;
  disabled: boolean;
  placement: Placement;
  setPlacement: (p: Placement) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error(`${component} must be used within <Select>`);
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
}: SelectProps) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [placement, setPlacement] = useState<Placement>("bottom");

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [controlled, onValueChange],
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
      value: current,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor: (v) => (v === undefined ? undefined : labels.get(v)),
      reduce,
      triggerId: `${baseId}-trigger`,
      listId: `${baseId}-list`,
      disabled,
      placement,
      setPlacement,
    }),
    [current, open, select, register, unregister, labels, reduce, baseId, disabled, placement],
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
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
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
  return (
    <span className={cn(label ? "text-foreground" : "text-muted-foreground", className)}>
      {label ?? placeholder ?? "Select"}
    </span>
  );
}

export interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

export function SelectContent({ className, children }: SelectContentProps) {
  const ctx = useSelectContext("SelectContent");
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const open = ctx.open;
  const { setPlacement } = ctx;

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
      id={ctx.listId}
      role="listbox"
      aria-labelledby={ctx.triggerId}
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
        variants={ctx.reduce ? undefined : LIST_VARIANTS}
        initial={false}
        animate={open ? "show" : "hidden"}
        // Capped so a long list scrolls (the panel unfolds to this height) rather than
        // growing without bound. Not portaled, so `--available-height` isn't set — 18rem.
        className={cn("max-h-72 overflow-y-auto p-1", SCROLLBAR)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function SelectItem({ value, disabled = false, className, children }: SelectItemProps) {
  const ctx = useSelectContext("SelectItem");
  const { register, unregister } = ctx;
  const selected = ctx.value === value;
  const label = typeof children === "string" ? children : value;

  useLayoutEffect(() => {
    register(value, label);
    return () => unregister(value);
  }, [register, unregister, value, label]);

  return (
    <motion.li variants={ctx.reduce ? undefined : ITEM_VARIANTS}>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        onClick={() => ctx.select(value)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xs px-2.5 py-1.5 text-left text-sm outline-none",
          selected
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        {children}
        {selected ? <Check className="size-3.5 shrink-0" /> : null}
      </button>
    </motion.li>
  );
}
