"use client";

import { Copy } from "lucide-react";
import { useRef, type ReactNode } from "react";
import {
  ActionButton,
  type ActionButtonProps,
} from "@/registry/ui/action-button/action-button";

export type CopyButtonSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZE: Record<CopyButtonSize, "icon-xs" | "icon-sm" | "icon" | "icon-lg"> = {
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
};

export interface CopyButtonProps
  extends Omit<
    ActionButtonProps,
    // `onCopy` is also a native DOM clipboard event on every element, and ours means
    // something else entirely. Drop the DOM one rather than rename around it.
    //
    // `value` is likewise a native `<button value>` attribute. It was compatible by
    // accident while ours was a plain string; the function form isn't, and forwarding a
    // form value through a copy button was never meaningful anyway.
    | "action"
    | "icon"
    | "labels"
    | "announce"
    | "children"
    | "onCopy"
    | "size"
    | "value"
  > {
  /**
   * The text placed on the clipboard.
   *
   * Pass a function when the text isn't known until the press — when it has to be
   * assembled from a selection, read off the DOM, or fetched. Doing that work up front to
   * satisfy a `string` means doing it on every render for a button that may never be
   * pressed; returning a promise here defers it to the one moment it's needed, and the
   * button's own pending state covers the wait.
   */
  value: string | (() => string | Promise<string>);
  /** The button size. Omit it for the default square icon-only button when unlabeled. */
  size?: CopyButtonSize;
  /**
   * The resting glyph. Defaults to the copy icon.
   *
   * Override it when the thing being copied has its own established symbol — a link, a
   * key, a coupon code — and two copy buttons side by side would otherwise be
   * indistinguishable. The success check mark is not affected.
   */
  icon?: ReactNode;
  /** Optional label. Without one this is an icon-only button. */
  children?: ReactNode;
  /** Overridable for translation — these are announced, not just displayed. */
  labels?: { copy: string; copied: string; failed: string };
  /** Fired once the text is genuinely on the clipboard, not merely attempted. */
  onCopy?: (value: string) => void;
}

/**
 * Copies to the clipboard and confirms it.
 *
 * This is ActionButton with one specific action, and that's the whole point: the state
 * machine — pending, success, failure, the revert timer, the unmount guard, the
 * announcement — lives in exactly one place. Copying is the only thing this file owns,
 * and the only thing about copying that's hard is `navigator.clipboard` not existing
 * half the time.
 *
 * For a plain string the spinner never appears: a clipboard write resolves in about a
 * millisecond, and the `pendingDelay` below outlives it, so the button goes straight from
 * copy to check — which is what actually happened. A lazy `value` that has to fetch
 * outlives the same delay and does show it, which is equally honest: the delay separates
 * "instant" from "actually waiting" rather than hiding the spinner outright.
 */
export function CopyButton({
  value,
  icon = <Copy />,
  children,
  labels = { copy: "Copy", copied: "Copied", failed: "Couldn't copy" },
  onCopy,
  onSuccess,
  variant = "outline",
  size,
  ...props
}: CopyButtonProps) {
  // What actually reached the clipboard, handed to `onCopy` after the fact. A lazy `value`
  // isn't knowable until the action has run, and `onCopy` fires from `onSuccess` — one
  // step later — so the resolved text has to survive the gap between them.
  const copied = useRef("");
  const buttonSize = children ? (size ?? "md") : size ? ICON_SIZE[size] : "icon";

  return (
    <ActionButton
      action={async () => {
        const text = typeof value === "function" ? await value() : value;
        await writeToClipboard(text);
        copied.current = text;
      }}
      icon={icon}
      variant={variant}
      size={buttonSize}
      // Just long enough to tell "already done" from "actually waiting", and no longer.
      //
      // A resolved string, or a function that returns one, finishes within a microtask —
      // far inside this window — so the spinner never appears for a copy that was instant,
      // which would read as a glitch rather than as progress. Anything that genuinely
      // waits (a fetch behind a lazy `value`) crosses it and gets the spinner.
      //
      // It has to stay small. At a couple of hundred milliseconds it lands *after* the
      // press spring has settled, so the button visibly finishes its press, sits there,
      // and only then admits it's working — the delay stops reading as "instant" and
      // starts reading as lag. 50ms is ~3 frames: below the threshold where a person
      // perceives a gap at all, and still an eternity next to a microtask.
      pendingDelay={50}
      // With a label, the label names the button. Without one there's no text at all,
      // so it needs an aria-label — and adding one *as well as* a label would override
      // and silence the visible text.
      aria-label={children ? undefined : labels.copy}
      // Success swaps the label only when there is one. Icon-only falls through to just
      // the check mark, which is the right amount of confirmation for a 32px button.
      labels={{ success: children ? labels.copied : undefined }}
      announce={{ success: labels.copied, error: labels.failed }}
      onSuccess={() => {
        onCopy?.(copied.current);
        onSuccess?.();
      }}
      {...props}
    >
      {children}
    </ActionButton>
  );
}

/**
 * `navigator.clipboard` only exists in a secure context — it's undefined on plain HTTP,
 * which is where a lot of local dev and intranet apps live. The deprecated `execCommand`
 * path is the only thing that works there, so it stays as a fallback.
 *
 * It throws on failure rather than returning false, because ActionButton's contract is
 * that a rejected action means the work did not happen.
 *
 * Exported because a clipboard write does not always live on a CopyButton — a menu row
 * runs the same write through its own loading state, and reimplementing the insecure-
 * context fallback beside it is how the two drift.
 */
export async function writeToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const previous = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  // Fixed and invisible: appending a visible field would scroll the page to it.
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
  document.body.appendChild(field);
  field.select();

  try {
    if (!document.execCommand("copy")) throw new Error("Copy command was rejected.");
  } finally {
    field.remove();
    // Selecting the field stole focus. Give it back, or the next Tab restarts from the
    // top of the document.
    if (previous instanceof HTMLElement) previous.focus();
  }
}
