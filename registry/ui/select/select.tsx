"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  createContext,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ForwardedRef,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import {
  selectSortTriggerVariants,
  selectTriggerVariants,
  type SelectTriggerVariant,
} from "./select.variants";

/**
 * A single or multi-select — the accessible version, on Base UI.
 *
 * Base UI drives the behaviour — keyboard navigation, typeahead, focus into the list and
 * back, collision-aware placement, the hidden form input, full ARIA — which is exactly
 * what a hand-rolled dropdown gets wrong. The panel simply blurs and scales in from the
 * trigger's edge (a gap opens off it), the chevron flips, and it fades back out on close.
 *
 * The trade against the hand-rolled sibling: Base UI portals the popup, so there's no
 * height unfold — but every keyboard and focus behaviour is
 * real rather than approximated. Pass `multiple` to keep the panel open while several
 * checkbox rows are toggled; the same value and item parts automatically switch to their
 * count and checkbox forms. That's the right default; the Motion one is what you reach
 * for when the entrance is the point.
 */

/**
 * The two sizes, mirroring Button. `sm` (30px) is the compact/toolbar default; `md` (34px)
 * matches Button's `md` and the Input, so a select lines up with them in a form row. The
 * size flows through context so the trigger *and* the option rows scale together.
 */
export type SelectSize = "sm" | "md";

const SIZE: Record<
  SelectSize,
  { field: string; chip: string; glyph: string; iconSlot: string; row: string }
> = {
  sm: {
    field: "h-[30px] text-xs",
    chip: "h-[30px] px-3 text-xs",
    glyph: "size-3.5",
    iconSlot: "size-3.5 [&_svg]:size-3.5",
    row: "min-h-[30px] text-xs",
  },
  md: {
    field: "h-[34px] text-sm",
    chip: "h-[34px] px-3.5 text-sm",
    glyph: "size-4",
    iconSlot: "size-4 [&_svg]:size-4",
    row: "min-h-[34px] text-sm",
  },
};

interface SelectContextValue {
  open: boolean;
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  setOpen: (open: boolean, details?: unknown) => void;
  setValue: (value: unknown, details?: unknown) => void;
  registerNestedPanel: (node: HTMLElement | null) => void;
  isNestedPanelTarget: (target: EventTarget | null) => boolean;
  size: SelectSize;
  triggerVariant: SelectTriggerVariant;
  setTriggerVariant: (variant: SelectTriggerVariant) => void;
  /** The current selection, always as an array (one entry for single-select). */
  values: unknown[];
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
  registerLabel: (value: unknown, label: ReactNode) => void;
  unregisterLabel: (value: unknown) => void;
  labelFor: (value: unknown) => ReactNode | undefined;
  firstItem: unknown;
  registerOptionText: (value: unknown, text: string, parentValue?: unknown) => void;
  unregisterOptionText: (value: unknown) => void;
  /** True when the text passes the current panel-search query (or there is none). */
  matchesQuery: (text: string) => boolean;
  /** The first top-level item still visible under the current query. */
  firstVisibleItem: unknown;
  /** Whether an item has a matching row anywhere in its nested panels. */
  hasMatchingDescendant: (value: unknown) => boolean;
  /** The row a panel opens on: the selection while the list is whole, else the first row. */
  openingItem: unknown;
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
  disabled: false,
  readOnly: false,
  setOpen: () => {},
  setValue: () => {},
  registerNestedPanel: () => {},
  isNestedPanelTarget: () => false,
  size: "sm",
  triggerVariant: "default",
  setTriggerVariant: () => {},
  values: [],
  registerIcon: () => {},
  unregisterIcon: () => {},
  iconFor: () => undefined,
  registerLabel: () => {},
  unregisterLabel: () => {},
  labelFor: () => undefined,
  firstItem: undefined,
  registerOptionText: () => {},
  unregisterOptionText: () => {},
  matchesQuery: () => true,
  firstVisibleItem: undefined,
  hasMatchingDescendant: () => false,
  openingItem: undefined,
  activeItem: undefined,
  setActiveItem: () => {},
  panelSearch: false,
  setPanelSearch: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  clear: () => {},
});

type BaseUIEvent = { preventBaseUIHandler?: () => void };

function preventBaseUIHandler(event: BaseUIEvent) {
  event.preventBaseUIHandler?.();
}

interface SelectSubItemContextValue {
  open: boolean;
  parentValue: unknown;
  registerItem: (value: unknown, node: HTMLElement | null) => void;
}

interface SelectOptionInfo {
  text: string;
  parentValue: unknown;
}

interface SelectOptionRegistration extends SelectOptionInfo {
  count: number;
}

interface SelectSearchChildProps {
  value?: unknown;
  children?: ReactNode;
  searchValue?: string;
}

interface SelectSearchOption {
  value: unknown;
  text: string;
}

/**
 * Read the direct option elements of a nested panel before its popup mounts. Base UI keeps
 * closed select portals out of the tree, so the real items cannot register their search text
 * until the panel is opened. This lightweight pass only reads the public value/label props;
 * the mounted items still own all rendering and interaction.
 */
function collectSelectSearchOptions(children: ReactNode): SelectSearchOption[] {
  const options: SelectSearchOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const childProps = child.props as SelectSearchChildProps;

    if (child.type === Fragment) {
      options.push(...collectSelectSearchOptions(childProps.children));
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(childProps, "value")) return;

    options.push({
      value: childProps.value,
      text:
        childProps.searchValue ??
        (typeof childProps.children === "string"
          ? childProps.children
          : String(childProps.value)),
    });
  });

  return options;
}

interface SelectSubContextValue {
  open: boolean;
  disabled: boolean;
  anchor: HTMLElement | null;
  triggerValue: symbol;
  focusTrigger: () => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  setCloseDelay: (delay: number) => void;
  setOpen: (open: boolean, details?: unknown) => void;
  openAndFocus: () => void;
  scheduleOpen: (delay: number) => void;
  scheduleClose: (delay?: number) => void;
  cancelClose: () => void;
}

const SelectSubContext = createContext<SelectSubContextValue | null>(null);
const SelectSubItemContext = createContext<SelectSubItemContextValue | null>(null);

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function useSelectSubContext() {
  const context = useContext(SelectSubContext);

  if (!context) {
    throw new Error(
      "SelectSubTrigger and SelectSubContent must be used inside SelectSub.",
    );
  }

  return context;
}

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
 * Resolve a value's label from Base UI's `items` prop — the canonical mapping that exists
 * precisely so a trigger can show a *preselected* value's label before the popup (and its
 * `SelectItem`s) has ever mounted. Without this, a sort/filter chip with a `defaultValue`
 * shows the raw value ("updated") until the panel is opened once and the items register
 * their labels. Supports both `items` shapes: a `{ value: label }` record and a
 * `{ value, label }[]` array.
 */
