"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { useMergedRefs } from "@/registry/lib/refs";
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
 * Single selection dims only while focused; typed queries never overwrite the choice.
 * Closing discards the query. The panel opens on the selection, or the first row when
 * nothing is chosen, and highlights the top match while searching.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// The panel blurs and scales in from `--transform-origin`, and every select in the family
// uses these same numbers: 0.95 and a 3px blur entering, a shorter 0.97 and 2px leaving, over
// `--duration-base` on the expo curve. Three selects sat in one form that scale by different
// amounts is the kind of difference you feel without being able to name.
const FADE_HIDDEN = { opacity: 0, scale: 0.95, filter: "blur(3px)" };
const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };
// Leaving is its own pose, not the entrance reversed: less travel and less blur, so the panel
// is gone before it can draw attention to going.
const FADE_EXIT = { opacity: 0, scale: 0.97, filter: "blur(2px)" };

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

/**
 * The two sizes, mirroring Button. `sm` (30px) is the compact default; `md` (34px) matches
 * Button's `md` and the Input for form rows. The size flows through context so the input
 * trigger and the option rows scale together.
 */
export type SelectSize = "sm" | "md";

const SIZE: Record<
  SelectSize,
  { field: string; glyph: string; iconSlot: string; row: string; radius: string }
> = {
  sm: {
    field: "h-[30px] text-xs",
    glyph: "size-3.5",
    iconSlot: "size-3.5 [&>svg]:size-3.5",
    row: "min-h-[30px] text-xs",
    radius: "rounded-[6px]",
  },
  md: {
    field: "h-[34px] text-sm",
    glyph: "size-4",
    iconSlot: "size-4 [&>svg]:size-4",
    row: "min-h-[34px] text-sm",
    radius: "rounded-[8px]",
  },
};

interface SearchContextValue {
  open: boolean;
  multiple: boolean;
  size: SelectSize;
  selectedLabel: string;
  inputRef: RefObject<HTMLInputElement | null>;
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
}

const SearchContext = createContext<SearchContextValue>({
  open: false,
  multiple: false,
  size: "sm",
  selectedLabel: "",
  inputRef: { current: null },
  registerIcon: () => {},
  unregisterIcon: () => {},
  iconFor: () => undefined,
});

/**
 * The icon an item carries on itself.
 *
 * An item registers its icon when it mounts, and that's when the panel first opens — so
 * the registry is guaranteed *empty* at the one moment the closed field first paints, and
 * populated ever after. That failure hides itself: it looks right the moment you click to
 * check, and it's wrong on every cold load.
 *
 * The way out is different here than in the Base UI `Select`. A Combobox item *is* its
 * value — `<SearchSelectItem value={item}>` — so there's no key to look up in a separate
 * `items` mapping; the data is already in hand. Reading `icon` off it extends the shape
 * Base UI already recognises, which treats `{ value, label }` specially for display and
 * form submission.
 *
 * So an icon put on the item data resolves on first paint. One put only on
 * `<SearchSelectItem icon={…}>` cannot: nothing outside the popup has seen it yet.
 */
function iconFromValue(value: unknown): ReactNode | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  return (value as { icon?: ReactNode }).icon;
}

