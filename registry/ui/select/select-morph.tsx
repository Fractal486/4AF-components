"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from "motion/react";
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

/**
 * A select whose trigger *morphs* into the panel — the beUI morph variant.
 *
 * The sibling `select-motion.tsx` opens a separate panel that unfolds off the
 * trigger; this one never detaches. Trigger and panel share a `layoutId`, so the
 * single closed box grows into the open menu and shrinks back — one continuous
 * surface, a Motion shared-layout (FLIP) animation, which is exactly the case CSS
 * can't do. Like the others it's hand-rolled (no behaviour primitive): its
 * outside-click, Escape and label bookkeeping are manual, so reach for the Base UI
 * `select.tsx` when you need real typeahead and roving focus.
 */

// Our resting corner is --radius-md (7px), matching the default Button; the morphing
// surface animates to it.
const RADIUS = 7;

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

// Shared-layout morph: the trigger box grows into the panel and back, one surface.
// Smooth spring, no overshoot.
const MORPH: Transition = { type: "spring", duration: 0.5, bounce: 0 };
// The chevron flip — same spring as the `select-motion` variant so the two feel
// identical, and decoupled from MORPH so the arrow keeps its own snappier timing.
const CHEVRON: Transition = { type: "spring", duration: 0.21, bounce: 0 };
// Trigger and panel header share this row so the morph stays seamless.
const ROW = "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm";

const LIST: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

interface MorphContextValue {
  value: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  placeholder: string;
  setPlaceholder: (p: string) => void;
  reduce: boolean;
  layoutId: string;
  triggerId: string;
  listId: string;
  disabled: boolean;
}

const MorphContext = createContext<MorphContextValue | null>(null);

function useMorphContext(component: string) {
  const ctx = useContext(MorphContext);
  if (!ctx) throw new Error(`${component} must be used within <MorphSelect>`);
  return ctx;
}