function labelFromItems(items: unknown, value: unknown): ReactNode | undefined {
  if (!items) return undefined;
  if (Array.isArray(items)) {
    return (items as { value: unknown; label?: ReactNode }[]).find((item) =>
      Object.is(item.value, value),
    )?.label;
  }
  if (typeof items === "object" && value != null) {
    return (items as Record<string, ReactNode>)[value as string];
  }
  return undefined;
}

/**
 * The same lookup for the icon, and it exists for the same reason.
 *
 * A `SelectItem`'s icon is registered when the item mounts, which is when the popup
 * first opens — so the icon registry is guaranteed *empty* at the one moment the closed
 * trigger first paints, and populated ever after. That's a failure shape that hides
 * itself: it looks right the moment you click to check, and it's wrong on every cold
 * load. `items` is the mapping that exists before anything mounts, so an icon declared
 * there resolves on first paint.
 *
 * Only the array form carries icons — the record form is `{ value: label }` and has
 * nowhere to put one.
 */
function iconFromItems(items: unknown, value: unknown): ReactNode | undefined {
  if (!Array.isArray(items)) return undefined;
  return (items as { value: unknown; icon?: ReactNode }[]).find((item) =>
    Object.is(item.value, value),
  )?.icon;
}

function focusPanelOption(
  list: HTMLElement | null,
  direction: "next" | "previous" | "active",
) {
  if (!list) return;

  const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (option) =>
      !option.hidden &&
      option.getAttribute("aria-disabled") !== "true" &&
      !(option instanceof HTMLButtonElement && option.disabled),
  );
  // `active` reads the mark off the DOM rather than recomputing which row it should be, so
  // the row that paints as active is provably the row that takes focus.
  const option =
    direction === "active"
      ? (options.find((candidate) => candidate.hasAttribute("data-panel-active")) ?? options[0])
      : direction === "next"
        ? options[0]
        : options.at(-1);
  option?.focus();
}

function focusNestedOption(
  items: Map<unknown, HTMLElement>,
  values: unknown[],
  multiple: boolean,
) {
  const isEnabled = (node: HTMLElement | undefined) =>
    Boolean(
      node &&
        node.isConnected &&
        !node.hidden &&
        node.getAttribute("aria-disabled") !== "true" &&
        !(node instanceof HTMLButtonElement && node.disabled),
    );
  const options = Array.from(items.values()).filter(isEnabled);
  const selected = multiple
    ? [...values].reverse().map((value) => items.get(value)).find(isEnabled)
    : items.get(values[0]);
  (isEnabled(selected) ? selected : options[0])?.focus();
}

