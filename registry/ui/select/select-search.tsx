"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";

/**
 * A searchable single or multi-select — type to filter the list, then pick one or more.
 * On Base UI's Combobox.
 *
 * The behaviour is the combobox ARIA pattern done right: the input filters the `items`
 * as you type (Base UI matches against each item's label), the arrows and Enter move and
 * commit the highlight, Escape reverts, and the whole thing is a real labelled listbox
 * bound to the input — none of it hand-rolled. Pass plain `{ value, label }` items and
 * Base UI uses the label for display and matching automatically.
 *
 * It looks like the Base UI `select.tsx` — same field, chevron and fade-in panel — but
 * the trigger is an editable input rather than a button, because searching is the point.
 * Pass `multiple` for an open checkbox list; whenever its input is not focused, the field
 * summarizes the current choice as “N selected”.
 * With an `items` collection, every search select opens, reopens, and filters from the
 * first visible row so Enter immediately chooses it.
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

const EMPTY_ITEMS: readonly never[] = [];

interface SearchContextValue {
  open: boolean;
  multiple: boolean;
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
}

const SearchContext = createContext<SearchContextValue>({
  open: false,
  multiple: false,
  registerIcon: () => {},
  unregisterIcon: () => {},
  iconFor: () => undefined,
});

export interface SearchSelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends Omit<ComponentProps<typeof Combobox.Root<Value, Multiple>>, "children"> {
  /** Resolves the icon shown in the closed single-select value. */
  iconForValue?: (value: Value) => ReactNode | undefined;
  children: ReactNode;
}

export function SearchSelect<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  children,
  multiple,
  items,
  iconForValue,
  ...props
}: SearchSelectProps<Value, Multiple>) {
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

  // Base UI normally restores the selected item as the active row. Search selects instead
  // start at the first visible match, so clear that lookup after the close transition. The
  // actual items remain available to the exiting panel and return in the same render that
  // opens the list.
  const visibleItems =
    !isOpen && closedRegistryCleared && items !== undefined ? EMPTY_ITEMS : items;

  useEffect(() => {
    if (isOpen) setClosedRegistryCleared(false);
  }, [isOpen]);

  const handleOpenChange = useCallback<
    NonNullable<SearchSelectProps<Value, Multiple>["onOpenChange"]>
  >(
    (next, details) => {
      // A multi-combobox otherwise closes after every item press. Keeping it open lets a
      // keyboard or pointer user choose several filtered results in one pass.
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
    <SearchContext.Provider
      value={{ open: isOpen, multiple: Boolean(multiple), registerIcon, unregisterIcon, iconFor }}
    >
      <Combobox.Root<Value, Multiple>
        open={isOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        defaultOpen={defaultOpen}
        multiple={multiple}
        items={visibleItems}
        {...props}
        // Base UI exposes this richer mode on its lower-level Combobox API. It keeps the
        // first visible row active on open and after a search changes, so Enter is direct.
        autoHighlight={"always" as never}
      >
        {children}
      </Combobox.Root>
    </SearchContext.Provider>
  );
}

export function SearchSelectInput({
  className,
  tone = "neutral",
  placeholder,
  onFocus,
  onBlur,
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
  const { open, multiple, iconFor } = useContext(SearchContext);
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
              <SearchSelectItemIcon
                icon={selectedIcon}
                className="absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <Combobox.Input
                className={cn(
                  "h-10 w-full rounded-md border border-border bg-surface pr-9 pl-3.5 text-sm text-foreground",
                  "outline-none placeholder:text-muted-foreground",
                  "transition-[border-color,box-shadow,color] duration-(--duration-fast) ease-out",
                  "hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50",
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
  const { open } = useContext(SearchContext);

  return (
    <Combobox.Portal keepMounted>
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

export type SearchSelectItemProps = Omit<ComponentProps<typeof Combobox.Item>, "className"> & {
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

function SearchSelectItemIcon({
  icon,
  className,
}: {
  icon?: ReactNode;
  className?: string;
}) {
  if (icon == null) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex size-4 shrink-0 items-center justify-center [&>svg]:size-4",
        className,
      )}
    >
      {icon}
    </span>
  );
}

export function SearchSelectItem({
  className,
  icon,
  children,
  value,
  ...props
}: SearchSelectItemProps) {
  const { registerIcon, unregisterIcon } = useContext(SearchContext);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  return (
    <Combobox.Item
      value={value}
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
      <SearchSelectItemIcon icon={icon} />
      <span className="flex-1 truncate">{children}</span>
      <Combobox.ItemIndicator className="shrink-0 text-foreground">
        <Check className="size-3.5" />
      </Combobox.ItemIndicator>
    </Combobox.Item>
  );
}

/**
 * A checkbox row for `SearchSelect` in `multiple` mode.
 *
 * The option remains the interactive listbox element. The shared Checkbox is inert and
 * mirrors its selected state, preserving one keyboard and screen-reader interaction model.
 */
export type SearchMultiSelectItemProps = Omit<
  ComponentProps<typeof Combobox.Item>,
  "className"
> & {
  /** An optional icon shown after the checkbox and before the label. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function SearchMultiSelectItem({
  className,
  icon,
  children,
  value,
  ...props
}: SearchMultiSelectItemProps) {
  const { registerIcon } = useContext(SearchContext);

  useEffect(() => {
    registerIcon(value, icon);
  }, [icon, registerIcon, value]);

  return (
    <Combobox.Item
      value={value}
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
      <SearchSelectItemIcon icon={icon} />
      <span className="flex-1 truncate">{children}</span>
    </Combobox.Item>
  );
}
