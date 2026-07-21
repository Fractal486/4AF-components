"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A looping ASCII spinner — the braille cycle rendered as a swapped glyph.
 *
 * It's text, not an SVG, so it sits on the baseline of whatever it's beside and scales
 * with the surrounding font size rather than needing its own dimensions. No transform,
 * no keyframes: one character, swapped on a timer.
 *
 * Exempt from the reduced-motion collapse, like every spinner here. A glyph swap isn't
 * on-screen movement, and collapsing it to nothing would leave one frozen character that
 * reads as *stalled* rather than working — so under reduced motion it slows instead of
 * stopping, which is what a status indicator is for.
 */

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface AsciiLoaderProps {
  /** Seconds per full cycle. */
  speed?: number;
  /**
   * An accessible label. Omit it where something nearby already announces the busy state
   * — an `aria-live` region, say — so a screen reader isn't told "Loading" twice.
   */
  label?: string;
  className?: string;
}

export function AsciiLoader({ speed = 0.8, label, className }: AsciiLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const step = ((reduce ? speed * 2.5 : speed) / FRAMES.length) * 1000;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), step);
    return () => clearInterval(id);
  }, [speed, reduce]);

  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block font-mono leading-none tabular-nums", className)}
    >
      {FRAMES[frame]}
    </span>
  );
}