export interface SelectProps<Value, Multiple extends boolean | undefined = false>
  extends Omit<ComponentProps<typeof BaseSelect.Root<Value, Multiple>>, "children" | "items"> {
  /**
   * Base UI's item mapping, widened by one optional field: an `icon` alongside each
   * `label`. Declaring both here is what lets a preselected value show its icon on the
   * first paint, before the popup has mounted and the items have registered themselves.
   *
   * ```tsx
   * items={[{ value: "sans", label: "Sans-serif", icon: <Type /> }]}
   * ```
   *
   * Every shape Base UI accepts still works; the icon is only available on the array
   * form, since the record form is `{ value: label }` and has nowhere to put one.
   */
  items?:
    | ReadonlyArray<{ label: ReactNode; value: Value; icon?: ReactNode }>
    | ComponentProps<typeof BaseSelect.Root<Value, Multiple>>["items"];
  /**
   * Resolves the icon shown in the closed single-select value — for icons that are
   * computed rather than declared. Prefer `items` when the set is a fixed list: it's
   * one declaration per option, and it resolves before mount either way.
   */
  iconForValue?: (value: Value) => ReactNode | undefined;
  /** Compact 30px (`sm`, default) or the 34px form-row size (`md`). @default "sm" */
  size?: SelectSize;
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
  size = "sm",
  ...props
}: SelectProps<Value, Multiple>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerVariant, setTriggerVariant] = useState<SelectTriggerVariant>("default");
  const nestedPanelNodesRef = useRef<Set<HTMLElement>>(new Set());
  const registerNestedPanel = useCallback((node: HTMLElement | null) => {
    if (node) {
      nestedPanelNodesRef.current.add(node);
    } else {
      for (const panel of nestedPanelNodesRef.current) {
        if (!panel.isConnected) nestedPanelNodesRef.current.delete(panel);
      }
    }
  }, []);
  const isNestedPanelTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Node)) return false;
    for (const panel of nestedPanelNodesRef.current) {
      if (panel.contains(target)) return true;
    }
    return false;
  }, []);

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
  // A registered label (from a mounted `SelectItem`) wins; otherwise fall back to the
  // `items` mapping, so a preselected value shows its label before the panel is ever opened.
  const labelFor = useCallback(
    (v: unknown) => labels.get(v) ?? labelFromItems(props.items, v),
    [labels, props.items],
  );
  const firstItem = useMemo(() => labels.keys().next().value, [labels]);

  // Top-level items register the text a panel search matches against. Nested item text has its
  // own registry because closed Base UI portals register their rows after the outer panel opens.
  const [optionTexts, setOptionTexts] = useState<Map<unknown, SelectOptionRegistration>>(
    () => new Map(),
  );
  const [nestedOptionTexts, setNestedOptionTexts] = useState<
    Map<unknown, SelectOptionRegistration>
  >(() => new Map());
  const registerOptionText = useCallback(
    (v: unknown, text: string, parentValue?: unknown) => {
      if (parentValue !== undefined) {
        setNestedOptionTexts((current) => {
          const previous = current.get(v);
          return new Map(current).set(v, {
            text,
            parentValue,
            count: (previous?.count ?? 0) + 1,
          });
        });
        return;
      }

      setOptionTexts((current) => {
        const previous = current.get(v);
        return new Map(current).set(v, {
          text,
          parentValue,
          count: (previous?.count ?? 0) + 1,
        });
      });
    },
    [],
  );
  const unregisterOptionText = useCallback((v: unknown) => {
    setNestedOptionTexts((current) => {
      const previous = current.get(v);
      if (!previous) return current;
      const next = new Map(current);
      if (previous.count > 1) {
        next.set(v, { ...previous, count: previous.count - 1 });
      } else {
        next.delete(v);
      }
      return next;
    });

    setOptionTexts((current) => {
      const previous = current.get(v);
      if (!previous) return current;
      const next = new Map(current);
      if (previous.count > 1) {
        next.set(v, { ...previous, count: previous.count - 1 });
      } else {
        next.delete(v);
      }
      return next;
    });
  }, []);
  const matchesQuery = useCallback(
    (text: string) => {
      const q = searchQuery.trim().toLocaleLowerCase();
      return q === "" || text.toLocaleLowerCase().includes(q);
    },
    [searchQuery],
  );
  const hasMatchingDescendant = useCallback(
    (parentValue: unknown) => {
      if (searchQuery.trim() === "") return false;

      const visited = new Set<unknown>();
      const findMatch = (ancestor: unknown): boolean => {
        const allOptions: [unknown, SelectOptionInfo][] = [
          ...optionTexts,
          ...nestedOptionTexts,
        ];
        for (const [value, option] of allOptions) {
          if (!Object.is(option.parentValue, ancestor) || visited.has(value)) continue;
          visited.add(value);
          if (matchesQuery(option.text) || findMatch(value)) return true;
        }
        return false;
      };

      return findMatch(parentValue);
    },
    [matchesQuery, nestedOptionTexts, optionTexts, searchQuery],
  );
  const firstVisibleItem = useMemo(() => {
    for (const [value, option] of optionTexts) {
      if (
        option.parentValue === undefined &&
        (matchesQuery(option.text) || hasMatchingDescendant(value))
      ) {
        return value;
      }
    }
    return undefined;
  }, [hasMatchingDescendant, matchesQuery, optionTexts]);

  // The row a panel opens on. A select opens on its own answer: the current selection, which
  // is also the row the eye is already looking for. Only once a query narrows the list does
  // the top match take over — by then the selection may not even be in the list, and what
  // was typed is the better guess at what Enter should take.
  //
  // Read from the end, so a multi-select opens on the *most recent* choice. That's the one
  // point where several rows could claim it, and it's settled this way because Base UI's own
  // Combobox settles it this way — its `selectedIndex` is the last entry of the value array,
  // and the two search variants inherit that. Matching it here is what keeps all five selects
  // opening on the same row; the alternative would be reordering the array handed to the
  // primitive, which would change what `onValueChange` reports.
  //
  // Guarded on the item being registered, so a value with no option in the list (stale, or
  // supplied before the rows mount) falls through to the top row instead of arming nothing.
  // The selection as it stood when the panel opened, not as it stands now. A multi-select
  // stays open while its checkboxes are toggled, and reading the live selection here would
  // re-aim the active row on every toggle: unchecking the row under the pointer would send
  // the highlight to whatever the selection fell back to — another chosen row, or the top of
  // the list — while the pointer hasn't moved at all. Where the panel opens is a question
  // asked once, on the way in.
  const [openingValues, setOpeningValues] = useState<unknown[]>(values);

  const openingItem = useMemo(() => {
    if (searchQuery.trim() === "") {
      for (let index = openingValues.length - 1; index >= 0; index -= 1) {
        if (optionTexts.has(openingValues[index])) return openingValues[index];
      }
    }
    return firstVisibleItem;
  }, [firstVisibleItem, openingValues, optionTexts, searchQuery]);
  const [activeItem, setActiveItem] = useState<unknown>(undefined);
  const [panelSearch, setPanelSearch] = useState(false);

  /**
   * Everything that resets when the panel opens or closes, adjusted during render rather
   * than in an effect.
   *
   * Nothing here synchronises with anything outside React — it's state derived from a
   * transition — so an effect would only schedule a second render after the first had
   * already painted the stale value. React's own answer to that is to compare against the
   * previous value during render: the reset lands in the same pass that flips `isOpen`,
   * and the discarded first pass never commits.
   *
   * The search query resets on *open*, not on close. Clearing as the panel closes
   * un-hides every option while the exit animation is still running, so a filtered panel
   * visibly grows back to full height on its way out. Holding the query until the next
   * open means the panel fades out exactly as it looked, and the stale query is invisible
   * in between. The active item is the reverse: it's meaningless once the list is gone.
   */
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSearchQuery("");
      setOpeningValues(values);
    } else {
      setActiveItem(undefined);
    }
  }

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
  // A registered icon (from a mounted `SelectItem`) wins; then a computed one; then the
  // `items` mapping — the only one of the three that can answer before the panel has
  // ever been opened.
  const iconFor = useCallback(
    (value: unknown) =>
      icons.get(value) ??
      (value == null
        ? undefined
        : (iconForValue?.(value as Value) ?? iconFromItems(props.items, value))),
    [iconForValue, icons, props.items],
  );

  const handleOpenChange = useCallback<
    NonNullable<SelectProps<Value, Multiple>["onOpenChange"]>
  >(
    (next, details) => {
      if (!next && details.reason === "outside-press" && isNestedPanelTarget(details.event.target)) {
        // A nested panel is portaled outside the main popup to escape its clipping boundary,
        // but it still belongs to this select. Let the nested root handle the child press.
        details.cancel();
      }
      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
    },
    [isControlled, isNestedPanelTarget, onOpenChange],
  );
  const setOpen = useCallback(
    (nextOpen: boolean, details?: unknown) => {
      handleOpenChange(nextOpen, details as never);
    },
    [handleOpenChange],
  );
  const setValue = useCallback(
    (nextValue: unknown, details?: unknown) => {
      handleValueChange(nextValue as never, details as never);
    },
    [handleValueChange],
  );

  return (
    <SelectContext.Provider
      value={{
        open: isOpen,
        multiple: Boolean(multiple),
        disabled: Boolean(props.disabled),
        readOnly: Boolean(props.readOnly),
        setOpen,
        setValue,
        registerNestedPanel,
        isNestedPanelTarget,
        size,
        triggerVariant,
        setTriggerVariant,
        values,
        registerIcon,
        unregisterIcon,
        iconFor,
        registerLabel,
        unregisterLabel,
        labelFor,
        firstItem,
        registerOptionText,
        unregisterOptionText,
        matchesQuery,
        firstVisibleItem,
        hasMatchingDescendant,
        openingItem,
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

/**
 * Read an ancestor `Select`'s in-panel search state — for building search-aware content
 * inside `SelectContent`, such as a group heading that hides when none of its items match.
 * `matches` is the same predicate the items themselves hide on, so a heading and its rows
 * stay in agreement.
 */
export function useSelectSearch(): { query: string; matches: (text: string) => boolean } {
  const { searchQuery, matchesQuery } = useContext(SelectContext);
  return { query: searchQuery, matches: matchesQuery };
}

export function SelectValue({
  className,
  children,
  placeholder,
  render,
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  const { multiple, iconFor, size } = useContext(SelectContext);

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
            <SelectItemIcon icon={iconFor(state.value)} size={size} />
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

export interface SelectTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "className"> {
  className?: string;
  children?: ReactNode;
  /** Boxed field by default; `plain` removes the surface, border and horizontal padding. */
  variant?: SelectTriggerVariant;
  /** @deprecated Use `variant="plain"` or `variant="default"`. */
  outline?: boolean;
  /** The trailing chevron. */
  chevron?: boolean;
}

export function SelectTrigger({
  className,
  children,
  variant,
  outline,
  chevron = true,
  ...props
}: SelectTriggerProps) {
  const { open, size, setTriggerVariant } = useContext(SelectContext);
  const reduceMotion = useReducedMotion();
  const resolvedVariant = variant ?? (outline === false ? "plain" : "default");

  useEffect(() => {
    setTriggerVariant(resolvedVariant);
  }, [resolvedVariant, setTriggerVariant]);

  return (
    <BaseSelect.Trigger
      data-variant={resolvedVariant}
      className={cn(
        // `md` (34px) matches Button's default and the Input — a select beside either in a
        // form row lines up with it. `sm` (30px, the default) is the compact toolbar size.
        SIZE[size].field,
        selectTriggerVariants({ variant: resolvedVariant }),
        className,
      )}
      {...props}
    >
      {children}
      {chevron && (
        <motion.span
          aria-hidden
          className="shrink-0 text-muted-foreground"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
          }
        >
          <ChevronDown className={SIZE[size].glyph} />
        </motion.span>
      )}
    </BaseSelect.Trigger>
  );
}

export interface SelectSortTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "className" | "children"> {
  className?: string;
  /** Chip by default; `plain` removes the surface, border and horizontal padding. */
  variant?: SelectTriggerVariant;
  /** @deprecated Use `variant="plain"` or `variant="default"`. */
  outline?: boolean;
  /** A leading icon. Optional — omit for a text-only chip. */
  icon?: ReactNode;
  /** A prefix, e.g. "Sort" or "Status", shown before the value(s). Optional. */
  label?: ReactNode;
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
  variant,
  outline = true,
  showValue = true,
  placeholder = "Any",
  ...props
}: SelectSortTriggerProps) {
  const { open, values, labelFor, size, setTriggerVariant } = useContext(SelectContext);
  const reduceMotion = useReducedMotion();
  const resolvedVariant = variant ?? (outline === false ? "plain" : "default");

  useEffect(() => {
    setTriggerVariant(resolvedVariant);
  }, [resolvedVariant, setTriggerVariant]);
  const selected = values.map((v) => labelFor(v) ?? (typeof v === "string" ? v : String(v)));
  const isUnset = selected.length === 0;
  // With no label and no value shown, the chip is a bare icon button — the chevron would
  // be the only text-ish thing, so drop it and let the icon stand alone.
  const iconOnly = !label && !showValue;
  const showChevron = !iconOnly;

  return (
    <BaseSelect.Trigger
      data-variant={resolvedVariant}
      data-unset={isUnset || undefined}
      className={cn(
        SIZE[size].chip,
        selectSortTriggerVariants({ variant: resolvedVariant }),
        resolvedVariant === "default" &&
          (isUnset
            ? "border-dashed border-border-strong bg-surface"
            : "border-border bg-muted"),
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            "shrink-0",
            size === "sm" ? "[&>svg]:size-3.5" : "[&>svg]:size-4",
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
          className={cn(
            "shrink-0 text-muted-foreground",
            resolvedVariant === "plain" && "order-3",
          )}
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }
          }
        >
          <ChevronDown className={SIZE[size].glyph} />
        </motion.span>
      )}
    </BaseSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  sideOffset = 6,
  side = "bottom",
  align = "start",
  width: widthProp,
  searchable = false,
  searchPosition = "top",
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
  /** Which side of the trigger to open on. Base UI still collision-flips from here. */
  side?: ComponentProps<typeof BaseSelect.Positioner>["side"];
  align?: ComponentProps<typeof BaseSelect.Positioner>["align"];
  /**
   * `trigger` keeps the panel the trigger's width (a bordered field select); `content`
   * sizes it to its own rows — the longest label plus the reserved check slot. When omitted,
   * this follows the trigger: `plain` uses `content`, while `default` uses `trigger`.
   */
  width?: "trigger" | "content";
  /** Adds a plain filter field beside the list, separated from the options by a hairline. */
  searchable?: boolean;
  /**
   * Which end of the panel the filter field sits at. `bottom` suits a panel that opens
   * upward off a footer, where the field then lands next to the trigger it came from.
   */
  searchPosition?: "top" | "bottom";
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
    size,
    firstVisibleItem,
    openingItem,
    setActiveItem,
    setPanelSearch,
    searchQuery,
    setSearchQuery,
    triggerVariant,
  } = useContext(SelectContext);
  const width = widthProp ?? (triggerVariant === "plain" ? "content" : "trigger");
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // A state node, not a ref: Base UI mounts the popup lazily, so on the first open the
  // positioner DOM doesn't exist yet when a ref-reading effect fires. A callback ref makes
  // the node's arrival a state change the measuring effect can depend on.
  const [positionerNode, setPositionerNode] = useState<HTMLDivElement | null>(null);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);

  // Derived during render, not from a post-render DOM query: `firstVisibleItem` is the same
  // predicate the items themselves hide on, so it's `undefined` exactly when nothing matches.
  // Computing it here means the list-hidden + empty-message swap happens in the *same* frame
  // as the filtering — an effect-set flag would flip a render late, giving one frame with an
  // empty (but not-yet-hidden) list. That extra frame is a second height change, and on the
  // upward-opening variant a late reposition paints the whole popup — search field and all —
  // one frame too high before it snaps down: the flash above the field.
  const noResults =
    searchable && searchQuery.trim() !== "" && firstVisibleItem === undefined;

  useEffect(() => {
    setPanelSearch(searchable);
    return () => setPanelSearch(false);
  }, [searchable, setPanelSearch]);

  // Pin a content-width panel to its *unfiltered* width so an in-panel search can't resize
  // it while typing. `w-max` sizes to the widest visible row, so hiding rows would let the
  // panel narrow toward its longest remaining item; measuring the full set (query empty)
  // and holding it as a `min-width` floor keeps the panel the width it opened at.
  //
  // Runs only while the query is empty — the full set is on screen then — and stops once
  // typing begins, so it never captures a filtered (narrower) width. A `ResizeObserver`
  // rather than a one-shot read: on the *first* open Base UI's positioner hasn't been sized
  // by floating-ui yet when the effect fires, so an immediate `offsetWidth` reads 0. The
  // observer fires again once the panel gets its real width, and depending on `positionerNode`
  // means the effect also re-runs when the lazily-mounted popup first appears — the two
  // together are why the floor now sets on the first visit, not just the second. `offsetWidth`
  // is a layout metric, so the enter animation's `scale` doesn't distort it. Not cleared on
  // close: a stale-but-correct floor avoids a width jump during the exit blur, and the next
  // open re-measures (labels may have changed) as soon as its query resets to empty.
  useEffect(() => {
    if (!positionerNode || !open || !searchable || width !== "content") return;
    if (searchQuery.trim() !== "") return;

    const measure = () => {
      const measured = positionerNode.offsetWidth;
      if (measured) setLockedWidth((prev) => (prev === measured ? prev : measured));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(positionerNode);
    return () => observer.disconnect();
  }, [positionerNode, open, searchable, width, searchQuery]);

  // A panel never opens with nothing ready. It opens on the current selection, and on its
  // first row when there is none — see `openingItem`, which also moves to the new top row as
  // a query narrows the list rather than stranding the mark on a row the filter just hid.
  // Searchable panels keep DOM focus in their field but carry the same active-row state.
  useEffect(() => {
    if (!open || !autoFocusFirstItem || openingItem === undefined) return;

    setActiveItem(openingItem);
    if (searchable) return;

    // Focus follows the mark, because in a panel without a field focus *is* the highlight.
    const frame = requestAnimationFrame(() => {
      focusPanelOption(listRef.current, "active");
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirstItem, openingItem, open, searchable, setActiveItem]);

  // Built once and placed at whichever end `searchPosition` names, so the two layouts
  // can't drift apart. The hairline goes on the side facing the options.
  const searchField = searchable ? (
    <div
      className={cn(
        "relative flex h-[38px] items-center px-3.5",
        searchPosition === "bottom" ? "border-t border-border" : "border-b border-border",
      )}
    >
      <Input
        ref={searchInputRef}
        aria-label="Search options"
        variant="plain"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusPanelOption(listRef.current, event.key === "ArrowDown" ? "next" : "previous");
            return;
          }
          // Enter runs the row the panel is *showing* as active. The caret stays in the
          // field while a query narrows the list, so nothing in the list has DOM focus and
          // Base UI has no key target — the highlight would look armed and do nothing
          // until an arrow press moved real focus onto it. Reading the same
          // `data-panel-active` the row paints keeps the two from ever disagreeing.
          if (event.key === "Enter") {
            const active = listRef.current?.querySelector<HTMLElement>(
              '[role="option"][data-panel-active]:not([hidden])',
            );
            if (active) {
              event.preventDefault();
              active.click();
            }
            return;
          }
          // Keep Select's typeahead from treating input keystrokes as option jumps — but
          // only plain typing. A modifier chord is never typeahead, and swallowing it here
          // would stop app-level shortcuts (the chord that opened this panel, say) from
          // ever reaching their listener while the field has focus.
          if (event.key !== "Escape" && !event.metaKey && !event.ctrlKey) {
            event.stopPropagation();
          }
        }}
        placeholder={searchPlaceholder}
        className="h-full p-0"
      />
    </div>
  ) : null;

  return (
    <BaseSelect.Portal>
      {/* Base UI handles the positioning and collision flip; `--transform-origin` points
          at the trigger's edge, so the unfold grows *from* the trigger whichever side it
          lands on. */}
      <BaseSelect.Positioner
        data-slot="select-content-positioner"
        ref={setPositionerNode}
        sideOffset={sideOffset}
        align={align}
        alignItemWithTrigger={false}
        side={side}
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
              // The `min-width` floor lives on the popup — the visible bordered box — not
              // the positioner: the popup shrink-wraps its content, so when a search hides
              // the list (leaving only the empty message) the floor is what stops it
              // collapsing to that message's width. Content-width searchable panels only.
              style={{
                transformOrigin: "var(--transform-origin)",
                minWidth: width === "content" && lockedWidth ? lockedWidth : undefined,
              }}
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
          // When a panel search filters everything out there's no option left to keep
          // active, so Base UI falls back to focusing the popup itself — which yanks the
          // caret out of the field mid-word. Bounce it straight back. Guarded on the popup
          // being the actual target, so focus landing on a child is left alone.
          onFocus={(event) => {
            if (searchable && event.target === event.currentTarget) {
              searchInputRef.current?.focus();
            }
          }}
          {...props}
        >
          {searchable && searchPosition === "top" && searchField}
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
            <div
              // One row tall, exactly: `m-1` mirrors the list's `p-1` and `py-1.5` is the
              // row's own vertical padding, so an empty panel and a panel holding a single
              // result come to the same height at every size. The shared row minimum keeps
              // the empty state aligned with the 30px/34px control scale.
              className={cn(
                "m-1 flex items-center justify-center px-2.5 py-1.5 text-center text-muted-foreground",
                SIZE[size].row,
              )}
            >
              {emptyMessage}
            </div>
          )}
          {searchable && searchPosition === "bottom" && searchField}
          {clearable && (
            // A footer, not a listbox row — pinned below the scroll area, and disabled
            // while there's nothing to clear. Clearing leaves the panel open so a new
            // choice can follow immediately.
            <div className="p-1">
              <Button
                variant="outline"
                disabled={values.length === 0}
                onClick={() => clear()}
                // Match a row's highlight box exactly (`rounded-xs px-2.5 py-1.5 text-xs`),
                // so the clear button lines up with the options above it.
                className={cn("h-auto w-full rounded-xs px-2.5 py-1.5", SIZE[size].row)}
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

type SelectSubOpenChange = NonNullable<
  ComponentProps<typeof BaseSelect.Root>["onOpenChange"]
>;

export interface SelectSubProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: SelectSubOpenChange;
}

/** Groups a nested select panel and its trigger. */
export function SelectSub({
  children,
  open,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
}: SelectSubProps) {
  const select = useContext(SelectContext);
  const parentPanelOpen = useContext(SelectSubItemContext);
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [triggerValue] = useState<symbol>(() => Symbol("select-sub-trigger"));
  const triggerRef = useRef<HTMLElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeDelayRef = useRef(100);
  const openedByHoverRef = useRef(false);
  const setTriggerNode = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    setAnchor((current) => (current === node ? current : node));
  }, []);
  const parentPanelAvailable = parentPanelOpen === null || parentPanelOpen.open;
  const currentOpen =
    select.open && parentPanelAvailable && (isControlled ? Boolean(open) : uncontrolledOpen);
  const resolvedDisabled =
    disabled || select.disabled || select.readOnly || !parentPanelAvailable;

  const cancelOpen = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);
  const setCloseDelay = useCallback((delay: number) => {
    closeDelayRef.current = delay;
  }, []);

  const handleOpenChange = useCallback<SelectSubOpenChange>(
    (nextOpen, details) => {
      cancelOpen();
      cancelClose();
      onOpenChange?.(nextOpen, details);
      if (!details?.isCanceled && !isControlled) setUncontrolledOpen(nextOpen);
      if (!nextOpen && !details?.isCanceled) {
        openedByHoverRef.current = false;
      }
    },
    [cancelClose, cancelOpen, isControlled, onOpenChange],
  );

  const setOpen = useCallback(
    (nextOpen: boolean, details?: unknown) => {
      cancelOpen();
      cancelClose();
      if (!nextOpen) openedByHoverRef.current = false;
      handleOpenChange(nextOpen, details as never);
    },
    [cancelClose, cancelOpen, handleOpenChange],
  );

  const openAndFocus = useCallback(() => {
    if (resolvedDisabled) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = false;
    handleOpenChange(true, undefined as never);
  }, [cancelClose, cancelOpen, handleOpenChange, resolvedDisabled]);

  const openFromHover = useCallback(() => {
    if (resolvedDisabled) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = true;
    handleOpenChange(true, undefined as never);
  }, [cancelClose, cancelOpen, handleOpenChange, resolvedDisabled]);

  const scheduleOpen = useCallback(
    (delay: number) => {
      if (resolvedDisabled || currentOpen) return;
      cancelClose();
      cancelOpen();
      if (delay <= 0) {
        openFromHover();
        return;
      }
      openTimerRef.current = setTimeout(openFromHover, delay);
    },
    [cancelClose, cancelOpen, currentOpen, openFromHover, resolvedDisabled],
  );

  const scheduleClose = useCallback(
    (delay = closeDelayRef.current) => {
      cancelOpen();
      if (!openedByHoverRef.current) return;
      cancelClose();
      const close = () => {
        closeTimerRef.current = null;
        openedByHoverRef.current = false;
        handleOpenChange(false, undefined as never);
      };
      if (delay <= 0) {
        close();
        return;
      }
      closeTimerRef.current = setTimeout(close, delay);
    },
    [cancelClose, cancelOpen, handleOpenChange],
  );

  const focusTrigger = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const [wasAvailable, setWasAvailable] = useState(select.open && parentPanelAvailable);
  const available = select.open && parentPanelAvailable;
  if (wasAvailable !== available) {
    setWasAvailable(available);
    if (!available) {
      if (!isControlled) setUncontrolledOpen(false);
    }
  }

  useEffect(
    () => () => {
      cancelOpen();
      cancelClose();
    },
    [cancelClose, cancelOpen],
  );

  useEffect(() => {
    if (available) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = false;
  }, [available, cancelClose, cancelOpen]);

  return (
    <SelectSubContext.Provider
      value={{
        open: currentOpen,
        disabled: resolvedDisabled,
        anchor,
        triggerValue,
        focusTrigger,
        setTriggerNode,
        setOpen,
        openAndFocus,
        scheduleOpen,
        scheduleClose,
        cancelClose,
        setCloseDelay,
      }}
    >
      {children}
    </SelectSubContext.Provider>
  );
}

