"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, spring } from "@/registry/lib/motion";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";

/**
 * A searchable select whose Base UI popup unfolds with Motion.
 *
 * The behaviour stays entirely with Base UI's Combobox: filtering, typeahead, arrow-key
 * navigation, Enter/Escape, focus management, collision-aware positioning, form values,
 * and listbox ARIA. Motion only owns opening and closing: the panel clips from the input's
 * edge — the Motion Select's signature move, not a generic scale — while
 * filtering resizes it (the same height spring, so results settle rather than jump). With
 * an `items` collection, Base UI keeps the first visible option highlighted on open,
 * reopen, and after the query changes, so Enter chooses it immediately.
 *
 * It deliberately remains a Base UI portal. An inline Combobox list is always visible and
 * would make us rebuild dismiss and focus behaviour just to get the Motion Select's DOM
 * shape back — the wrong trade for a search control.
 */

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

const EMPTY_ITEMS: readonly never[] = [];

/**
 * The two sizes, mirroring Button. `sm` (32px) is the compact default; `md` (36px) matches
 * Button's `md` and the Input for form rows. The size flows through context so the input
 * trigger and the option rows scale together.
 */
export type SelectSize = "sm" | "md";

const SIZE: Record<SelectSize, { field: string; glyph: string; iconSlot: string; row: string }> = {
  sm: { field: "h-8 text-xs", glyph: "size-3.5", iconSlot: "size-3.5 [&>svg]:size-3.5", row: "text-xs" },
  md: { field: "h-9 text-sm", glyph: "size-4", iconSlot: "size-4 [&>svg]:size-4", row: "text-sm" },
};

interface MotionSearchContextValue {
  open: boolean;
  multiple: boolean;
  size: SelectSize;
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
}

const MotionSearchContext = createContext<MotionSearchContextValue>({
  open: false,
  multiple: false,
  size: "sm",
  registerIcon: () => {},
  unregisterIcon: () => {},
  iconFor: () => undefined,
});

export interface MotionSearchSelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends Omit<ComponentProps<typeof Combobox.Root<Value, Multiple>>, "children"> {
  /** Resolves the icon shown in the closed single-select value. */
  iconForValue?: (value: Value) => ReactNode | undefined;
  /** Compact 32px (`sm`, default) or the 36px form-row size (`md`). @default "sm" */
  size?: SelectSize;
  children: ReactNode;
}

export function MotionSearchSelect<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  children,
  multiple,
  items,
  iconForValue,
  size = "sm",
  ...props
}: MotionSearchSelectProps<Value, Multiple>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
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
  const [closedRegistryCleared, setClosedRegistryCleared] = useState(
    () => !isOpen && items !== undefined,
  );

  // Base UI normally remembers the selected item as the starting point for the next open.
  // Search selects instead begin at the first visible choice, so clear that registry only
  // after its close transition completes. The real items remain in the exiting panel and
  // are restored in the same render that opens the list.
  const visibleItems =
    !isOpen && closedRegistryCleared && items !== undefined ? EMPTY_ITEMS : items;

  useEffect(() => {
    if (isOpen) setClosedRegistryCleared(false);
  }, [isOpen]);

  const handleOpenChange = useCallback<
    NonNullable<MotionSearchSelectProps<Value, Multiple>["onOpenChange"]>
  >(
    (next, details) => {
      // Base UI closes a filtered multi-combobox whose input is outside the popup after
      // every item press. A checkbox list needs to remain available for the next choice,
      // so cancel that one attempted close before it can change either state or callback.
      if (multiple && !next && details.reason === "item-press") {
        details.cancel();
        return;
      }

      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
    },
    [isControlled, multiple, onOpenChange],
  );

  const handleOpenChangeComplete = useCallback(
    (next: boolean) => {
      if (!next && !isOpen && items !== undefined) {
        setClosedRegistryCleared(true);
      }

      onOpenChangeComplete?.(next);
    },
    [isOpen, items, onOpenChangeComplete],
  );

  return (
    <MotionSearchContext.Provider
      value={{
        open: isOpen,
        multiple: Boolean(multiple),
        size,
        registerIcon,
        unregisterIcon,
        iconFor,
      }}
    >
      <Combobox.Root<Value, Multiple>
        open={isOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        defaultOpen={defaultOpen}
        multiple={multiple}
        items={visibleItems}
        {...props}
        // Base UI's public Combobox type narrows this richer Aria Combobox mode to a
        // boolean. Runtime support for `always` keeps the first visible row highlighted.
        autoHighlight={"always" as never}
      >
        {children}
      </Combobox.Root>
    </MotionSearchContext.Provider>
  );
}

export interface MotionSearchSelectInputProps
  extends Omit<ComponentProps<typeof Combobox.Input>, "className"> {
  className?: string;
  /**
   * Focus colour. `neutral` is quiet grey; `accent` uses the library focus ring.
   * @default "neutral"
   */
  tone?: "neutral" | "accent";
}

