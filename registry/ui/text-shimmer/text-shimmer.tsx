import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * Text with a highlight sweeping across it — a looping "working…" affordance for a label
 * whose operation is in progress.
 *
 * The sweep is a gradient (a solid base with a brighter highlight through the middle)
 * clipped to the glyphs and moved with `background-position`. The two colours are theme
 * tokens (`--text-shimmer-base` / `--text-shimmer-highlight`) because "brighter" isn't
 * one direction: in light mode it's a pale sheen over ink, in dark mode a white sheen
 * over dimmed grey. It's a looping indicator, so — like a spinner — its
 * duration is a literal rather than a `--duration-*` token (a 1ms loop is a strobe), and
 * under reduced motion it's switched off, not sped up, leaving a legible static gradient.
 * The animation lives on a class (`animate-text-shimmer`) rather than inline, so
 * `motion-reduce:animate-none` can actually override it.
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
      className={cn(
        "inline-block bg-clip-text text-transparent [background-size:200%_100%]",
        "bg-[linear-gradient(110deg,var(--text-shimmer-base)_40%,var(--text-shimmer-highlight)_50%,var(--text-shimmer-base)_60%)]",
        "animate-text-shimmer motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