export interface SelectSubTriggerProps
  extends Omit<
    SelectItemProps,
    "children" | "value" | "className" | "disabled" | "label" | "render" | "end"
  > {
  children?: ReactNode;
  className?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
  /** Open the nested panel when the pointer enters this row. @default true */
  openOnHover?: boolean;
  /** Hover delay in milliseconds. @default 0 */
  delay?: number;
  /** Hover close delay in milliseconds. @default 100 */
  closeDelay?: number;
}

type SelectSubTriggerClickEvent = Parameters<
  NonNullable<SelectSubTriggerProps["onClick"]>
>[0];
type SelectSubTriggerKeyDownEvent = Parameters<
  NonNullable<SelectSubTriggerProps["onKeyDown"]>
>[0];

/** A select row that opens a nested panel. */
export function SelectSubTrigger({
  children,
  className,
  disabled = false,
  label,
  id,
  onClick: onClickProp,
  onKeyDown: onKeyDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerLeave: onPointerLeaveProp,
  openOnHover = true,
  delay = 0,
  closeDelay = 100,
  ...props
}: SelectSubTriggerProps) {
  const {
    open: subOpen,
    disabled: subDisabled,
    triggerValue,
    setOpen: setSubOpen,
    setTriggerNode,
    openAndFocus,
    scheduleOpen,
    scheduleClose,
    cancelClose,
    setCloseDelay,
  } = useSelectSubContext();
  const resolvedDisabled = disabled || subDisabled;
  const triggerLabel =
    typeof label === "string" ? label : typeof children === "string" ? children : undefined;

  useEffect(() => {
    setCloseDelay(closeDelay);
  }, [closeDelay, setCloseDelay]);

  const handleClick = (event: SelectSubTriggerClickEvent) => {
    onClickProp?.(event);
    if (event.defaultPrevented || resolvedDisabled) return;

    // This row uses a private sentinel value only to participate in the outer select's
    // composite list. It is a panel trigger, never a selectable value.
    preventBaseUIHandler(event);
    setSubOpen(true);
  };

  const handleKeyDown = (event: SelectSubTriggerKeyDownEvent) => {
    onKeyDownProp?.(event);
    if (event.defaultPrevented || resolvedDisabled) return;

    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      preventBaseUIHandler(event);
      openAndFocus();
    }
  };

  const handlePointerMove: NonNullable<SelectSubTriggerProps["onPointerMove"]> = (event) => {
    onPointerMoveProp?.(event);
    if (event.defaultPrevented || resolvedDisabled || !openOnHover) return;
    if (event.pointerType !== "mouse") return;
    cancelClose();
    scheduleOpen(delay);
  };

  const handlePointerLeave: NonNullable<SelectSubTriggerProps["onPointerLeave"]> = (event) => {
    onPointerLeaveProp?.(event);
    if (event.defaultPrevented || resolvedDisabled || !openOnHover) return;
    scheduleClose(closeDelay);
  };

  return (
    <SelectItem
      {...props}
      ref={setTriggerNode}
      id={id}
      value={triggerValue}
      label={triggerLabel}
      disabled={resolvedDisabled}
      aria-haspopup="listbox"
      aria-expanded={subOpen}
      data-popup-open={subOpen || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("data-[popup-open]:bg-muted data-[popup-open]:text-foreground", className)}
      end={
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      }
    >
      {children}
    </SelectItem>
  );
}

