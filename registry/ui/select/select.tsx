"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { createChangeEventDetails } from "@base-ui/react/internals/createBaseUIEventDetails";
import { useCallback, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { SelectContext } from "./select.context";
import type { SelectSize } from "./select.shared";
import { isEquivalentNode } from "./select.utils";
import type { SelectTriggerVariant } from "./select.variants";

// Keep the installable component's public API at this entry point.
export { SelectContent, type SelectFooterAction } from "./select.content";
export { useSelectSearch } from "./select.context";
export {
  SelectItem,
  SelectSeparator,
  type SelectItemProps,
  type SelectSeparatorProps,
} from "./select.item";
export type { SelectSize } from "./select.shared";
export {
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
  type SelectSubContentProps,
  type SelectSubProps,
  type SelectSubTriggerProps,
} from "./select.sub";
export {
  SelectSortTrigger,
  SelectTrigger,
  SelectValue,
  type SelectSortTriggerProps,
  type SelectTriggerProps,
} from "./select.trigger";

/**
 * A single or multi-select with Base UI keyboard navigation, typeahead, focus management,
 * positioning, form input, and ARIA. The panel scales and blurs in, then fades on close.
 *
 * `multiple` keeps the panel open and switches values and items to count/checkbox forms.
 */

interface SelectOptionInfo {
  text: string;
  parentValue: unknown;
  disabled: boolean;
}

interface SelectOptionRegistration extends SelectOptionInfo {
  count: number;
}

/**
 * Resolve a label before the popup mounts from an `items` record (`{ value: label }`)
 * or array (`{ value, label }[]`). Mounted items register their labels separately.
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
 * Read an icon from array-form item data before the popup mounts.
 * The record form (`{ value: label }`) carries labels only.
 */
function iconFromItems(items: unknown, value: unknown): ReactNode | undefined {
  if (!Array.isArray(items)) return undefined;
  return (items as { value: unknown; icon?: ReactNode }[]).find((item) =>
    Object.is(item.value, value),
  )?.icon;
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
  /** Compact 24px (`xs`), 30px (`sm`, default), or 34px (`md`) form-row size. */
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
      if (!isValueControlled && !details.isCanceled) setUncontrolledValue(next as Value | Value[]);
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

      if (current.has(v) && isEquivalentNode(current.get(v), label)) return current;
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
    (v: unknown, text: string, parentValue?: unknown, disabled = false) => {
      if (parentValue !== undefined) {
        setNestedOptionTexts((current) => {
          const previous = current.get(v);
          return new Map(current).set(v, {
            text,
            parentValue,
            disabled,
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
          disabled,
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

  // Disabled matches still keep the list visible, but cannot be offered to Enter.
  const firstEnabledItem = useMemo(() => {
    for (const [value, option] of optionTexts) {
      if (!option.disabled && (matchesQuery(option.text) || hasMatchingDescendant(value))) {
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
  // and the search variant inherits that. Matching it here is what keeps all selects
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
        const option = optionTexts.get(openingValues[index]);
        if (option && !option.disabled) return openingValues[index];
      }
    }
    return firstEnabledItem;
  }, [firstEnabledItem, openingValues, optionTexts, searchQuery]);
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

  const clear = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    const empty = (multiple ? ([] as Value[]) : null) as Value | Value[] | null;
    // Select has no clear-press reason. Use its programmatic-change reason, retaining the
    // originating click and the same cancellation contract as ordinary option changes.
    const details = createChangeEventDetails("none", event?.nativeEvent, event?.currentTarget);
    handleValueChange(empty as never, details);
  }, [handleValueChange, multiple]);

  const [icons, setIcons] = useState<Map<unknown, ReactNode>>(() => new Map());
  const registerIcon = useCallback((value: unknown, icon: ReactNode | undefined) => {
    setIcons((current) => {
      if (icon == null) {
        if (!current.has(value)) return current;
        const next = new Map(current);
        next.delete(value);
        return next;
      }

      if (current.has(value) && isEquivalentNode(current.get(value), icon)) return current;
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
      // A programmatic close — a footer action, say — has no Base UI event behind it, and
      // `handleOpenChange` reads `reason` and `isCanceled` off the details either way.
      // Standing one in here keeps the context setter callable without one.
      handleOpenChange(
        nextOpen,
        (details ?? { reason: undefined, isCanceled: false, cancel: () => undefined }) as never,
      );
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
