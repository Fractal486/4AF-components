const query = "(prefers-reduced-motion: reduce)";

function currentWindow() {
  return typeof window === "undefined" ? undefined : window;
}

/** Read at animation start; pass an element's own window for portals into another document. */
export function prefersReducedMotion(view: Window | null | undefined = currentWindow()): boolean {
  return view?.matchMedia?.(query).matches ?? false;
}

/** Subscribe without a React dependency. Safe on the server and in DOMs without matchMedia. */
export function subscribeReducedMotion(change: () => void, view: Window | null | undefined = currentWindow()) {
  const media = view?.matchMedia?.(query);
  media?.addEventListener("change", change);
  return () => media?.removeEventListener("change", change);
}
