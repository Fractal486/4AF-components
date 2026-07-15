"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A slider.
 *
 * Behaviour is Base UI's: a real `<input type="range">` carries the pointer drag,
 * keyboard map (arrows, Home/End, PageUp/Down large-step), step snapping, ARIA, form
 * integration and RTL. None of that is hand-rolled.
 *
 * The feel is Motion's. Base UI's thumb is kept but hidden — it's the focus and
 * behaviour target — and a spring-driven thumb and fill are drawn over it. A spring, not
 * a fixed transition, is the point: it's velocity-aware, so the thumb follows a fast drag
 * tightly and still glides smoothly between snapped steps, where a fixed-duration ease
 * would trail the pointer. The thumb also stretches taller while held, so it reads as
 * something grabbed.
 */

// Critically damped glide for the thumb/fill — no overshoot, follows closely.
const SPRING_GLIDE = { stiffness: 700, damping: 50, mass: 0.5 } as const;
// Grab stretch — quick, and no overshoot (bounce 0), so it settles cleanly rather than
// wobbling.
const SPRING_GRAB = { type: "spring", visualDuration: 0.2, bounce: 0 } as const;

export interface SliderProps
  extends Omit<
    ComponentProps<typeof BaseSlider.Root>,
    "className" | "render" | "value" | "defaultValue" | "onValueChange"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  className?: string;
  /** A dot at each step. Hidden automatically past 50 steps, where they'd be noise. */
  showTicks?: boolean;
  /** The current value, shown above the track on the right. */
  showValue?: boolean;
  /** Text shown above the track on the left, opposite the value. */
  label?: ReactNode;
  /**
   * The thumb shape. `bar` is the thin vertical handle; `circle` is the normal round
   * knob, on a fully-rounded track.
   */
  thumb?: "bar" | "circle";
}

export function Slider({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showTicks = true,
  showValue = true,
  label,
  thumb = "bar",
  disabled,
  className,
  ...props
}: SliderProps) {
  const isCircle = thumb === "circle";
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const percent = ((current - min) / (max - min)) * 100;

  // Spring-smoothed position drives both the thumb's `left` and the fill's `width`.
  const target = useMotionValue(percent);
  useEffect(() => {
    target.set(percent);
  }, [percent, target]);
  const smooth = useSpring(target, SPRING_GLIDE);
  const pos = reduceMotion ? target : smooth;
  const left = useMotionTemplate`${pos}%`;
  // Self-offset the thumb from 0% (flush left) to -100% (flush right) of its own width,
  // so the thin bar stays fully inside the track at both ends.
  const thumbX = useTransform(pos, (p) => `${-p}%`);

  const stepCount = Math.floor((max - min) / step);
  const ticks =
    showTicks && stepCount > 0 && stepCount <= 50
      ? Array.from({ length: stepCount + 1 }, (_, i) => (i / stepCount) * 100)
      : [];

  const handleValueChange = (next: number) => {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <BaseSlider.Root
      value={current}
      onValueChange={handleValueChange as never}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn("relative w-full", className)}
      {...props}
    >
      {(showValue || label != null) && (
        <div
          className={cn(
            "mb-2 flex items-baseline gap-2 text-xs",
            label != null ? "justify-between" : "justify-end",
            disabled && "opacity-50",
          )}
        >
          {label != null && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            // `tabular` so the number doesn't reflow the row as its digits change. No
            // `font-mono` — it inherits Geist Sans from the body.
            <BaseSlider.Value className="tabular text-foreground" />
          )}
        </div>
      )}

      <BaseSlider.Control
        onPointerDown={() => !disabled && setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        className={cn(
          "group relative flex w-full touch-none items-center select-none",
          // The circle variant is half as thick; its round thumb is sized to the rail
          // height, so it matches the rail's rounded end-caps.
          isCircle ? "h-5" : "h-10",
          disabled
            ? "cursor-not-allowed opacity-50"
            : isCircle
              ? "cursor-e-resize"
              : "cursor-grab active:cursor-grabbing",
        )}
      >
        {/* The rail — clipped to its own shape so the fill rounds with it. The thumb
            sits *outside* this clip, so a circle that fills the rail can grow past its
            edges when grabbed rather than being flattened against them. */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden bg-muted",
            isCircle ? "rounded-full" : "rounded-lg",
          )}
        >
          {/* Fill — left edge to the thumb. */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-foreground/15"
            style={{ width: left }}
          />

          {/* Ticks, inset so the end dots don't sit under the thumb's travel. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-2 inset-y-0">
            {ticks.map((tp, i) => (
              <span
                key={i}
                className="absolute top-1/2 size-1 -translate-1/2 rounded-full bg-foreground/25"
                style={{ left: `${tp}%` }}
              />
            ))}
          </div>
        </div>

        {/* Base UI's thumb: the input lives here for focus, keyboard and ARIA. Hidden,
            because the visual thumb below is what's seen. */}
        <BaseSlider.Thumb className="opacity-0" />

        {/* The visual thumb — spring-positioned, grab-stretched. The focus ring lights up
            when the hidden input is focus-visible (`group-has`), so keyboard focus shows
            on the thing you can actually see. */}
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 bg-foreground shadow-sm",
            // A thin vertical handle, or a round knob the height of the rail.
            isCircle ? "size-5 rounded-full" : "h-5 w-1.5 rounded-sm",
            "group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ring/40",
          )}
          style={{ left, x: thumbX, y: "-50%" }}
          // The bar grabs by stretching taller; a circle can't stretch one axis without
          // going oval, so it grabs by growing evenly.
          animate={
            reduceMotion
              ? undefined
              : isCircle
                ? { scale: dragging ? 1.12 : 1 }
                : { scaleY: dragging ? 1.35 : 1 }
          }
          transition={SPRING_GRAB}
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
