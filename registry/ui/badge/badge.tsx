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
 * A status badge that fades directionally when it changes.
 *
 * On a status or content change the outgoing glyph and label lift up and fade out while
 * the new ones rise into place from just below, and the pill springs to the new width.
 * This is a real Motion case, not decoration: the fade needs the outgoing content to keep
 * animating *after* React would unmount it (only AnimatePresence holds it), and the width
 * change is a layout animation (FLIP). Everything animated is compositor-only — `y` as a
 * percentage and `opacity`.
 *
 * Under reduced motion the movement is dropped for a plain swap. The loading glyph spins
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

// A directional fade — the same swap the icon and label both use. The outgoing content
// lifts up and fades out while the new content rises into place from just below, so the
// change reads as *advancing* rather than reversing. `y` is a small percentage, so it
// scales with the glyph and any movement clips cleanly inside the pill's `overflow-hidden`.
// Only compositor properties animate — `y` and `opacity`.
const FADE: Variants = {
  initial: { opacity: 0, y: "40%" },
  animate: { opacity: 1, y: "0%" },
  exit: { opacity: 0, y: "-40%" },
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
  /**
   * Animate the pill resizing when its content changes (the `layout` projection).
   * Turn it **off** for a static badge inside a list that reorders — otherwise the badge
   * FLIP-animates its own *position* every time an ancestor row moves it, sliding within a
   * row that itself doesn't animate. A decorative label ("Beta") never morphs, so it loses
   * nothing. @default true
   */
  animateLayout?: boolean;
}

export function Badge({
  variant = "solid",
  status = "neutral",
  size = "sm",
  children,
  icon,
  showIcon = true,
  dot = false,
  contentKey,
  animateLayout = true,
  className,
  ...rest
}: BadgeProps) {
  const reduce = useReducedMotion();
  const resolvedStatus = status ?? "neutral";
  const resolvedSize = size ?? "sm";
  const Icon = ICONS[resolvedStatus];
  const labelKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number" ? children : resolvedStatus);

  return (
    <motion.span
      // Full `layout` (not `"size"`): the whole box is projected, which reconciles with the
      // `popLayout` exit so the pill resizes straight to the new width. `"size"` mis-measures
      // against the briefly-present outgoing label and resizes the wrong way first. Off when
      // `animateLayout` is false — a static badge in a reordering list shouldn't FLIP its
      // position as ancestors move it.
      layout={animateLayout && !reduce}
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
                variants={FADE}
                initial={reduce ? false : "initial"}
                animate={reduce ? { opacity: 1 } : "animate"}
                exit={reduce ? undefined : "exit"}
                transition={reduce ? { duration: 0 } : { duration: duration.fast, ease: ease.out }}
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
              variants={FADE}
              initial={reduce ? false : "initial"}
              animate={reduce ? { opacity: 1 } : "animate"}
              exit={reduce ? undefined : "exit"}
              transition={reduce ? { duration: 0 } : { duration: duration.fast, ease: ease.out }}
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
