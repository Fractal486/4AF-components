"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
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
import { Checkbox } from "@/registry/ui/checkbox/checkbox";

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
}

const SelectContext = createContext<SelectContextValue>({ open: false, multiple: false });

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// The pane blurs and scales in as one piece — no height unfold, no per-item stagger.
// Scales from `--transform-origin` (the trigger edge).
const FADE_HIDDEN = { opacity: 0, scale: 0.98, filter: "blur(4px)" };
const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

export interface SelectProps<Value, Multiple extends boolean | undefined = false>
  extends Omit<ComponentProps<typeof BaseSelect.Root<Value, Multiple>>, "children"> {
  children: ReactNode;
}

export function Select<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  children,
  multiple,
  ...props
}: SelectProps<Value, Multiple>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

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
    <SelectContext.Provider value={{ open: isOpen, multiple: Boolean(multiple) }}>
      <BaseSelect.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        defaultOpen={defaultOpen}
        multiple={multiple}
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
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  const { multiple } = useContext(SelectContext);

  if (!multiple) {
    return (
      <BaseSelect.Value className={cn("truncate", className)} placeholder={placeholder} {...props}>
        {children}
      </BaseSelect.Value>
    );
  }

  return (
    <BaseSelect.Value className={cn("truncate", className)} placeholder={placeholder} {...props}>
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
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Trigger>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  const { open } = useContext(SelectContext);
  const reduceMotion = useReducedMotion();

  return (
    <BaseSelect.Trigger
      className={cn(
        "group flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3.5 text-sm text-foreground",
        "cursor-pointer outline-none select-none",
        "transition-[background-color,border-color] duration-(--duration-base) ease-out",
        "hover:border-border-strong data-[popup-open]:border-border-strong",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
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

export function SelectContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> & {
  className?: string;
  children?: ReactNode;
  sideOffset?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { open } = useContext(SelectContext);

  return (
    <BaseSelect.Portal>
      {/* Base UI handles the positioning and collision flip; `--transform-origin` points
          at the trigger's edge, so the unfold grows *from* the trigger whichever side it
          lands on. */}
      <BaseSelect.Positioner
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        side="bottom"
        className="z-50 w-[var(--anchor-width)] outline-none"
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
          <div
            className={cn(
              "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
              SCROLLBAR,
            )}
          >
            <BaseSelect.List>{children}</BaseSelect.List>
          </div>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Item>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  const { multiple } = useContext(SelectContext);

  if (multiple) {
    return (
      <BaseSelect.Item
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
          "text-muted-foreground",
          "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
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
        <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      </BaseSelect.Item>
    );
  }

  return (
    <BaseSelect.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
        "text-muted-foreground",
        // Base UI moves this highlight with the keyboard as well as the pointer; it snaps
        // (no transition) so it keeps up with arrow-key navigation rather than lagging.
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="shrink-0 text-foreground">
        <Check className="size-3.5" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
