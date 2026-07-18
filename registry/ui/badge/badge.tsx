"use client";

import { AlertTriangle, Check, Circle, Info, LoaderCircle, X, type LucideIcon } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, spring } from "@/registry/lib/motion";
import { badgeVariants, type BadgeVariants } from "./badge.variants";

/**
 * A status badge that *rolls* when it changes.
 *
 * On a status or content change the outgoing glyph and label roll up and out of the top
 * while the new ones roll in from the bottom — a slot-machine flip — and the pill springs
 * to the new width. This is a real Motion case, not decoration: the roll needs the
 * outgoing content to keep animating *after* React would unmount it (only AnimatePresence
 * holds it), and the width change is a layout animation (FLIP). Everything animated is
 * compositor-only — `y` as a percentage, `scale`, `rotate`, `opacity`, `blur`.
 *
 * Under reduced motion the rolls are dropped for a plain swap. The loading glyph spins
 * with CSS `animate-spin`, deliberately exempt — a status that has to keep reading as
 * "working", like every other spinner.
 */

const ICONS: Record<NonNullable<BadgeVariants["status"]>, LucideIcon> = {
  neutral: Circle,
  info: Info,
  success: Check,
  warning: AlertTriangle,
  danger: X,
  loading: LoaderCircle,
};

const ICON_SIZE = { sm: "size-3", md: "size-3.5" } as const;

// The roll. `y` is a percentage of the element, so it clips cleanly inside the pill's
// `overflow-hidden` whatever the glyph's size. Springs carry the travel; the fade and
// blur are short tweens on our `ease.out` (no overshoot on opacity/filter — an overshoot
// there reads as a stall, since you can't be more than opaque or less than un-blurred).
const ICON_ROLL: Variants = {
  initial: { opacity: 0.7, y: "80%", scale: 0.92, rotate: -8, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: "0%",
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 210, damping: 24, mass: 0.85 },
      scale: { type: "spring", stiffness: 250, damping: 24, mass: 0.75 },
      rotate: { duration: duration.slow, ease: ease.out },
      opacity: { duration: duration.slow, ease: ease.out },
      filter: { duration: duration.slower, ease: ease.out },
    },
  },
  exit: {
    opacity: 0,
    y: "-80%",
    scale: 0.96,
    rotate: 8,
    filter: "blur(6px)",
    transition: { duration: duration.base, ease: ease.out },
  },
};

const TEXT_ROLL: Variants = {
  initial: { opacity: 0.7, y: "85%", filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: "0%",
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 210, damping: 24, mass: 0.85 },
      opacity: { duration: duration.slow, ease: ease.out },
      filter: { duration: duration.slower, ease: ease.out },
    },
  },
  exit: { opacity: 0, y: "-85%", filter: "blur(6px)", transition: { duration: duration.base, ease: ease.out } },
};

export interface BadgeProps
  extends Omit<HTMLMotionProps<"span">, "children">,
    BadgeVariants {
  children?: ReactNode;
  /** Overrides the status glyph. Pass `null` with `showIcon` to render text only. */
  icon?: ReactNode;
  showIcon?: boolean;
  /**
   * Show a small status-coloured circle on the left instead of the icon — the quiet,
   * dashboard-style indicator (available on every variant). Wins over `icon`/`showIcon`.
   */
  dot?: boolean;
  /** Forces a label roll when the text stays the same object but should re-animate. */
  contentKey?: string | number;
}

export function Badge({
  variant = "solid",
  status = "neutral",
  size = "md",
  children,
  icon,
  showIcon = true,
  dot = false,
  contentKey,
  className,
  ...rest
}: BadgeProps) {
  const reduce = useReducedMotion();
  const resolvedStatus = status ?? "neutral";
  const resolvedSize = size ?? "md";
  const Icon = ICONS[resolvedStatus];
  const labelKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number" ? children : resolvedStatus);

  return (
    <motion.span
      // Full `layout` (not `"size"`): the whole box is projected, which reconciles with the
      // `popLayout` exit so the pill resizes straight to the new width. `"size"` mis-measures
      // against the briefly-present outgoing label and resizes the wrong way first.
      layout={!reduce}
      transition={reduce ? { duration: 0 } : spring.snappy}
      className={cn(badgeVariants({ variant, status, size }), "transition-colors duration-(--duration-base)", className)}
      {...rest}
    >
      {dot ? (
        // A plain status dot — same shape whatever the status, so it doesn't roll; only
        // its colour crosses over (it rides the badge's `transition-colors`).
        <span
          aria-hidden
          className="relative z-10 size-1.5 shrink-0 rounded-full bg-current transition-[background-color] duration-(--duration-base)"
        />
      ) : (
        showIcon &&
        icon !== null && (
          <span className="relative z-10 inline-flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={resolvedStatus}
                aria-hidden
                variants={ICON_ROLL}
                initial={reduce ? false : "initial"}
                animate={reduce ? { opacity: 1 } : "animate"}
                exit={reduce ? undefined : "exit"}
                className="inline-flex"
              >
                {icon ??
                  (resolvedStatus === "loading" ? (
                    <LoaderCircle className={cn(ICON_SIZE[resolvedSize], "animate-spin")} />
                  ) : (
                    <Icon className={ICON_SIZE[resolvedSize]} />
                  ))}
              </motion.span>
            </AnimatePresence>
          </span>
        )
      )}

      {children != null && (
        <span className="relative z-10 inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={labelKey}
              variants={TEXT_ROLL}
              initial={reduce ? false : "initial"}
              animate={reduce ? { opacity: 1 } : "animate"}
              exit={reduce ? undefined : "exit"}
              className="inline-block"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </motion.span>
  );
}
