"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";

/**
 * Swaps one piece of content for another, animating the change.
 *
 * Not icon-specific: the animation doesn't care whether it's moving an `<svg>` or the
 * word "Following". Copy → check, play → pause, "Follow" → "Following".
 *
 * This is one of the few places Motion genuinely earns its bundle size. The enter is
 * easy — CSS does enters fine. The problem is that the *outgoing* content has to keep
 * animating after React has already decided to unmount it, and AnimatePresence is the
 * only thing that keeps it alive long enough to leave.
 *
 *   <Morph activeKey={copied ? "done" : "idle"}
 *          items={{ idle: <CopyIcon />, done: <CheckIcon /> }} />
 */
const morph: Variants = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
};

export interface MorphProps<K extends string> {
  /** Which item is showing. Changing it is what triggers the swap. */
  activeKey: K;
  /**
   * Every state this can be in — not just the current one.
   *
   * Taking all of them is what lets the box reserve the size of the *widest*, so it
   * never resizes mid-swap. A control that changes width under the cursor moves the
   * target out from under it; animating that width only makes it move smoothly, which
   * is still moving. "Follow" and "Following" are different widths, and the button
   * should be the width of "Following" in both states.
  */
  items: Record<K, ReactNode>;
  className?: string;
}

export function Morph<K extends string>({
  activeKey,
  items,
  className,
}: MorphProps<K>) {
  // The CSS `prefers-reduced-motion` rule can't reach Motion — the cascade doesn't
  // touch JS animation. `duration: 0` rather than a very short spring: a spring with a
  // near-zero duration doesn't settle instantly, it settles *violently*. The content
  // still swaps; it just stops being animated, which is what the preference asks for.
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : spring.clean;
  const keys = Object.keys(items) as K[];

  return (
    // Every item lives in the same single grid cell, so the cell is as wide and as tall
    // as the largest of them and the box never changes size. `relative` also anchors
    // the exiting item, which popLayout pulls out of flow.
    <span
      data-slot="morph"
      className={cn("relative inline-grid place-items-center", className)}
    >
      {/* The sizers. Hidden, inert, and unreadable — they exist only to hold the box
          open at the width of the longest item. `invisible` (visibility: hidden) and
          not `hidden` (display: none), because only the former still occupies space. */}
      {keys.map((key) => (
        <span
          key={key}
          aria-hidden="true"
          className="invisible [grid-area:1/1] pointer-events-none whitespace-nowrap"
        >
          {items[key]}
        </span>
      ))}

      {/* `initial={false}` — no animation on first paint. Without it everything on the
          page pops in on mount, which reads as a page that's still loading. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={activeKey}
          className="inline-grid place-items-center [grid-area:1/1] whitespace-nowrap"
          variants={morph}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          {items[activeKey]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
