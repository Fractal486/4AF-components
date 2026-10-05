"use client";

import { AlertTriangle, Check, Circle, Info, X } from "lucide-react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import { Morph } from "@/registry/ui/morph/morph";
import { LoadingIndicator } from "@/registry/lib/loader";
import { badgeVariants, type BadgeVariants } from "./badge.variants";

/**
 * A status badge whose glyph and label morph when they change.
 *
 * On a status or content change the library Morph swaps the outgoing glyph and label for
 * the new ones, while the badge springs to its new width. This is a real Motion case, not
 * decoration: the outgoing content has to keep animating after React would unmount it,
 * and the width change is a layout animation (FLIP). Everything animated is compositor-only.
 *
 * Under reduced motion the movement is dropped for a plain swap. The shared loading
 * indicator retains its own loop timing, like every other spinner.
 */

const ICON_SIZE = { sm: "size-2.5", md: "size-3", lg: "size-3.5" } as const;

export interface BadgeProps
  extends Omit<HTMLMotionProps<"span">, "children">,
    BadgeVariants {
  children?: ReactNode;
  /** Overrides the status glyph. Pass `null` with `showIcon` to render text only. */
  icon?: ReactNode;
  showIcon?: boolean;
  loader?: ReactNode;
  /**
   * Show a small status-coloured circle on the left instead of the icon — the quiet,
   * dashboard-style indicator (available on every variant). Wins over `icon`/`showIcon`.
   */
  dot?: boolean;
  /** Forces a label roll when the text stays the same object but should re-animate. */
  contentKey?: string | number;
  /**
   * Animate the badge resizing when its content changes (the `layout` projection).
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
  shape = "rounded",
  children,
  icon,
  showIcon = true,
  loader,
  dot = false,
  contentKey,
  animateLayout = true,
  className,
  ...rest
}: BadgeProps) {
  const reduce = useReducedMotion();
  const resolvedStatus = status ?? "neutral";
  const resolvedSize = size ?? "sm";
  const labelKey = String(
    contentKey ??
      (typeof children === "string" || typeof children === "number" ? children : resolvedStatus),
  );
  // The badge owns its glyph's geometry, which has to include the caller's. An icon passed
  // in is an `<Icon />` written inline, and a lucide icon with nothing said about its size
  // draws at 24px — several times the badge's own — so it arrived towering over the text.
  // The size goes on first and `cn` lets a caller who really means a different one say so.
  const sized = (glyph: ReactNode): ReactNode =>
    isValidElement<{ className?: string }>(glyph)
      ? cloneElement(glyph as ReactElement<{ className?: string }>, {
          className: cn(ICON_SIZE[resolvedSize], glyph.props.className),
        })
      : glyph;

  const custom = icon == null ? null : sized(icon);
  const iconItems: Record<NonNullable<BadgeVariants["status"]>, ReactNode> = {
    neutral: custom ?? <Circle className={ICON_SIZE[resolvedSize]} />,
    info: custom ?? <Info className={ICON_SIZE[resolvedSize]} />,
    success: custom ?? <Check className={ICON_SIZE[resolvedSize]} />,
    warning: custom ?? <AlertTriangle className={ICON_SIZE[resolvedSize]} />,
    danger: custom ?? <X className={ICON_SIZE[resolvedSize]} />,
    loading: custom ?? <LoadingIndicator loader={loader} className={ICON_SIZE[resolvedSize]} />,
  };

  return (
    <motion.span
      // Full `layout` (not `"size"`): the whole box is projected, which reconciles with the
      // `popLayout` exit so the badge resizes straight to the new width. `"size"` mis-measures
      // against the briefly-present outgoing label and resizes the wrong way first. Off when
      // `animateLayout` is false — a static badge in a reordering list shouldn't FLIP its
      // position as ancestors move it.
      layout={animateLayout && !reduce}
      transition={reduce ? { duration: 0 } : spring.snappy}
      className={cn(
        badgeVariants({ variant, status, size, shape }),
        "transition-colors duration-(--duration-base)",
        className,
      )}
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
          <span aria-hidden className="relative z-10 inline-flex items-center justify-center overflow-hidden">
            <Morph activeKey={resolvedStatus} items={iconItems} />
          </span>
        )
      )}

      {children != null && (
        <span className="relative z-10 inline-flex overflow-hidden">
          <Morph activeKey={labelKey} items={{ [labelKey]: children }} />
        </span>
      )}
    </motion.span>
  );
}
