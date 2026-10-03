import { cn } from "@/registry/lib/cn";
import { useContext, type ComponentProps, type ReactNode } from "react";
import { PaletteControlsContext } from "./command-palette.context";
import { formatKeybind } from "./command-palette.keybinds";

/**
 * A keycap.
 *
 * A translucent lift rather than a fixed token, because a keycap has to sit just above
 * *whatever* it's printed on, and that isn't one surface: the palette panel is
 * `surface-raised`, a menu row is `surface`. `foreground` at 8% steps up from either, and
 * flips direction on its own between themes — a pale wash on ink in dark, a grey one on
 * white in light. A fixed value can only be right on one of them.
 */
export const KBD =
  "shrink-0 rounded-xs bg-foreground/8 px-1.5 py-0.5 font-mono text-2xs text-subtle-foreground select-none";

// A thin custom scrollbar, shared by the list and any drilled-in panel — Firefox via the
// standard properties, WebKit via the pseudo-elements.
export const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

/**
 * Every footer affordance — the escape hint, the panel actions, the actions-menu trigger —
 * shares this, so the bar can't end up with two different-looking buttons.
 *
 * `py-1 -my-1` is the trick that lets a hover background exist without the bar growing:
 * the padding gives the highlight a box to fill, and the negative margin hands the height
 * back, so the key chip still sets the row height exactly as it does in a static hint.
 */
export const ACTION_CLASS = cn(
  "flex cursor-pointer items-center gap-1.5 rounded-xs -my-1 px-1.5 py-1 text-2xs text-subtle-foreground",
  "outline-none transition-colors duration-(--duration-fast)",
  "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-50",
);

const INERT_HINT_CLASS =
  "flex items-center gap-1 rounded-xs -my-1 px-1.5 py-1 text-2xs text-subtle-foreground";

/** A standard 16px icon slot for palette rows and custom panel content. */
export function CommandIcon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("flex size-4 shrink-0 items-center justify-center [&_svg]:size-4", className)}
      {...props}
    />
  );
}

/**
 * The escape affordance. Escape steps back out of a drilled-in page and only dismisses the
 * palette from the root, so the hint has to say which one it currently does.
 */
export function EscapeHint() {
  const controls = useContext(PaletteControlsContext);
  if (!controls) return null;

  return controls.canGoBack ? (
    <Hint keys={["esc"]} onClick={controls.back}>
      Back
    </Hint>
  ) : (
    <Hint keys={["esc"]} onClick={controls.close}>
      Close
    </Hint>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className={cn(KBD, "flex min-w-4 items-center justify-center px-1")}>
      {children}
    </kbd>
  );
}

export function CommandKeybindHint({ value }: { value: string }) {
  const parts = formatKeybind(value);
  if (parts.length === 0) return null;

  return (
    <span aria-label={value} className="flex shrink-0 items-center gap-0.5">
      {parts.map((part, index) => (
        <Kbd key={`${part}-${index}`}>{part}</Kbd>
      ))}
    </span>
  );
}

export function Hint({
  keys,
  children,
  onClick,
  trailingKeys = false,
}: {
  keys: ReactNode[];
  children: ReactNode;
  /** Given one, the hint becomes a real button that performs what it describes. */
  onClick?: () => void;
  /**
   * Put the key chip after the label. That is the bottom-right corner's convention — see
   * `FooterAction` — so a hint pinned to that corner reads the same way the panel footers'
   * Enter slot does.
   */
  trailingKeys?: boolean;
}) {
  const chips = (
    <span className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <Kbd key={i}>{key}</Kbd>
      ))}
    </span>
  );
  const content = trailingKeys ? (
    <>
      {children}
      {chips}
    </>
  ) : (
    <>
      {chips}
      {children}
    </>
  );

  // Without an action it's documentation (↑↓ Navigate has nothing to click), so it stays
  // an inert span rather than a button that lies about being pressable.
  if (!onClick) {
    return (
      <span className={INERT_HINT_CLASS}>{content}</span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(ACTION_CLASS, "gap-1")}>
      {content}
    </button>
  );
}

/**
 * The Enter slot's button. The palette is keyboard-first, so it reads as a hint with a key
 * chip ("Open" + return) rather than as a button: the label leads and the key trails,
 * mirroring the escape hint at the other end of the bar. Still a real `<button>`, so it
 * stays clickable and `type="submit"` submits the panel's form.
 *
 * Internal to the footer. The footer is the only thing that may put something in that corner, and the
 * chip it draws is fixed.
 */
export function FooterAction({ children, className, ...props }: ComponentProps<"button">) {
  return (
    <button className={cn(ACTION_CLASS, className)} {...props}>
      {children}
    </button>
  );
}
