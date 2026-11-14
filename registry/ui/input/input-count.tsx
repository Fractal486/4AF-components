"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { inputCountVariants } from "./input.variants";

export interface InputCountProps extends Omit<ComponentProps<"span">, "children"> {
  /** Current string length, using the same UTF-16 units as native maxLength. */
  length: number;
  /** Omit for a count without a limit. Does not enforce the input's maxLength. */
  maxLength?: number | null;
  /** Remaining characters at which to emphasize and announce the count. */
  threshold?: number;
  /** Customize or translate the announcement. Negative remaining means over the limit. */
  announcement?: (remaining: number) => string;
}

/** A caller-controlled count, suitable for Input or Textarea. */
export function InputCount({ length, maxLength, threshold, announcement, className, ...props }: InputCountProps) {
  const count = Number.isFinite(length) ? Math.max(0, Math.floor(length)) : 0;
  const limit = maxLength != null && Number.isFinite(maxLength) && maxLength >= 0
    ? Math.floor(maxLength) : null;
  const remaining = limit == null ? null : limit - count;
  const nearAt = threshold != null && Number.isFinite(threshold)
    ? Math.max(0, Math.floor(threshold)) : Math.min(20, Math.ceil((limit ?? 0) * 0.1));
  const state = remaining == null ? undefined : remaining <= 0 ? "limit" : remaining <= nearAt ? "near" : undefined;
  const message = state && remaining != null
    ? announcement?.(remaining) ?? (remaining < 0
      ? `${-remaining} character${remaining === -1 ? "" : "s"} over the limit`
      : remaining === 0 ? "Character limit reached"
        : `${remaining} character${remaining === 1 ? "" : "s"} remaining`)
    : "";
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    // Wait for a short typing pause instead of announcing every keystroke.
    const timer = setTimeout(() => setLiveMessage(message), 400);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <>
      <span {...props} data-slot="input-count" data-state={state} className={cn(inputCountVariants(), className)}>
        {limit == null ? count : `${count} / ${limit}`}
      </span>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message ? liveMessage : ""}
      </span>
    </>
  );
}
