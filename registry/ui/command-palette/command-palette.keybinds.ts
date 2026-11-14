
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
  if (trimmed === "+") return ["+"];

  if (trimmed.includes("+")) {
    const parts = trimmed.split(/\s*\+\s*/).filter(Boolean);
    // The final plus is the key in `mod++` or `shift++`, not another separator.
    if (/\+\s*\+$/.test(trimmed)) parts.push("+");
    return parts;
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


function ownsUnmodifiedKeys(event: KeyboardEvent): boolean {
  // composedPath also finds the actual control when a shadow root retargets the event.
  const targets = event.composedPath().length ? event.composedPath() : [event.target];
  return targets.some(target => target instanceof Element && (
    (target instanceof HTMLElement && target.isContentEditable)
    || target.closest('input, textarea, select, button, a[href], [role="button"], [role="link"], [role="textbox"], [contenteditable]:not([contenteditable="false"])') !== null
  ));
}

// Shift changes event.key to a glyph. For explicitly shifted digit/punctuation chords,
// also accept the physical key code (US key positions); letters remain layout-aware.
const shiftedCodes: Record<string, string> = {
  "0": "Digit0", "1": "Digit1", "2": "Digit2", "3": "Digit3", "4": "Digit4",
  "5": "Digit5", "6": "Digit6", "7": "Digit7", "8": "Digit8", "9": "Digit9",
  "`": "Backquote", "-": "Minus", "=": "Equal", "[": "BracketLeft", "]": "BracketRight",
  "\\": "Backslash", ";": "Semicolon", "'": "Quote", ",": "Comma", ".": "Period", "/": "Slash",
};

export function matchesKeybind(value: string, event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.isComposing) return false;
  const binding = parseKeybind(value);
  if (!binding) return false;

  const hasModifier = binding.mod || binding.ctrl || binding.meta || binding.alt || binding.shift;
  if (!hasModifier && ownsUnmodifiedKeys(event)) return false;

  if (binding.mod ? !(event.metaKey || event.ctrlKey) : event.metaKey !== binding.meta) {
    return false;
  }
  if (!binding.mod && event.ctrlKey !== binding.ctrl) return false;
  if (event.altKey !== binding.alt) return false;
  // A literal + follows the produced character on layouts that need Shift and on numpads.
  const literalPlus = binding.key === "+" && event.key === "+" && !binding.shift;
  if (event.shiftKey !== binding.shift && !literalPlus) return false;

  return normalizeKey(event.key) === binding.key
    || (binding.shift && shiftedCodes[binding.key] !== undefined && shiftedCodes[binding.key] === event.code);
}