export interface MorphSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function MorphSelect({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
}: MorphSelectProps) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  // Ref-counted: items render twice (hidden registrar + open panel), so a label is
  // only dropped once every copy with that value has unmounted.
  const [labels, setLabels] = useState<Map<string, { label: string; count: number }>>(
    new Map(),
  );
  const [placeholder, setPlaceholder] = useState("Select");

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
    setLabels((m) => {
      const next = new Map(m);
      next.set(v, { label, count: (m.get(v)?.count ?? 0) + 1 });
      return next;
    });
  }, []);
  const unregister = useCallback((v: string) => {
    setLabels((m) => {
      const entry = m.get(v);
      if (!entry) return m;
      const next = new Map(m);
      if (entry.count <= 1) next.delete(v);
      else next.set(v, { label: entry.label, count: entry.count - 1 });
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

  const ctx = useMemo<MorphContextValue>(
    () => ({
      value: current,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor: (v) => (v === undefined ? undefined : labels.get(v)?.label),
      placeholder,
      setPlaceholder,
      reduce,
      layoutId: `${baseId}-surface`,
      triggerId: `${baseId}-trigger`,
      listId: `${baseId}-list`,
      disabled,
    }),
    [current, open, select, register, unregister, labels, placeholder, reduce, baseId, disabled],
  );

  return (
    <MorphContext.Provider value={ctx}>
      <div ref={rootRef} className={cn("relative", className)}>
        {children}
      </div>
    </MorphContext.Provider>
  );
}

export interface MorphSelectValueProps {
  placeholder?: string;
  className?: string;
}

export function MorphSelectValue({ placeholder, className }: MorphSelectValueProps) {
  const ctx = useMorphContext("MorphSelectValue");
  const { setPlaceholder } = ctx;
  // Surface the placeholder so the morph header (rendered by the content) matches.
  useEffect(() => {
    if (placeholder) setPlaceholder(placeholder);
  }, [placeholder, setPlaceholder]);
  const label = ctx.labelFor(ctx.value);
  return (
    <span className={cn(label ? "text-foreground" : "text-muted-foreground", className)}>
      {label ?? placeholder ?? "Select"}
    </span>
  );
}

export interface MorphSelectTriggerProps {
  className?: string;
  children: ReactNode;
}

export function MorphSelectTrigger({ className, children }: MorphSelectTriggerProps) {
  const ctx = useMorphContext("MorphSelectTrigger");
  return (
    <>
      {/* Invisible sizer reserves the closed height — the morph surface is absolute, so
          this keeps the surrounding layout from shifting. */}
      <div aria-hidden className={cn(ROW, "invisible rounded-md border border-border")}>
        {children}
        <ChevronDown className="size-4" />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {!ctx.open ? (
          <motion.button
            key="trigger"
            layoutId={ctx.layoutId}
            type="button"
            id={ctx.triggerId}
            disabled={ctx.disabled}
            aria-haspopup="listbox"
            aria-expanded={ctx.open}
            aria-controls={ctx.listId}
            onClick={() => ctx.setOpen(true)}
            transition={ctx.reduce ? { duration: 0 } : MORPH}
            style={{ borderRadius: RADIUS }}
            className={cn(
              ROW,
              "absolute inset-x-0 top-0 z-10 cursor-pointer border border-border bg-surface text-foreground outline-none transition-colors",
              "hover:border-border-strong",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-50",
              className,
            )}
          >
            <motion.span layout="position" className="min-w-0 truncate">
              {children}
            </motion.span>
            <motion.span layout="position" className="text-muted-foreground">
              <ChevronDown className="size-4" />
            </motion.span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export interface MorphSelectContentProps {
  className?: string;
  children: ReactNode;
}

export function MorphSelectContent({ className, children }: MorphSelectContentProps) {
  const ctx = useMorphContext("MorphSelectContent");
  const label = ctx.labelFor(ctx.value);
  return (
    <>
      {/* Always mounted, hidden — keeps item label registrations alive while closed, so
          the trigger shows the selected value before the first open. */}
      <div className="hidden">{children}</div>

      <AnimatePresence initial={false} mode="popLayout">
        {ctx.open ? (
          <motion.div
            key="panel"
            layoutId={ctx.layoutId}
            id={ctx.listId}
            role="listbox"
            aria-labelledby={ctx.triggerId}
            transition={ctx.reduce ? { duration: 0 } : MORPH}
            style={{ borderRadius: RADIUS }}
            // Same `border` as the trigger so the morphing edge stays consistent, plus the
            // ring-less overlay lift (shadow-overlay's own hairline would double the edge).
            className={cn(
              "absolute inset-x-0 top-0 z-30 overflow-hidden border border-border bg-surface shadow-overlay-drop",
              className,
            )}
          >
            {/* Header mirrors the trigger (continuous morph) and collapses the panel back
                into the trigger when clicked. */}
            <motion.button
              type="button"
              layout="position"
              aria-expanded
              onClick={() => ctx.setOpen(false)}
              className={cn(ROW, "cursor-pointer outline-none")}
            >
              <span
                className={cn(
                  "min-w-0 truncate",
                  label ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label ?? ctx.placeholder}
              </span>
              <motion.span
                initial={{ rotate: 0 }}
                animate={{ rotate: 180 }}
                exit={{ rotate: 0 }}
                transition={ctx.reduce ? { duration: 0 } : CHEVRON}
                className="text-muted-foreground"
              >
                <ChevronDown className="size-4" />
              </motion.span>
            </motion.button>

            <div className="h-px bg-border" />

            <motion.ul
              initial="hidden"
              animate="show"
              variants={ctx.reduce ? undefined : LIST}
              // Capped so a long list scrolls rather than growing the morph without bound.
              className={cn("max-h-72 overflow-y-auto p-1", SCROLLBAR)}
            >
              {children}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export interface MorphSelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function MorphSelectItem({
  value,
  disabled = false,
  className,
  children,
}: MorphSelectItemProps) {
  const ctx = useMorphContext("MorphSelectItem");
  const { register, unregister } = ctx;
  const selected = ctx.value === value;
  const label = typeof children === "string" ? children : value;

  useLayoutEffect(() => {
    register(value, label);
    return () => unregister(value);
  }, [register, unregister, value, label]);

  return (
    <motion.li variants={ctx.reduce ? undefined : ITEM}>
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
