import { createContext, useContext } from "react";

export interface SelectionToolbarContextValue {
  /** The selected text as it was when the bar opened. */
  text: string;
  /** The selected range as it was when the bar opened. Cloned, so it survives the selection being cleared. */
  range: Range | null;
  /** Dismiss the bar. The selection is left alone — an action may well have changed it. */
  close: () => void;
}

export const SelectionToolbarContext = createContext<SelectionToolbarContextValue>({
  text: "",
  range: null,
  close: () => {},
});

/** The captured selection, for building a bar item that isn't `SelectionToolbarButton`. */
export function useSelectionToolbar(): SelectionToolbarContextValue {
  return useContext(SelectionToolbarContext);
}
