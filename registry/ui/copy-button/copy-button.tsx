"use client";

import { Copy } from "lucide-react";
import type { ReactNode } from "react";
import {
  ActionButton,
  type ActionButtonProps,
} from "@/registry/ui/action-button/action-button";

export interface CopyButtonProps
  extends Omit<
    ActionButtonProps,
    // `onCopy` is also a native DOM clipboard event on every element, and ours means
    // something else entirely. Drop the DOM one rather than rename around it.
    "action" | "icon" | "labels" | "announce" | "children" | "onCopy"
  > {
  /** The text placed on the clipboard. */
  value: string;
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
 * The spinner never appears in practice: a clipboard write resolves in a millisecond,
 * well inside ActionButton's `pendingDelay`, so the button goes straight from copy to
 * check — which is what actually happened.
 */
export function CopyButton({
  value,
  children,
  labels = { copy: "Copy", copied: "Copied", failed: "Couldn't copy" },
  onCopy,
  onSuccess,
  variant = "outline",
  size,
  ...props
}: CopyButtonProps) {
  return (
    <ActionButton
      action={() => writeToClipboard(value)}
      icon={<Copy />}
      variant={variant}
      size={size ?? (children ? "md" : "icon")}
      // With a label, the label names the button. Without one there's no text at all,
      // so it needs an aria-label — and adding one *as well as* a label would override
      // and silence the visible text.
      aria-label={children ? undefined : labels.copy}
      // Success swaps the label only when there is one. Icon-only falls through to just
      // the check mark, which is the right amount of confirmation for a 32px button.
      labels={{ success: children ? labels.copied : undefined }}
      announce={{ success: labels.copied, error: labels.failed }}
      onSuccess={() => {
        onCopy?.(value);
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
 */
async function writeToClipboard(text: string) {
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
