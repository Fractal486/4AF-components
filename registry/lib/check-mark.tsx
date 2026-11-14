"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";
import { duration, ease } from "@/registry/lib/motion";

export interface CheckMarkProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Whether the tick is shown. It draws in when this turns true and fades out when false. */
  checked: boolean;
  /**
   * Draw in on mount, for a tick that arrives as a status (an action's success) rather than
   * one a row shows from the start. Off, a mark mounted checked shows drawn.
   */
  appear?: boolean;
  /** Seconds to wait before drawing in, so a tick that swaps in can land before it strokes. */
  delay?: number;
  /** Defaults to 14px. Pass `""` to take the size from the surrounding icon rules. */
  className?: string;
}

/**
 * A list row's tick, drawn the way Checkbox's and Copy Button's are: it strokes in from its
 * short end when the row is selected. Deselecting doesn't wait on the stroke: it fades out in
 * half the fast duration, and its length resets once it's invisible, so the next selection
 * draws from the start. Lucide's check geometry (a 24-unit box, 2px stroke), so it matches the
 * icon it replaced at rest. A row that mounts selected shows its tick drawn rather than
 * drawing it on every open, unless `appear` asks for the draw. Under reduced motion it's
 * present or absent.
 */
export function CheckMark({ checked, appear = false, delay = 0, className = "size-3.5", ...props }: CheckMarkProps) {
  const reduceMotion = useReducedMotion();
  const fadeOut = duration.fast / 2;
  const drawIn = reduceMotion ? { duration: 0 } : { duration: duration.base, ease: ease.out, delay };
  const drawOut = reduceMotion
    ? { duration: 0 }
    : { opacity: { duration: fadeOut, ease: ease.out }, pathLength: { duration: 0, delay: fadeOut } };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-slot="check-mark"
      className={className || undefined}
      {...props}
    >
      <motion.path
        d="M4 12l5 5L20 6"
        initial={appear && !reduceMotion ? { pathLength: 0, opacity: 1 } : false}
        animate={
          checked
            ? { pathLength: 1, opacity: 1, transition: drawIn }
            : { pathLength: 0, opacity: 0, transition: drawOut }
        }
      />
    </svg>
  );
}
