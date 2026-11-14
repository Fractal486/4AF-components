"use client";

import { useSyncExternalStore } from "react";

// Platform is stable for the lifetime of the page; there is no global listener to install.
const subscribePlatform = () => () => {};
const serverPlatform = () => false;
const applePlatform = () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

export function useAppleKeys() {
  // A stable server snapshot also makes the first hydration render match the HTML.
  return useSyncExternalStore(subscribePlatform, applePlatform, serverPlatform);
}

const aliases: Record<string, string> = {
  cmd: "meta", command: "meta", "⌘": "meta",
  control: "ctrl", "⌃": "ctrl", option: "alt", opt: "alt", "⌥": "alt", "⇧": "shift",
  esc: "escape", "⎋": "escape", return: "enter", "↵": "enter", "⏎": "enter",
  "⌫": "backspace", "⌦": "delete", del: "delete", "⇥": "tab",
  up: "arrowup", "↑": "arrowup", down: "arrowdown", "↓": "arrowdown",
  left: "arrowleft", "←": "arrowleft", right: "arrowright", "→": "arrowright",
  spacebar: "space", plus: "+", pgup: "pageup", pgdn: "pagedown",
};

const appleLabels: Record<string, string> = {
  mod: "⌘", meta: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧", enter: "↵", backspace: "⌫",
};
const otherLabels: Record<string, string> = {
  mod: "Ctrl", meta: "Win", ctrl: "Ctrl", alt: "Alt", shift: "Shift", enter: "Enter", backspace: "Backspace",
};
const commonLabels: Record<string, string> = {
  escape: "Esc", space: "Space", tab: "Tab", delete: "Del", home: "Home", end: "End",
  pageup: "PgUp", pagedown: "PgDn", arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→",
};

/** Plus joins keys; spaces separate sequence steps. `plus` also names the literal + key. */
export function parseKbdKeys(value: string): string[][] {
  return value.trim()
    .replace(/(?<!\+)\s*\+(?!\+)\s*/g, "+")
    .split(/\s+/)
    .filter(Boolean)
    .map(chord => {
      const compact = !chord.includes("+") && /^(command|control|option|shift|meta|ctrl|alt|mod|cmd)(.+)$/i.exec(chord);
      const separated = compact ? `${compact[1]}+${compact[2]}` : chord;
      return separated.replace(/([⌘⌃⌥⇧])(?=[^+])/g, "$1+")
        .split(/\+(?!$)/)
        .filter(Boolean)
        .map(key => {
          const normalized = key.toLowerCase();
          return Object.hasOwn(aliases, normalized) ? aliases[normalized]! : normalized;
        });
    });
}

export function kbdKeyLabel(key: string, apple: boolean): string {
  const platformLabels = apple ? appleLabels : otherLabels;
  if (Object.hasOwn(platformLabels, key)) return platformLabels[key]!;
  if (Object.hasOwn(commonLabels, key)) return commonLabels[key]!;
  return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatKbdKeys(keys: string, apple: boolean): string {
  return parseKbdKeys(keys).map(chord => chord.map(key => kbdKeyLabel(key, apple)).join(apple ? "" : "+")).join(" then ");
}