export interface SearchSelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends Omit<ComponentProps<typeof Combobox.Root<Value, Multiple>>, "children"> {
  /**
   * Resolves the icon shown in the closed single-select value — for icons that are
   * computed rather than carried. Items that hold their own `icon` need no function.
   */
  iconForValue?: (value: Value) => ReactNode | undefined;
  /** Compact 30px (`sm`, default) or the 34px form-row size (`md`). @default "sm" */
  size?: SelectSize;
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
  size = "sm",
  value,
  defaultValue,
  onValueChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  itemToStringLabel,
  ...props
}: SearchSelectProps<Value, Multiple>) {
  const inputRef = useRef<HTMLInputElement>(null);
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
  // A registered icon (from a mounted item) wins; then a computed one; then the icon the
  // value carries — the only one of the three that can answer before the panel has ever
  // been opened.
  const iconFor = useCallback(
    (value: unknown) =>
      icons.get(value) ??
      (value == null
        ? undefined
        : (iconForValue?.(value as Value) ?? iconFromValue(value))),
    [iconForValue, icons],
  );
  // Base UI owns the value; this mirrors it only to answer "is anything chosen", which is
  // what picks the highlight mode below.
  const [uncontrolledValue, setUncontrolledValue] = useState<unknown>(() => defaultValue ?? null);
  const selected = value !== undefined ? value : uncontrolledValue;
  const [query, setQuery] = useState(defaultInputValue ?? "");
  const selectedLabel = multiple || selected == null
    ? ""
    : itemToStringLabel
      ? itemToStringLabel(selected as Value)
      : typeof selected === "object" && "label" in selected && selected.label != null
        ? String(selected.label)
        : typeof selected === "object" && "value" in selected
          ? String(selected.value)
          : String(selected);
  const handleInputValueChange: NonNullable<SearchSelectProps<Value, Multiple>["onInputValueChange"]> = (next, details) => {
    // A single-select keeps its committed label in the placeholder; only typing is a query.
    const nextQuery = multiple || details.reason === "input-change" ? next : "";
    onInputValueChange?.(nextQuery, details);
    if (!details.isCanceled) setQuery(nextQuery);
  };
  const hasSelection = Array.isArray(selected) ? selected.length > 0 : selected != null;
  const handleValueChange = useCallback<
    NonNullable<SearchSelectProps<Value, Multiple>["onValueChange"]>
  >(
    (next, details) => {
      // Deleting a search is not deleting the committed selection.
      if (!multiple && details.reason === "input-clear") {
        details.cancel();
        return;
      }
      onValueChange?.(next, details);
      if (!details.isCanceled) setUncontrolledValue(next);
    },
    [multiple, onValueChange],
  );

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
      if (!details.isCanceled && !next && details.reason === "item-press" && details.event.type !== "keydown") {
        inputRef.current?.blur();
      }
    },
    [isControlled, multiple, onOpenChange],
  );

  return (
    <SearchContext.Provider
      value={{ open: isOpen, multiple: Boolean(multiple), size, selectedLabel, inputRef, registerIcon, unregisterIcon, iconFor }}
    >
      <Combobox.Root<Value, Multiple>
        open={isOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        defaultOpen={defaultOpen}
        multiple={multiple}
        items={items}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        itemToStringLabel={itemToStringLabel}
        inputValue={multiple ? inputValue : (inputValue ?? query)}
        defaultInputValue={multiple ? defaultInputValue : undefined}
        onInputValueChange={handleInputValueChange}
        {...props}
        // Hovering moves the highlight; leaving the list must not throw it away. Base UI
        // otherwise resets the active row on pointer-leave, and `autoHighlight` then puts it
        // straight back on row one — so a pointer that wandered out of the panel would silently
        // re-aim Enter at the top of the list. The other selects keep the last hovered row.
        // (Spread, not a named prop: Base UI leaves this one off the public Combobox type
        // altogether rather than narrowing it, so there is no cast that would satisfy it.)
        {...({ keepHighlight: true } as Record<string, unknown>)}
        // The two halves of "a panel never opens with nothing ready", and they have to be
        // two: Base UI's `always` pins the first row unconditionally, overriding the active
        // row it otherwise restores from the selection. So `always` is for a select with
        // nothing chosen, and the plain mode — which restores the selected row on open and
        // still jumps to the top match on every keystroke — is for one that has an answer
        // already. (The prop is on the lower-level Combobox API, hence the cast.)
        autoHighlight={(hasSelection ? true : "always") as never}
      >
        {children}
      </Combobox.Root>
    </SearchContext.Provider>
  );
}

export function SearchSelectInput({
  ref,
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
  const { open, multiple, iconFor, size, selectedLabel, inputRef } = useContext(SearchContext);
  const mergedRef = useMergedRefs(inputRef, ref);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <Combobox.Value>
        {(selectedValue) => {
          const selectedIcon = !multiple
            ? iconFor(selectedValue)
            : undefined;

          return (
            <>
              <SearchSelectItemIcon
                icon={focused && selectedIcon != null
                  ? <Search className="text-muted-foreground" />
                  : selectedIcon}
                size={size}
                className="absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <Combobox.Input
                ref={mergedRef}
                data-selected-label={!focused && !multiple && selectedLabel ? "" : undefined}
                className={cn(
                  "w-full border border-border bg-surface pr-9 pl-3.5 text-foreground",
                  SIZE[size].field,
                  SIZE[size].radius,
                  "outline-none placeholder:text-muted-foreground data-[selected-label]:placeholder:text-foreground",
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
                    : selectedLabel || placeholder
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
          <ChevronDown className={SIZE[size].glyph} />
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
  const { open, size } = useContext(SearchContext);

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
                    : FADE_EXIT
              }
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            />
          }
          {...props}
        >
          {/* Base UI keeps this div mounted and only nulls its children when there are
              matches; `empty:hidden` collapses it then, so it doesn't reserve blank space
              above the results. */}
          <Combobox.Empty
            // One row tall, exactly — `m-1` mirrors the list's `p-1` and `py-1.5` is the
            // row's own vertical padding. See the note in `select.tsx`.
            className={cn(
              "m-1 flex items-center justify-center px-2.5 py-1.5 text-center text-muted-foreground empty:hidden",
              SIZE[size].row,
            )}
          >
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

export function SearchSelectItem({
  className,
  icon,
  children,
  value,
  ...props
}: SearchSelectItemProps) {
  const { registerIcon, unregisterIcon, size } = useContext(SearchContext);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  return (
    <Combobox.Item
      value={value}
      className={cn(
        "flex items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        // Base UI moves this highlight with the keyboard as well as the pointer; it snaps
        // (no transition) so it keeps up with arrow-key navigation rather than lagging.
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        className,
      )}
      {...props}
    >
      <SearchSelectItemIcon icon={icon} size={size} />
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
  const { registerIcon, unregisterIcon, size } = useContext(SearchContext);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  return (
    <Combobox.Item
      value={value}
      className={cn(
        "flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 outline-none select-none",
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
              aria-hidden
              tabIndex={-1}
              className="pointer-events-none shrink-0"
            />
          </span>
        )}
      />
      <SearchSelectItemIcon icon={icon} size={size} />
      <span className="flex-1 truncate">{children}</span>
    </Combobox.Item>
  );
}
