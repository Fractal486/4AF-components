"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether a demo is being rendered on the full-screen route rather than in the inspector's
 * preview box.
 *
 * Most demos never need to ask. It exists for the ones that frame themselves — an app
 * shell has to be boxed and `contain`ed to sit inside a preview pane, and that framing is
 * exactly what you want gone when the point is to see it at full size.
 */
const FullscreenContext = createContext(false);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  return <FullscreenContext.Provider value>{children}</FullscreenContext.Provider>;
}

export function useIsFullscreen() {
  return useContext(FullscreenContext);
}
