"use client";
import { Collapsible } from "@base-ui/react/collapsible";
import { createContext, useContext, useId, type ComponentProps } from "react";
import { X } from "lucide-react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { NumberAnimation, type NumberAnimationProps } from "@/registry/ui/number-animation/number-animation";
import { badgeCloseVariants, badgeDotVariants } from "./badge.variants";

export const BadgeContext = createContext<{ labelId: string } | null>(null);
export type BadgeDotProps = ComponentProps<'span'> & { pulse?: boolean };
export function BadgeDot({ pulse = false, className, ...props }: BadgeDotProps) {
  return <span aria-hidden="true" {...props} data-slot="badge-dot" data-pulse={pulse ? '' : undefined}
    className={cn(badgeDotVariants(), className)} />;
}
export type BadgeCloseProps = ComponentProps<typeof Collapsible.Trigger>;
export function BadgeClose({ id: providedId, className, children, onClick, onKeyDown, ...props }: BadgeCloseProps) {
  const context = useContext(BadgeContext);
  const generatedId = useId();
  const id = providedId ?? generatedId;
  if (!context) throw new Error('BadgeClose must be used inside Badge.');
  return <Collapsible.Trigger id={id} aria-labelledby={props['aria-label'] ? undefined : `${id} ${context.labelId}`}
    aria-expanded={undefined} aria-controls={undefined}
    {...props} data-slot="badge-close" className={mergeStateClassName(badgeCloseVariants(), className)}
    onClick={event => { onClick?.(event); event.stopPropagation(); if (event.defaultPrevented) event.preventBaseUIHandler(); }}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && (event.key === 'Backspace' || event.key === 'Delete')) {
        event.preventDefault(); event.stopPropagation(); event.currentTarget.click();
      }
    }}>
    {children ?? <X aria-hidden="true" />}
    {!props['aria-label'] && <span className="sr-only">Remove</span>}
  </Collapsible.Trigger>;
}
export type BadgeCountProps = Omit<NumberAnimationProps, 'value' | 'prefix' | 'suffix' | 'render'> & { value: number; max?: number; animated?: boolean };
export function BadgeCount({ value, max = 99, animated = false, locales = 'en-US', format, className, ref, duration, easing, trend, onAnimationsStart, onAnimationsFinish, ...props }: BadgeCountProps) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const cap = max === Infinity ? Infinity : Number.isFinite(max) && max >= 1 ? Math.floor(max) : 99;
  return <span ref={ref} data-slot="badge-count" dir="ltr" className={cn('inline-flex shrink-0', className)}>
    {animated ? <NumberAnimation {...props} aria-hidden="true" value={Math.min(safe, cap)} suffix={safe > cap ? '+' : undefined}
      locales={locales} format={format ?? { useGrouping: false }} duration={duration} easing={easing} trend={trend}
      onAnimationsStart={onAnimationsStart} onAnimationsFinish={onAnimationsFinish} />
      : <span {...props} aria-hidden="true" data-slot="badge-count-value">{new Intl.NumberFormat(locales, format ?? { useGrouping: false }).format(Math.min(safe, cap))}{safe > cap ? '+' : ''}</span>}
    <span className="sr-only">{new Intl.NumberFormat(locales, format).format(safe)}</span>
  </span>;
}
