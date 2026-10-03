import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * Text with a highlight sweeping across it — a looping "working…" affordance for a label
 * whose operation is in progress.
 *
 * The paint lives in the shared theme CSS (`.shimmer-text` / `.animate-text-shimmer`) rather than
 * in classes here, because it needs an `@supports` guard and a pseudo-element, neither of
 * which a utility class can express. Read the note there for why it is a masked overlay
 * and not the obvious `background-position` gradient.
 *
 * It's a looping indicator, so — like a spinner — its duration is a literal rather than a
 * `--duration-*` token: a 1ms loop is a strobe.
 *
 * Not `"use client"`: it's a styled element with no state or handlers.
 */

export interface TextShimmerProps {
  children: ReactNode;
  /** The element to render. Defaults to a `<span>`. */
  as?: ElementType;
  /** Sweep duration, in seconds. */
  duration?: number;
  className?: string;
}

export function TextShimmer({
  children,
  as: Comp = "span",
  duration = 2.5,
  className,
}: TextShimmerProps) {
  return (
    <Comp
      style={{ "--text-shimmer-duration": `${duration}s` } as CSSProperties}
      // Truncates itself. An inline-block is atomic to its parent's line, so the parent's
      // `truncate` clipped a long shimmering title without an ellipsis. Capped at the
      // parent's width rather than filling it, so the sweep still spans only the text;
      // `align-top` because an inline-block with hidden overflow sits on its bottom edge.
      // Spelled out, not `truncate`: tailwind-merge lets a caller's `overflow-hidden` or
      // `text-ellipsis` evict the shorthand, and `whitespace-nowrap` goes with it.
      className={cn("shimmer-text animate-text-shimmer inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-top", className)}
    >
      {children}
    </Comp>
  );
}
