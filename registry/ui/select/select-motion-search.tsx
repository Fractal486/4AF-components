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
import { duration, spring } from "@/registry/lib/motion";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";

/**
 * A searchable select whose Base UI popup unfolds with Motion.
 *
 * The behaviour stays entirely with Base UI's Combobox: filtering, typeahead, arrow-key
 * navigation, Enter/Escape, focus management, collision-aware positioning, form values,
 * and listbox ARIA. Motion only owns opening and closing: the panel reveals from the
 * input's edge, while filtering swaps rows and changes the panel size immediately.
 * With an `items` collection, Base UI keeps the first visible option highlighted on open,
 * reopen, and after the query changes, so Enter chooses it immediately.
 *
 * It deliberately remains a Base UI portal. An inline Combobox list is always visible and
 * would make us rebuild dismiss and focus behaviour just to get the Motion Select's DOM
 * shape back — the wrong trade for a search control.
 */

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

const EMPTY_ITEMS: readonly never[] = [];

// Base UI updates --transform-origin to the final collision-resolved edge. Scaling from that
// point lets the panel unfold away from the input whether it ends up above or below it.
const PANEL_HIDDEN = { opacity: 0, scale: 0.98, filter: "blur(3px)" };
const PANEL_VISIBLE = { opacity: 1, scale: 1, filter: "blur(0px)" };

const MotionSearchOpenContext = createContext(false);

export interface MotionSearchSelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends Omit<ComponentProps<typeof Combobox.Root<Value, Multiple>>, "children"> {
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
  ...props
}: MotionSearchSelectProps<Value, Multiple>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
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
    <MotionSearchOpenContext.Provider value={isOpen}>
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
    </MotionSearchOpenContext.Provider>
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
  const open = useContext(MotionSearchOpenContext);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <Combobox.Value>
        {(selectedValue) => (
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
            placeholder={
              !focused && Array.isArray(selectedValue) && selectedValue.length > 0
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
        )}
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
          <ChevronDown className="size-4" />
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

  return (
    <Combobox.Portal>
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
              // Base UI's positioning styles still apply; its collision-aware origin is the
              // only positional input Motion needs for the reveal.
              style={{
                ...(popupProps.style as CSSProperties),
                transformOrigin: "var(--transform-origin)",
              }}
              initial={reduceMotion ? { opacity: 0 } : PANEL_HIDDEN}
              animate={
                reduceMotion
                  ? { opacity: state.open ? 1 : 0 }
                  : state.open
                    ? PANEL_VISIBLE
                    : PANEL_HIDDEN
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      opacity: { duration: duration.fast },
                      scale: spring.clean,
                      filter: { duration: duration.fast },
                    }
              }
            />
          )}
          {...props}
        >
          <Combobox.Empty className="m-1 flex h-8 items-center justify-center px-2.5 text-center text-sm text-muted-foreground empty:hidden">
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
  className?: string;
  children?: ReactNode;
}

export function MotionSearchSelectItem({
  className,
  children,
  ...props
}: MotionSearchSelectItemProps) {
  return (
    <Combobox.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
        "text-muted-foreground",
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

/**
 * A checkbox row for `MotionSearchSelect` in `multiple` mode.
 *
 * The surrounding Combobox item remains the one interactive listbox option. The checkbox
 * mirrors its selected state with the shared animated Checkbox component, but is hidden
 * and non-focusable so keyboard navigation and screen-reader semantics stay with the row.
 */
export interface MotionSearchMultiSelectItemProps
  extends Omit<ComponentProps<typeof Combobox.Item>, "className"> {
  className?: string;
  children?: ReactNode;
}

export function MotionSearchMultiSelectItem({
  className,
  children,
  ...props
}: MotionSearchMultiSelectItemProps) {
  return (
    <Combobox.Item
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
      <span className="flex-1 truncate">{children}</span>
    </Combobox.Item>
  );
}