export interface SelectSubContentProps
  extends Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> {
  className?: string;
  children?: ReactNode;
  side?: ComponentProps<typeof BaseSelect.Positioner>["side"];
  align?: ComponentProps<typeof BaseSelect.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
  /** Keep the panel mounted so selected child labels remain available to the trigger. */
  keepMounted?: boolean;
}

type SelectSubContentKeyDownEvent = Parameters<
  NonNullable<SelectSubContentProps["onKeyDown"]>
>[0];

/** A nested select panel whose children are ordinary `SelectItem`s. */
export function SelectSubContent({
  className,
  children,
  side = "right",
  align = "start",
  sideOffset = 8,
  alignOffset = -4,
  keepMounted = true,
  role: roleProp,
  onKeyDown: onKeyDownProp,
  ...props
}: SelectSubContentProps) {
  const select = useContext(SelectContext);
  const { registerNestedPanel, registerOptionText, unregisterOptionText } = select;
  const {
    open: subOpen,
    anchor,
    triggerValue,
    setOpen: setSubOpen,
    focusTrigger,
    scheduleClose,
    cancelClose,
  } = useSelectSubContext();
  const nestedSearchOptions = useMemo(
    () => collectSelectSearchOptions(children),
    [children],
  );
  const nestedValue = select.multiple ? select.values : (select.values[0] ?? null);
  const nestedItemsRef = useRef<Map<unknown, HTMLElement>>(new Map());
  const [nestedItemsVersion, setNestedItemsVersion] = useState(0);
  const registerItem = useCallback((value: unknown, node: HTMLElement | null) => {
    const current = nestedItemsRef.current.get(value);
    if (node) {
      if (current === node) return;
      nestedItemsRef.current.set(value, node);
    } else {
      if (!current) return;
      nestedItemsRef.current.delete(value);
    }
    setNestedItemsVersion((version) => version + 1);
  }, []);
  const nestedItemContext = useMemo<SelectSubItemContextValue>(
    () => ({ open: subOpen, parentValue: triggerValue, registerItem }),
    [registerItem, subOpen, triggerValue],
  );
  const [openingNestedValues, setOpeningNestedValues] = useState<unknown[]>(select.values);
  const [wasSubOpen, setWasSubOpen] = useState(subOpen);
  if (wasSubOpen !== subOpen) {
    setWasSubOpen(subOpen);
    if (subOpen) setOpeningNestedValues(select.values);
  }

  useEffect(() => {
    for (const option of nestedSearchOptions) {
      registerOptionText(option.value, option.text, triggerValue);
    }

    return () => {
      for (const option of nestedSearchOptions) {
        unregisterOptionText(option.value);
      }
    };
  }, [nestedSearchOptions, registerOptionText, triggerValue, unregisterOptionText]);

  useEffect(() => {
    if (!subOpen) return;

    // Base UI focuses the popup itself because nested select options are intentionally
    // non-tabbable until the composite gives one the active index. Choose the same row a
    // regular panel would open on, then Base UI owns all subsequent arrow-key navigation.
    const frame = requestAnimationFrame(() => {
      focusNestedOption(nestedItemsRef.current, openingNestedValues, select.multiple);
    });
    return () => cancelAnimationFrame(frame);
  }, [nestedItemsVersion, openingNestedValues, select.multiple, subOpen]);

  const handleNestedOpenChange: NonNullable<
    ComponentProps<typeof BaseSelect.Root>["onOpenChange"]
  > = (nextOpen, details) => {
    // The nested root owns the actual panel and its dismiss behaviour. An outside press closes
    // only this panel; a child item press also closes the parent in single-select mode.
    if (!nextOpen) {
      setSubOpen(false, details);
      if (!select.multiple && details.reason === "item-press") {
        select.setOpen(false, details);
      }
    }
  };

  const handleKeyDown = (event: SelectSubContentKeyDownEvent) => {
    onKeyDownProp?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setSubOpen(false);
      requestAnimationFrame(focusTrigger);
    }
  };

  const handlePointerEnter: NonNullable<SelectSubContentProps["onPointerEnter"]> = (event) => {
    props.onPointerEnter?.(event);
    if (!event.defaultPrevented) cancelClose();
  };

  const handlePointerLeave: NonNullable<SelectSubContentProps["onPointerLeave"]> = (event) => {
    props.onPointerLeave?.(event);
    if (!event.defaultPrevented) scheduleClose();
  };

  const setNestedPanelNode = useCallback(
    (node: HTMLElement | null) => registerNestedPanel(node),
    [registerNestedPanel],
  );

  const options = (
    <SelectSubItemContext.Provider value={nestedItemContext}>
      <BaseSelect.List
        data-select-sub-options
        aria-multiselectable={select.multiple || undefined}
        className="flex min-w-0 flex-col"
      >
        {children}
      </BaseSelect.List>
    </SelectSubItemContext.Provider>
  );

  return (
    <BaseSelect.Root
      open={subOpen}
      value={nestedValue as never}
      multiple={select.multiple}
      highlightItemOnHover={false}
      modal={false}
      readOnly={select.readOnly}
      onOpenChange={handleNestedOpenChange}
      onValueChange={(nextValue, details) => select.setValue(nextValue, details)}
    >
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          data-slot="select-sub-positioner"
          ref={setNestedPanelNode}
          anchor={anchor}
          positionMethod="fixed"
          side={side}
          align={align}
          alignItemWithTrigger={false}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            {...props}
            data-slot="select-sub-content"
            role={roleProp ?? "presentation"}
            onKeyDown={handleKeyDown}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "max-h-[min(var(--available-height),18rem)] w-max overflow-y-auto rounded-md border border-border bg-surface p-1 text-foreground shadow-overlay-drop outline-none",
              SCROLLBAR,
              "origin-[var(--transform-origin)] blur-0 transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
              "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
              className,
            )}
          >
            {keepMounted || subOpen ? options : null}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
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
  /** Optional trailing content in place of the selection indicator. */
  end?: ReactNode;
  /** Optional element id. */
  id?: string;
  /** Text used by an ancestor searchable `SelectContent` to match this option. */
  searchValue?: string;
};