export function MotionSearchSelectInput({
  className,
  tone = "neutral",
  placeholder,
  onFocus,
  onBlur,
  ...props
}: MotionSearchSelectInputProps) {
  const { open, multiple, iconFor, size } = useContext(MotionSearchContext);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <Combobox.Value>
        {(selectedValue) => {
          const selectedIcon = !focused && !multiple
            ? iconFor(selectedValue)
            : undefined;

          return (
            <>
              <MotionSearchSelectItemIcon
                icon={selectedIcon}
                size={size}
                className="absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <Combobox.Input
                className={cn(
                  "w-full rounded-md border border-border bg-surface pr-9 pl-3.5 text-foreground",
                  SIZE[size].field,
                  "outline-none placeholder:text-muted-foreground",
                  "transition-[border-color,box-shadow,color] duration-(--duration-fast) ease-out",
                  "hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50",
                  // Invalid mirrors the Input's treatment; `shadow-none` clears the neutral
                  // tone's grey focus shadow so only the red reads through. Pair with `Alert`.
                  "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25 aria-invalid:shadow-none",
                  selectedIcon && "pl-10",
                  tone === "accent"
                    ? "focus:border-ring focus:ring-[3px] focus:ring-ring/25"
                    : "focus:border-[oklch(0.719_0_0)] focus:shadow-[0_0_0_3px_oklch(0.390_0_0_/_0.502)]",
                  className,
                )}
                placeholder={
                  !focused && multiple && Array.isArray(selectedValue) && selectedValue.length > 0
                    ? `${selectedValue.length} selected`
                    : placeholder
                }
                onFocus={(event) => {
                  setFocused(true);
                  onFocus?.(event);
                }}
                onBlur={(event) => {
                  setFocused(false);
                  onBlur?.(event);
                }}
                {...props}
              />
            </>
          );
        }}
      </Combobox.Value>
      <Combobox.Trigger
        aria-label="Toggle list"
        className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : spring.clean}
        >
          <ChevronDown className={SIZE[size].glyph} />
        </motion.span>
      </Combobox.Trigger>
    </div>
  );
}

export interface MotionSearchSelectContentProps
  extends Omit<ComponentProps<typeof Combobox.Popup>, "className" | "children"> {
  className?: string;
  /** The List render function — `(item, index) => <MotionSearchSelectItem …>`. */
  children: ComponentProps<typeof Combobox.List>["children"];
  emptyMessage?: ReactNode;
  sideOffset?: number;
}

export function MotionSearchSelectContent({
  className,
  children,
  emptyMessage = "No results.",
  sideOffset = 6,
  ...props
}: MotionSearchSelectContentProps) {
  const reduceMotion = useReducedMotion();
  const { size } = useContext(MotionSearchContext);

  return (
    <Combobox.Portal keepMounted>
      <Combobox.Positioner
        sideOffset={sideOffset}
        side="bottom"
        align="start"
        className="z-50 w-[var(--anchor-width)] outline-none"
      >
        <Combobox.Popup
          className={cn(
            "overflow-hidden rounded-md border border-border bg-surface shadow-overlay-drop",
            className,
          )}
          render={(popupProps, state) => (
            <motion.div
              {...(popupProps as unknown as HTMLMotionProps<"div">)}
              // Clip the fully laid-out list from the trigger edge. Unlike a height spring,
              // this stays on the compositor and does not reflow every row on each frame.
              style={{ ...(popupProps.style as CSSProperties), overflow: "hidden" }}
              initial={false}
              animate={{
                opacity: state.open ? 1 : 0,
                clipPath: state.open ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      opacity: state.open
                        ? { duration: duration.fast }
                        : { duration: duration.fast, delay: 0.04 },
                      clipPath: state.open
                        ? { duration: duration.base, ease: ease.out }
                        : { duration: duration.fast, ease: ease.in },
                    }
              }
            />
          )}
          {...props}
        >
          <Combobox.Empty className={cn("m-1 flex h-8 items-center justify-center px-2.5 text-center text-muted-foreground empty:hidden", SIZE[size].row)}>
            {emptyMessage}
          </Combobox.Empty>
          <Combobox.List
            className={cn(
              "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1 empty:hidden",
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

export interface MotionSearchSelectItemProps
  extends Omit<ComponentProps<typeof Combobox.Item>, "className"> {
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function MotionSearchSelectItemIcon({
  icon,
  size,
  className,
}: {
  icon?: ReactNode;
  size: SelectSize;
  className?: string;
}) {
  if (icon == null) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center",
        SIZE[size].iconSlot,
        className,
      )}
    >
      {icon}
    </span>
  );
}

export function MotionSearchSelectItem({
  className,
  icon,
  children,
  value,
  ...props
}: MotionSearchSelectItemProps) {
  const { registerIcon, unregisterIcon, size } = useContext(MotionSearchContext);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  return (
    <Combobox.Item
      value={value}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        className,
      )}
      {...props}
    >
      <MotionSearchSelectItemIcon icon={icon} size={size} />
      <span className="flex-1 truncate">{children}</span>
      <Combobox.ItemIndicator className="shrink-0 text-foreground">
        <Check className="size-3.5" />
      </Combobox.ItemIndicator>
    </Combobox.Item>
  );
}

/**
 * A checkbox row for `MotionSearchSelect` in `multiple` mode.
 *
 * The surrounding Combobox item remains the one interactive listbox option. The checkbox
 * mirrors its selected state with the shared animated Checkbox component, but is hidden
 * and non-focusable so keyboard navigation and screen-reader semantics stay with the row.
 */
export interface MotionSearchMultiSelectItemProps
  extends Omit<ComponentProps<typeof Combobox.Item>, "className"> {
  /** An optional icon shown after the checkbox and before the label. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function MotionSearchMultiSelectItem({
  className,
  icon,
  children,
  value,
  ...props
}: MotionSearchMultiSelectItemProps) {
  const { registerIcon, unregisterIcon, size } = useContext(MotionSearchContext);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  return (
    <Combobox.Item
      value={value}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <Combobox.ItemIndicator
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
      <MotionSearchSelectItemIcon icon={icon} size={size} />
      <span className="flex-1 truncate">{children}</span>
    </Combobox.Item>
  );
}
