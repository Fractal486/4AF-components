"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A searchable select — type to filter the list, then pick one. On Base UI's Combobox.
 *
 * The behaviour is the combobox ARIA pattern done right: the input filters the `items`
 * as you type (Base UI matches against each item's label), the arrows and Enter move and
 * commit the highlight, Escape reverts, and the whole thing is a real labelled listbox
 * bound to the input — none of it hand-rolled. Pass plain `{ value, label }` items and
 * Base UI uses the label for display and matching automatically.
 *
 * It looks like the Base UI `select.tsx` — same field, chevron and fade-in panel — but
 * the trigger is an editable input rather than a button, because searching is the point.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// The panel blurs and scales in from the trigger edge (`--transform-origin`), matching
// the Base UI select.
const FADE_HIDDEN = { opacity: 0, scale: 0.98, filter: "blur(4px)" };
const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

const SearchOpenContext = createContext(false);

export interface SearchSelectProps<Value>
  extends Omit<ComponentProps<typeof Combobox.Root<Value>>, "children"> {
  children: ReactNode;
}

export function SearchSelect<Value>({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: SearchSelectProps<Value>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  const handleOpenChange = useCallback<NonNullable<SearchSelectProps<Value>["onOpenChange"]>>(
    (next, details) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next, details);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SearchOpenContext.Provider value={isOpen}>
      <Combobox.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        defaultOpen={defaultOpen}
        {...props}
      >
        {children}
      </Combobox.Root>
    </SearchOpenContext.Provider>
  );
}

export function SearchSelectInput({
  className,
  tone = "neutral",
  ...props
}: Omit<ComponentProps<typeof Combobox.Input>, "className"> & {
  className?: string;
  /**
   * Focus colour. `neutral` is a quiet grey (the default — a field you type into the
   * whole time you're searching shouldn't sit lit in the accent); `accent` uses the
   * `--ring` token, matching every other focusable control in the app.
   */
  tone?: "neutral" | "accent";
}) {
  const open = useContext(SearchOpenContext);
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <Combobox.Input
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface pr-9 pl-3.5 text-sm text-foreground",
          "outline-none placeholder:text-muted-foreground",
          "transition-[border-color,box-shadow,color] duration-(--duration-fast) ease-out",
          "hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50",
          tone === "accent"
            ? "focus:border-ring focus:ring-[3px] focus:ring-ring/25"
            : "focus:border-[oklch(0.719_0_0)] focus:shadow-[0_0_0_3px_oklch(0.390_0_0_/_0.502)]",
          className,
        )}
        {...props}
      />
      {/* Opens/closes the list; the input itself opens it on focus/typing too. */}
      <Combobox.Trigger
        aria-label="Toggle list"
        className={cn(
          "absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
          }
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </Combobox.Trigger>
    </div>
  );
}

export function SearchSelectContent({
  className,
  children,
  emptyMessage = "No results.",
  sideOffset = 6,
  ...props
}: Omit<ComponentProps<typeof Combobox.Popup>, "className" | "children"> & {
  className?: string;
  /** The List render function — `(item, index) => <SearchSelectItem …>`. */
  children: ComponentProps<typeof Combobox.List>["children"];
  emptyMessage?: ReactNode;
  sideOffset?: number;
}) {
  const reduceMotion = useReducedMotion();
  const open = useContext(SearchOpenContext);

  return (
    <Combobox.Portal>
      <Combobox.Positioner
        sideOffset={sideOffset}
        side="bottom"
        align="start"
        className="z-50 w-[var(--anchor-width)] outline-none"
      >
        {/* Fade driven off `open` (not Motion's mount) so it replays every open — Base UI
            keeps the popup mounted after the first one. */}
        <Combobox.Popup
          className={cn(
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
          {/* Base UI keeps this div mounted and only nulls its children when there are
              matches; `empty:hidden` collapses it then, so it doesn't reserve blank space
              above the results. */}
          <Combobox.Empty className="flex items-center justify-center px-3 py-3 text-center text-sm text-muted-foreground empty:hidden">
            {emptyMessage}
          </Combobox.Empty>
          <Combobox.List
            className={cn(
              "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
              SCROLLBAR,
            )}
          >
            {children}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}

export function SearchSelectItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Combobox.Item>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Combobox.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
        "text-muted-foreground",
        // Base UI moves this highlight with the keyboard as well as the pointer; it snaps
        // (no transition) so it keeps up with arrow-key navigation rather than lagging.
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      <Combobox.ItemIndicator className="shrink-0 text-foreground">
        <Check className="size-3.5" />
      </Combobox.ItemIndicator>
    </Combobox.Item>
  );
}
