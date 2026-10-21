"use client";

import { useSyncExternalStore } from "react";

/** Whether hovering a component in the site rail shows its blueprint card. On by default. */
const KEY = "4af-blueprint-previews";
const EVENT = "4af-blueprint-previews-change";
let fallback = true;

function readPreference() {
  try {
    return window.localStorage.getItem(KEY) !== "false";
  } catch {
    return fallback;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function setBlueprintPreviewsEnabled(enabled: boolean) {
  fallback = enabled;
  try {
    window.localStorage.setItem(KEY, String(enabled));
  } catch {
    // Keep the preference for this tab when storage is unavailable.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useBlueprintPreviewsEnabled() {
  return useSyncExternalStore(subscribe, readPreference, () => true);
}
