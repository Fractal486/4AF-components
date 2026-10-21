import { createContext, useContext, type MouseEvent, type ReactNode } from "react";
import type { SelectSize } from "./select.shared";

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
  /**
   * How the trigger is sized, registered by the trigger: `content` when its width follows
   * its own text (a `plain` trigger, the sort/filter chip), `field` when the layout sets it.
   * A content-sized trigger changes width as the selection does, so its panel sizes to its
   * own rows rather than following it.
   */
  triggerSizing: "field" | "content";
  setTriggerSizing: (sizing: "field" | "content") => void;
  /** Registers the trigger element; `SelectTrigger` and `SelectSortTrigger` call it. */
  setTriggerNode: (node: HTMLElement | null) => void;
  /**
   * The trigger edge the panel lines up with unless `SelectContent` sets `align`: the one
   * that holds still as the trigger's text changes, measured each time the panel opens.
   */
  panelEdge: "start" | "end";

  /** The current selection, always as an array (one entry for single-select). */
  values: unknown[];
  registerIcon: (value: unknown, icon: ReactNode | undefined) => void;
  unregisterIcon: (value: unknown) => void;
  iconFor: (value: unknown) => ReactNode | undefined;
  registerLabel: (value: unknown, label: ReactNode) => void;
  unregisterLabel: (value: unknown) => void;
  labelFor: (value: unknown) => ReactNode | undefined;
  firstItem: unknown;
  registerOptionText: (value: unknown, text: string, parentValue?: unknown, disabled?: boolean) => void;
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
  clear: (event?: MouseEvent<HTMLButtonElement>) => void;
}

export const SelectContext = createContext<SelectContextValue>({
  open: false,
  multiple: false,
  disabled: false,
  readOnly: false,
  setOpen: () => {},
  setValue: () => {},
  registerNestedPanel: () => {},
  isNestedPanelTarget: () => false,
  size: "sm",
  triggerSizing: "field",
  setTriggerSizing: () => {},
  setTriggerNode: () => {},
  panelEdge: "start",

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

export const SELECT_CLEAR_ACTION = Symbol("select-clear-action");

export interface SelectSubItemContextValue {
  open: boolean;
  parentValue: unknown;
  registerItem: (value: unknown, node: HTMLElement | null) => void;
}

interface SelectSubContextValue {
  open: boolean;
  disabled: boolean;
  anchor: HTMLElement | null;
  triggerValue: symbol;
  itemValues: readonly unknown[];
  focusTrigger: () => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  setCloseDelay: (delay: number) => void;
  setOpen: (open: boolean, details?: unknown) => void;
  openAndFocus: () => void;
  scheduleOpen: (delay: number) => void;
  scheduleClose: (delay?: number) => void;
  cancelClose: () => void;
  /** The trigger was left at this point: hold the panel open while the pointer heads for it. */
  leaveTowardPanel: (x: number, y: number, fallbackDelay: number) => void;
  setPanelNode: (node: HTMLElement | null) => void;
}

export const SelectSubContext = createContext<SelectSubContextValue | null>(null);

export const SelectSubItemContext = createContext<SelectSubItemContextValue | null>(null);

export function useSelectSubContext() {
  const context = useContext(SelectSubContext);

  if (!context) {
    throw new Error(
      "SelectSubTrigger and SelectSubContent must be used inside SelectSub.",
    );
  }

  return context;
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
