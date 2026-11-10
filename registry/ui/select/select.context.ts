"use client";

import { createContext, useContext, type MouseEvent, type ReactNode } from "react";

/**
 * Why a panel's rows rest. `pointer`: the pointer has left a panel without a search field; its
 * active row is kept for the arrow keys to resume from, but stops painting, as a hover does when
 * the pointer moves away. `footer`: a footer button holds the active mark, so no row paints —
 * including the row Base UI still highlights after focus moved down off it.
 */
export const SelectPanelDormantContext = createContext<"pointer" | "footer" | false>(false);
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
  registerOptionText: (value: unknown, text: string, parentValue?: unknown, disabled?: boolean, node?: HTMLElement | null) => void;
  unregisterOptionText: (value: unknown) => void;
  setActiveItem: (value: unknown) => void;
  panelSearch: boolean;
  setPanelSearch: (enabled: boolean) => void;
  /** Reset the selection to none (single → null, multiple → empty). */
  clear: (event?: MouseEvent<HTMLButtonElement>) => void;
}

interface SelectSearchContextValue {
  /** True when the text passes the current panel-search query (or there is none). */
  matchesQuery: (text: string) => boolean;
  /** Whether any top-level item remains visible under the current query. */
  hasVisibleItems: boolean;
  /** Whether an item has a matching row anywhere in its nested panels. */
  hasMatchingDescendant: (value: unknown) => boolean;
  /** The row a panel opens on: the selection while the list is whole, else the first row. */
  getOpeningItem: (list: HTMLElement | null) => unknown;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Highlight and filtering change independently of trigger labels, selection, and registration.
export const SelectActiveItemContext = createContext<unknown>(undefined);
export const SelectSearchContext = createContext<SelectSearchContextValue>({
  matchesQuery: () => true,
  hasVisibleItems: false,
  hasMatchingDescendant: () => false,
  getOpeningItem: () => undefined,
  searchQuery: "",
  setSearchQuery: () => {},
});

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
  setActiveItem: () => {},
  panelSearch: false,
  setPanelSearch: () => {},
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
  /** Swapped in from (or out for) a sibling nested panel: animate briefly, not fully. */
  swapping: boolean;
}

/** A nested panel as its siblings see it, for swapping between them quickly. */
export interface SelectSubSibling {
  open: boolean;
  closedAt: number;
  setSwapping: (swapping: boolean) => void;
}

/** The nested panels opened from one Select panel. */
export const SelectSubSiblingsContext = createContext<Set<SelectSubSibling> | null>(null);

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
  const { searchQuery, matchesQuery } = useContext(SelectSearchContext);
  return { query: searchQuery, matches: matchesQuery };
}
