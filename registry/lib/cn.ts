import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: { shadow: ["border", "raised", "overlay", "overlay-drop", "overlay-subtle"] },
    // The glass material sets the background, so it replaces a `bg-*` colour and vice versa.
    classGroups: { "bg-color": ["material-glass"] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Merge Base UI state-based classes without passing the callback to clsx. */
export function mergeStateClassName(base: string, className?: string): string;
export function mergeStateClassName<State>(base: string, className: string | ((state: State) => string | undefined) | undefined): string | ((state: State) => string);
export function mergeStateClassName<State>(base: string, className?: string | ((state: State) => string | undefined)) {
  return typeof className === "function"
    ? (state: State) => cn(base, className(state))
    : cn(base, className);
}
