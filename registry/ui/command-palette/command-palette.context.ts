import { createContext, useContext, useEffect } from "react";

// How a panel's `useCommandSearch` tells the palette to show the inline header loader.
// It reports only the *refresh* case (a search running over results already on screen),
// so the header spinner and a first-load `CommandPanelLoading` are mutually exclusive —
// exactly as the input-row and empty-region loaders are on the root list. The root's own
// `useCommandSearch` call sits outside this provider, so it reports to no one.
export const PanelSearchContext = createContext<((refreshing: boolean) => void) | null>(null);

export type PanelHighlightHandler = (value: unknown) => void;

export type PanelHighlightRegistration = (handler: PanelHighlightHandler | null) => () => void;

// A custom panel can observe the shared Autocomplete highlight without reaching into the
// palette's root. This is used by server-backed panels that need to react when the last
// visible row becomes highlighted (for example, to fetch the next page).
export const PanelHighlightContext = createContext<PanelHighlightRegistration | null>(null);

export function useCommandPanelHighlight(handler: PanelHighlightHandler | null): void {
  const register = useContext(PanelHighlightContext);

  useEffect(() => {
    if (!register) return;
    return register(handler);
  }, [handler, register]);
}

export interface PanelActionsRegistry {
  /** The panel's actions menu hands over how to open it, for as long as it is mounted. */
  register: (open: () => void) => () => void;
  /** Open the panel's actions menu. False when the panel has none. */
  open: () => boolean;
}

/**
 * How a right-clicked row reaches the actions menu in its panel's footer. The two are
 * siblings inside the consumer's panel, so the palette holds the menu's opener for both.
 */
export const PanelActionsContext = createContext<PanelActionsRegistry | null>(null);

/**
 * Set while an actions menu is open, so the list behind it stops following the pointer.
 *
 * The menu belongs to one row. Leaving it with the cursor crosses back over the list, and
 * every row it passes would otherwise take the highlight — so the user returns to a menu
 * that now appears to belong to a different row than the one they opened it from. Freezing
 * the highlight keeps the two attached for as long as the menu is up.
 */
export const ActionsOpenContext = createContext<((open: boolean) => void) | null>(null);

/**
 * The row the open actions menu belongs to.
 *
 * Base UI drops `data-highlighted` the moment focus leaves the list for the menu, so the
 * row can't keep the primitive's own highlight. The palette remembers which row was
 * highlighted when the menu opened and the rows paint that themselves — `data-frozen`,
 * styled identically to `data-highlighted`.
 */
export const FrozenRowContext = createContext<unknown>(undefined);

/** True when this row is the one an open actions menu belongs to. */
export function useFrozen(value: unknown): boolean {
  const frozen = useContext(FrozenRowContext);
  return frozen !== undefined && Object.is(frozen, value);
}

/** Lets the footer parts drive the palette without threading props through the panel. */
export interface PaletteControls {
  close: () => void;
  back: () => void;
  /** True whenever a page has been drilled into, so Escape means "back", not "close". */
  canGoBack: boolean;
}

export const PaletteControlsContext = createContext<PaletteControls | null>(null);
