"use client";

import { useSyncExternalStore } from "react";

const KEY = "4af-demo-reveals";
const EVENT = "4af-demo-reveals-change";
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

export function setDemoRevealsEnabled(enabled: boolean) {
  fallback = enabled;
  try {
    window.localStorage.setItem(KEY, String(enabled));
  } catch {
    // Keep the preference for this tab when storage is unavailable.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useDemoRevealsEnabled() {
  return useSyncExternalStore(subscribe, readPreference, () => true);
}