/**
 * The icon slot sizes *any* glyph inside it, not just a direct child: a row can hand it a
 * `Morph` that swaps between glyphs, which puts the svg a level down. A direct-child rule
 * would miss it and the icon would render at its intrinsic size.
 */
function SelectItemIcon({ icon, size }: { icon?: ReactNode; size: SelectSize }) {
  if (icon == null) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center",
        SIZE[size].iconSlot,
      )}
    >
      {icon}
    </span>
  );
}

export const SelectItem = forwardRef<HTMLElement, SelectItemProps>(function SelectItem(
  {
    className,
    icon,
    children,
    value,
    disabled = false,
    end,
    searchValue,
    onClick: onClickProp,
    onFocusCapture,
    onMouseDown: onMouseDownProp,
    onMouseUp: onMouseUpProp,
    onPointerCancel: onPointerCancelProp,
    onPointerDown: onPointerDownProp,
    render: renderProp,
    ...props
  },
  forwardedRef,
) {
  const {
    multiple,
    size,
    registerIcon,
    unregisterIcon,
    registerLabel,
    unregisterLabel,
    open,
    activeItem,
    panelSearch,
    setActiveItem,
    matchesQuery,
    registerOptionText,
    unregisterOptionText,
    hasMatchingDescendant,
  } = useContext(SelectContext);
  const nestedPanelContext = useContext(SelectSubItemContext);
  const nestedPanel = nestedPanelContext !== null;
  const nestedPanelOpen = nestedPanelContext?.open ?? false;
  const parentValue = nestedPanelContext?.parentValue;
  const optionText = searchValue ?? (typeof children === "string" ? children : String(value));
  const hiddenBySearch = !matchesQuery(optionText) && !hasMatchingDescendant(value);
  const itemDisabled = disabled || hiddenBySearch || (nestedPanel && !nestedPanelOpen);
  const pointerStartedRef = useRef(false);
  const bridgingPointerDownRef = useRef(false);
  const itemRef = useCallback(
    (node: HTMLElement | null) => {
      setForwardedRef(forwardedRef, node);
      nestedPanelContext?.registerItem(value, node);
    },
    [forwardedRef, nestedPanelContext, value],
  );

  useEffect(() => {
    registerOptionText(value, optionText, parentValue);
    return () => unregisterOptionText(value);
  }, [optionText, parentValue, registerOptionText, unregisterOptionText, value]);
  const panelActive = open && Object.is(activeItem, value);

  useEffect(() => {
    registerIcon(value, icon);
    return () => unregisterIcon(value);
  }, [icon, registerIcon, unregisterIcon, value]);

  const bridgeMissingPointerDown = useCallback((target: HTMLElement) => {
    if (bridgingPointerDownRef.current || !target.isConnected) return;

    const view = target.ownerDocument.defaultView;
    if (!view) return;

    bridgingPointerDownRef.current = true;
    try {
      const event =
        typeof view.PointerEvent === "function"
          ? new view.PointerEvent("pointerdown", {
              bubbles: true,
              button: 0,
              isPrimary: true,
              pointerType: "mouse",
            })
          : new view.MouseEvent("pointerdown", { bubbles: true, button: 0 });
      target.dispatchEvent(event);
    } finally {
      bridgingPointerDownRef.current = false;
    }
  }, []);

  const handlePointerDown: NonNullable<SelectItemProps["onPointerDown"]> = (event) => {
    if (!bridgingPointerDownRef.current) onPointerDownProp?.(event);
    pointerStartedRef.current = true;
  };

  const handleMouseDown: NonNullable<SelectItemProps["onMouseDown"]> = (event) => {
    onMouseDownProp?.(event);
    if (
      !event.defaultPrevented &&
      nestedPanel &&
      !itemDisabled &&
      !pointerStartedRef.current &&
      event.button === 0
    ) {
      // Some haptic touchpads synthesize the mouse activation without a pointerdown. Base UI
      // uses pointerdown to arm its guarded click, so mirror that missing step for nested items.
      bridgeMissingPointerDown(event.currentTarget);
    }
  };

  const handleMouseUp: NonNullable<SelectItemProps["onMouseUp"]> = (event) => {
    onMouseUpProp?.(event);
    if (
      !event.defaultPrevented &&
      nestedPanel &&
      !itemDisabled &&
      !pointerStartedRef.current &&
      event.button === 0
    ) {
      // Keep the fallback working for devices that omit both pointerdown and mousedown.
      bridgeMissingPointerDown(event.currentTarget);
    }
    pointerStartedRef.current = false;
  };

  const handlePointerCancel: NonNullable<SelectItemProps["onPointerCancel"]> = (event) => {
    onPointerCancelProp?.(event);
    pointerStartedRef.current = false;
  };

  const handleClick: NonNullable<SelectItemProps["onClick"]> = (event) => {
    onClickProp?.(event);
    pointerStartedRef.current = false;
  };

  // Register the label so a chip trigger can render the selected value(s) by name.
  useEffect(() => {
    registerLabel(value, children);
    return () => unregisterLabel(value);
  }, [children, registerLabel, unregisterLabel, value]);

  if (multiple) {
    return (
      <BaseSelect.Item
        ref={itemRef}
        value={value}
        disabled={itemDisabled}
        hidden={hiddenBySearch}
        render={renderProp}
        data-panel-active={panelActive || undefined}
        onClick={handleClick}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        className={cn(
          "flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 outline-none select-none",
          SIZE[size].row,
          "text-muted-foreground",
          nestedPanel
            ? "hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
            : !panelSearch && "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
          "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
          "data-[selected]:text-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className,
        )}
        {...props}
      >
        {end ? (
          <>
            <SelectItemIcon icon={icon} size={size} />
            <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
            {end}
          </>
        ) : (
          <>
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
            <SelectItemIcon icon={icon} size={size} />
            <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
          </>
        )}
      </BaseSelect.Item>
    );
  }

  return (
    <BaseSelect.Item
      ref={itemRef}
      value={value}
      disabled={itemDisabled}
      hidden={hiddenBySearch}
      render={renderProp}
      data-panel-active={panelActive || undefined}
      onClick={handleClick}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      className={cn(
        "flex items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        // The main panel follows Base UI's keyboard highlight. Nested panels disable Base
        // UI's pointer-driven active row so their initial focus doesn't paint; CSS hover and
        // focus-visible keep actual pointer and keyboard movement visible.
        nestedPanel
          ? "hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
          : !panelSearch && "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectItemIcon icon={icon} size={size} />
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A fixed check slot keeps ordinary selects stable; `end` replaces it for custom
          trailing content such as an action's keybind hint. */}
      {end ?? (
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          <BaseSelect.ItemIndicator className="text-foreground">
            <Check className="size-3.5" />
          </BaseSelect.ItemIndicator>
        </span>
      )}
    </BaseSelect.Item>
  );
});
