"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import { useDirection } from "@base-ui/react/direction-provider";
import { createContext, useContext, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { NumberAnimation } from "@/registry/ui/number-animation/number-animation";
import { cn } from "@/registry/lib/cn";
import {
  progressCircleIndicatorVariants,
  progressCircleSvgVariants,
  progressCircleTrackVariants,
  progressCircleVariants,
  progressColorVariants,
  progressIndicatorVariants,
  progressSegmentVariants,
  progressTrackVariants,
  type ProgressCircleSize,
  type ProgressSize,
} from "./progress.variants";

export type { ProgressCircleSize, ProgressSize } from "./progress.variants";

const ProgressNumberContext = createContext({
  min: 0,
  max: 100,
  locale: undefined as Intl.LocalesArgument | undefined,
  format: undefined as Intl.NumberFormatOptions | undefined,
});
const percentFormat: Intl.NumberFormatOptions = { style: "percent" };

function normalizeRange(min: number, max: number) {
  const start = Number.isFinite(min) ? min : 0;
  const end = Number.isFinite(max) && max > start ? max : start + 1;
  return Number.isFinite(end - start) && end > start ? { min: start, max: end } : { min: 0, max: 100 };
}

function normalizeValue(value: number | null | undefined, min: number, max: number) {
  return value == null ? null : Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
}

interface ProgressSharedProps extends Omit<ComponentProps<typeof BaseProgress.Root>, "className" | "value" | "color"> {
  className?: string;
  /** Omit or pass null while the total is unknown. */
  value?: number | null;
  /** Custom CSS color for the fill. Accepts CSS variables; defaults to primary ink. */
  color?: CSSProperties["color"];
  /** Extra classes for the rail or circular track. */
  trackClassName?: string;
  /** Extra classes for the fill or circular indicator. */
  indicatorClassName?: string;
  children?: ReactNode;
}

export interface ProgressSegment {
  /** Amount of the range filled by this part, not an absolute endpoint. */
  value: number;
  /** Accessible description appended to the overall value. */
  label?: string;
  color?: CSSProperties["color"];
}

export interface ProgressProps extends ProgressSharedProps {
  size?: ProgressSize;
  /** Stacked amounts. Their sum plus min replaces value, clamped in array order. */
  segments?: readonly ProgressSegment[];
}

/** Base UI owns the accessible value. The bar moves by transform; segments reveal by clip-path. */
export function Progress({
  value,
  min = 0,
  max = 100,
  color,
  size = "md",
  segments,
  locale,
  getAriaValueText,
  className,
  trackClassName,
  indicatorClassName,
  children,
  ...props
}: ProgressProps) {
  const direction = useDirection();
  const range = normalizeRange(min, max);
  const capacity = range.max - range.min;
  let filled = 0;
  const parts = segments?.map((segment) => {
    const amount = Math.min(Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0, capacity - filled);
    const start = filled / capacity * 100;
    filled += amount;
    return { ...segment, amount, start, end: filled / capacity * 100 };
  });
  const normalizedValue = parts ? Math.min(range.max, range.min + filled) : normalizeValue(value, range.min, range.max);
  const pct = normalizedValue == null ? null : (normalizedValue - range.min) / capacity * 100;
  const translate = (100 - (pct ?? 0)) * (direction === "rtl" ? 1 : -1);
  const numberFormat = parts?.some((part) => part.label) ? new Intl.NumberFormat(locale) : undefined;
  const breakdown = parts?.filter((part) => part.amount > 0 && part.label)
    .map((part) => `${numberFormat!.format(part.amount)} ${part.label}`).join(", ");

  return (
    <BaseProgress.Root
      value={normalizedValue}
      min={range.min}
      max={range.max}
      locale={locale}
      getAriaValueText={getAriaValueText ?? (breakdown ? (formatted) => `${formatted} (${breakdown})` : undefined)}
      data-slot="progress"
      data-size={size}
      data-segmented={parts ? "" : undefined}
      className={cn("w-full", className)}
      {...props}
    >
      <ProgressNumberContext value={{ ...range, locale, format: props.format }}>{children}</ProgressNumberContext>
      <BaseProgress.Track data-slot="progress-track" className={cn(progressTrackVariants({ size }), trackClassName)}>
        {parts ? parts.map((part, index) => (
          <span
            key={index}
            aria-hidden="true"
            data-slot="progress-segment"
            className={cn(progressSegmentVariants(), progressColorVariants(), indicatorClassName)}
            style={{
              color: part.color ?? color,
              clipPath: direction === "rtl"
                ? `inset(0 ${part.start}% 0 ${100 - part.end}%)`
                : `inset(0 ${100 - part.end}% 0 ${part.start}%)`,
            }}
          />
        )) : (
          <BaseProgress.Indicator
            data-slot="progress-indicator"
            className={cn(progressIndicatorVariants(), progressColorVariants(), indicatorClassName)}
            // Our width overrides Base UI's percentage width. Only transform animates.
            style={{
              color,
              "--progress-direction": direction === "rtl" ? -1 : 1,
              ...(pct == null ? {} : { width: "100%", transform: `translateX(${translate}%)` }),
            } as CSSProperties}
          />
        )}
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export interface ProgressCircleProps extends ProgressSharedProps {
  size?: ProgressCircleSize;
}

/** A ring starting at twelve o'clock; children share the root context and sit in its center. */
export function ProgressCircle({
  value,
  min = 0,
  max = 100,
  color,
  size = "md",
  className,
  trackClassName,
  indicatorClassName,
  children,
  ...props
}: ProgressCircleProps) {
  const range = normalizeRange(min, max);
  const normalizedValue = normalizeValue(value, range.min, range.max);
  const pct = normalizedValue == null ? null : (normalizedValue - range.min) / (range.max - range.min) * 100;

  return (
    <BaseProgress.Root
      value={normalizedValue}
      min={range.min}
      max={range.max}
      data-slot="progress-circle"
      data-size={size}
      className={cn(progressCircleVariants({ size }), className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        data-slot="progress-circle-svg"
        data-indeterminate={pct == null ? "" : undefined}
        className={progressCircleSvgVariants()}
      >
        <circle cx="12" cy="12" r="10" data-slot="progress-circle-track"
          className={cn(progressCircleTrackVariants(), trackClassName)} />
        <circle
          cx="12" cy="12" r="10" pathLength={100}
          transform="rotate(-90 12 12)"
          strokeDasharray={pct == null ? "25 75" : "100 100"}
          strokeDashoffset={pct == null ? 0 : 100 - pct}
          data-slot="progress-circle-indicator"
          data-empty={pct === 0 ? "" : undefined}
          className={cn(progressCircleIndicatorVariants(), progressColorVariants(), indicatorClassName)}
          style={{ color }}
        />
      </svg>
      <ProgressNumberContext value={{ ...range, locale: props.locale, format: props.format }}>{children}</ProgressNumberContext>
    </BaseProgress.Root>
  );
}

export const ProgressLabel = BaseProgress.Label;
export type ProgressValueProps = ComponentProps<typeof BaseProgress.Value> & {
  /** Opt in to rolling digits in the default value readout. Defaults to false. */
  animated?: boolean;
};

/** Base UI keeps the accessible value; rolling digits are opt-in. */
export function ProgressValue({ children, animated = false, ...props }: ProgressValueProps) {
  const { min, max, locale, format } = useContext(ProgressNumberContext);
  if (!animated) return <BaseProgress.Value {...props}>{children}</BaseProgress.Value>;
  return (
    <BaseProgress.Value {...props}>
      {children ?? ((_, value) => value == null ? null : (
        <NumberAnimation
          value={format ? value : (value - min) / (max - min)}
          locales={locale}
          format={format ?? percentFormat}
        />
      ))}
    </BaseProgress.Value>
  );
}
