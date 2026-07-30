"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import { useDirection } from "@base-ui/react/direction-provider";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A determinate progress bar.
 *
 * Behaviour is Base UI's Progress: the Root carries `role="progressbar"` with
 * `aria-valuenow` / `min` / `max` and a formatted `aria-valuetext`, and every part gets
 * `data-progressing` / `data-complete` so styling hooks off state rather than a computed
 * className.
 *
 * The fill moves on `transform`, not `width`. Base UI's Indicator sizes itself with a
 * percentage `width`, but animating width relayouts the bar every frame — so the fill is
 * laid out full-width and revealed with a `translateX`, which the compositor handles on
 * its own layer. The travel reads from `--duration-slow`, so a media query collapses it
 * under reduced motion with no JS.
 */

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export interface ProgressProps
  extends Omit<ComponentProps<typeof BaseProgress.Root>, "className"> {
  className?: string;
  /** Extra classes for the track (the rail behind the fill). */
  trackClassName?: string;
  /** Extra classes for the indicator (the fill). */
  indicatorClassName?: string;
}

export function Progress({
  value,
  min = 0,
  max = 100,
  className,
  trackClassName,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const direction = useDirection();
  const normalizedMin = Number.isFinite(min) ? min : 0;
  const normalizedMax =
    Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1;
  const normalizedValue =
    value == null
      ? null
      : clamp(Number.isFinite(value) ? value : normalizedMin, normalizedMin, normalizedMax);
  const pct =
    normalizedValue == null
      ? null
      : ((normalizedValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100;
  const hiddenPercent = 100 - (pct ?? 0);
  const translate = direction === "rtl" ? hiddenPercent : -hiddenPercent;

  return (
    <BaseProgress.Root
      value={normalizedValue}
      min={normalizedMin}
      max={normalizedMax}
      className={cn("w-full", className)}
      {...props}
    >
      <BaseProgress.Track
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          trackClassName,
        )}
      >
        <BaseProgress.Indicator
          className={cn(
            "h-full rounded-full bg-primary transition-transform duration-(--duration-slow) ease-out",
            indicatorClassName,
          )}
          // Full-width and slid into view, so only `transform` animates. Our `style` is
          // spread after Base UI's, so this `width` overrides the percentage width it
          // would otherwise set.
          style={
            pct == null
              ? undefined
              : { width: "100%", transform: `translateX(${translate}%)` }
          }
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export const ProgressLabel = BaseProgress.Label;
export const ProgressValue = BaseProgress.Value;
