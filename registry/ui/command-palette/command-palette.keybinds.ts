
interface ParsedKeybind {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

function splitKeybind(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.includes("+")) {
    return trimmed.split(/\s*\+\s*/).filter(Boolean);
  }

  const compactModifier = /^(⌘|⌃|⌥|⇧|mod|cmd|command|meta|ctrl|control|alt|option|shift)(.+)$/i.exec(
    trimmed,
  );
  return compactModifier ? [compactModifier[1]!, compactModifier[2]!] : [trimmed];
}

function normalizeKey(value: string): string {
  switch (value.toLowerCase()) {
    case "esc":
      return "escape";
    case "return":
      return "enter";
    case "spacebar":
    case "space":
      return " ";
    case "del":
      return "delete";
    default:
      return value.toLowerCase();
  }
}

function parseKeybind(value: string): ParsedKeybind | null {
  let key: string | undefined;
  let mod = false;
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;

  for (const part of splitKeybind(value)) {
    switch (part.toLowerCase()) {
      case "mod":
        mod = true;
        break;
      case "cmd":
      case "command":
      case "meta":
      case "⌘":
        meta = true;
        break;
      case "ctrl":
      case "control":
      case "⌃":
        ctrl = true;
        break;
      case "alt":
      case "option":
      case "⌥":
        alt = true;
        break;
      case "shift":
      case "⇧":
        shift = true;
        break;
      default:
        key = normalizeKey(part);
    }
  }

  return key ? { key, mod, ctrl, meta, alt, shift } : null;
}

export function formatKeybind(value: string): string[] {
  return splitKeybind(value).map((part) => {
    switch (part.toLowerCase()) {
      case "mod":
      case "cmd":
      case "command":
      case "meta":
      case "⌘":
        return "⌘";
      case "ctrl":
      case "control":
      case "⌃":
        return "Ctrl";
      case "alt":
      case "option":
      case "⌥":
        return "Alt";
      case "shift":
      case "⇧":
        return "Shift";
      case "esc":
        return "Esc";
      case "backspace":
        return "Backspace";
      default:
        return part.length === 1 ? part.toUpperCase() : part;
    }
  });
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function matchesKeybind(value: string, event: KeyboardEvent): boolean {
  const binding = parseKeybind(value);
  if (!binding) return false;

  const hasModifier = binding.mod || binding.ctrl || binding.meta || binding.alt || binding.shift;
  if (!hasModifier && isEditableTarget(event.target)) return false;

  if (binding.mod ? !(event.metaKey || event.ctrlKey) : event.metaKey !== binding.meta) {
    return false;
  }
  if (!binding.mod && event.ctrlKey !== binding.ctrl) return false;
  if (event.altKey !== binding.alt || event.shiftKey !== binding.shift) return false;

  return normalizeKey(event.key) === binding.key;
}
