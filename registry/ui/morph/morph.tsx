"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import { LoaderSizerContext } from "@/registry/lib/loader";

/**
 * Swaps one piece of content for another, animating the change.
 *
 * Not icon-specific: the animation doesn't care whether it's moving an `<svg>` or the
 * word "Following". Copy → check, play → pause, "Follow" → "Following".
 *
 * Morph uses AnimatePresence to retain outgoing content through its exit. Base UI
 * popups can use CSS exits through their presence lifecycle.
 *
 *   <Morph activeKey={copied ? "done" : "idle"}
 *          items={{ idle: <CopyIcon />, done: <CheckIcon /> }} />
 *
 * The poses are exported for content that cannot change key because it must stay mounted —
 * a hidden label that still names its button — so it can leave and return in the same
 * motion as a swap, by animating between `animate` and `exit`.
 */
export const morphVariants: Variants = {
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
  /**
   * `"widest"` (the default) holds the box at the size of the largest item. `"current"`
   * sizes it to the showing item and animates its width between items — an opt-in for
   * when the space a wide state would leave empty matters more than a still target.
   * Width is a layout property, so this is one of the library's accepted layout-motion
   * exceptions; it rides `--duration-base` and collapses under reduced motion.
   */
  sizing?: "widest" | "current";
  className?: string;
}

export function Morph<K extends string>({
  activeKey,
  items,
  sizing = "widest",
  className,
}: MorphProps<K>) {
  // The CSS `prefers-reduced-motion` rule can't reach Motion — the cascade doesn't
  // touch JS animation. `duration: 0` rather than a very short spring: a spring with a
  // near-zero duration doesn't settle instantly, it settles *violently*. The content
  // still swaps; it just stops being animated, which is what the preference asks for.
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : spring.clean;
  const keys = Object.keys(items) as K[];
  const { box, widths } = useItemWidths(keys, sizing === "current" && keys.length > 1);

  // A single state has nothing to reserve against. Keeping a hidden copy in that case
  // duplicates readable text in the DOM (and makes assistive/query consumers see the same
  // label twice), while providing no layout stability or animation benefit.
  if (keys.length === 1) {
    return (
      <span data-slot="morph" className={cn("relative inline-grid place-items-center", className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={activeKey}
            className="inline-grid place-items-center whitespace-nowrap"
            variants={morphVariants}
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

  const current = sizing === "current";
  const width = widths[activeKey];

  return (
    // Every item lives in the same single grid cell, so the cell is as wide and as tall
    // as the largest of them and the box never changes size. `relative` also anchors
    // the exiting item, which popLayout pulls out of flow.
    //
    // `"current"` takes the sizers out of flow and sets the box to the measured width of
    // the showing item instead, so a CSS transition can move between two lengths.
    // `place-content-center` keeps items wider than the box — the incoming one while it
    // grows, the outgoing one while it shrinks — centred on it.
    <span
      ref={box}
      data-slot="morph"
      data-sizing={sizing}
      className={cn(
        "relative inline-grid place-items-center",
        current && "place-content-center transition-[width] duration-(--duration-base) ease-out",
        className,
      )}
      style={width == null ? undefined : { width }}
    >
      {/* The sizers. Hidden, inert, and unreadable — they exist only to hold the box
          open at the width of the longest item, or under `"current"`, to be measured.
          `invisible` (visibility: hidden) and not `hidden` (display: none), because only
          the former still has a size. */}
      {keys.map((key) => (
        <span
          key={key}
          data-morph-sizer={current ? key : undefined}
          aria-hidden="true"
          className={cn(
            "invisible pointer-events-none whitespace-nowrap",
            current ? "absolute top-0 left-0" : "[grid-area:1/1]",
          )}
        >
          <LoaderSizerContext.Provider value={true}>
            {items[key]}
          </LoaderSizerContext.Provider>
        </span>
      ))}

      {/* `initial={false}` — no animation on first paint. Without it everything on the
          page pops in on mount, which reads as a page that's still loading.

          `"current"` keeps the exiting item in the shared cell (`sync`) instead of letting
          popLayout pin it out of flow at the offset it left from. Pinned, it stays put
          while the box resizes around it and drifts off-centre from the incoming item;
          in the cell, both stay centred on the same moving box. */}
      <AnimatePresence mode={current ? "sync" : "popLayout"} initial={false}>
        <motion.span
          key={activeKey}
          className="inline-grid place-items-center [grid-area:1/1] whitespace-nowrap"
          variants={morphVariants}
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

/**
 * The untransformed width of each sizer, kept current by a ResizeObserver.
 *
 * `borderBoxSize` rather than `getBoundingClientRect`: the controls this sits in scale
 * while pressed, and a rect read mid-press would size the box 5% too small. Without a
 * ResizeObserver no width is set and the box sizes to the showing item without animating.
 */
function useItemWidths<K extends string>(keys: K[], enabled: boolean) {
  const box = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<Partial<Record<K, number>>>({});
  const signature = JSON.stringify(keys);

  useLayoutEffect(() => {
    const root = box.current;
    if (!enabled || !root || typeof ResizeObserver === "undefined") return;
    const sizers = root.querySelectorAll<HTMLElement>(":scope > [data-morph-sizer]");

    const observer = new ResizeObserver((entries) => {
      setWidths((previous) => {
        let next = previous;
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.morphSizer as K;
          const width =
            entry.borderBoxSize?.[0]?.inlineSize ?? (entry.target as HTMLElement).offsetWidth;
          if (previous[key] === width) continue;
          if (next === previous) next = { ...previous };
          next[key] = width;
        }
        return next;
      });
    });
    sizers.forEach((sizer) => observer.observe(sizer));
    return () => observer.disconnect();
  }, [enabled, signature]);

  return { box, widths: enabled ? widths : ({} as Partial<Record<K, number>>) };
}
