"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import {
  switchThumbVariants,
  switchTrackVariants,
  type SwitchVariants,
} from "./switch.variants";

/**
 * A switch.
 *
 * Behaviour is Base UI's: the role, the keyboard toggle, the hidden input for forms,
 * and controlled/uncontrolled via `checked` / `defaultChecked` / `onCheckedChange`.
 *
 * Two motions, both worth the Motion runtime:
 *  - the thumb *slides* rather than cutting, via a `layout` animation on the transform;
 *  - its middle section grows while held, between fixed rounded end caps. That
 *    press-stretch is the detail that makes it feel like an object rather than a
 *    checkbox, while keeping the thumb's ends round instead of turning the circle
 *    into an oval. It grows toward the track's center, so the outer edge stays put.
 *    It is all transform-driven, so the press stays off the layout path.
 *
 * `tone` is the two versions: `adaptive` flips the thumb light/dark to stay in contrast
 * with the track; `fixed` holds it dark in both states.
 */
export interface SwitchProps
  extends Omit<ComponentProps<typeof BaseSwitch.Root>, "className" | "render">,
    SwitchVariants {
  className?: string;
}

const PRESSED_EXTENSION = 3;

export function Switch({
  className,
  tone,
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  // Pointer-only affordance: the squish answers a press, so it's driven by pointer
  // state, not by `checked`. A keyboard toggle skips it, which is correct — there's no
  // thumb being held down.
  const [pressed, setPressed] = useState(false);
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolledChecked;
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : spring.snappy;

  const release = () => setPressed(false);

  return (
    <BaseSwitch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      className={cn(switchTrackVariants(), className)}
      {...props}
      onCheckedChange={(nextChecked, eventDetails) => {
        if (checked === undefined) setUncontrolledChecked(nextChecked);
        onCheckedChange?.(nextChecked, eventDetails);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !disabled) setPressed(true);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        release();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        release();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        release();
      }}
    >
      <BaseSwitch.Thumb
        className={cn(switchThumbVariants({ tone }))}
        render={
          <motion.span
            data-slot="switch-thumb"
            data-pressed={pressed || undefined}
            // `layout` turns the flex justify flip into a transform slide.
            layout
            transition={transition}
          >
            <motion.span
              aria-hidden="true"
              data-slot="switch-thumb-cap-start"
              className="absolute inset-y-0 left-0 w-1/2 rounded-l-full bg-inherit"
              transition={transition}
              animate={
                reduceMotion
                  ? undefined
                  : { x: pressed && isChecked ? -PRESSED_EXTENSION : 0 }
              }
            />
            <motion.span
              aria-hidden="true"
              data-slot="switch-thumb-middle"
              className="absolute top-0 left-1/2 h-full w-[3px] bg-inherit"
              transition={transition}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: pressed && isChecked ? -PRESSED_EXTENSION : 0,
                      scaleX: pressed ? 1 : 0,
                    }
              }
            />
            <motion.span
              aria-hidden="true"
              data-slot="switch-thumb-cap-end"
              className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-inherit"
              transition={transition}
              animate={
                reduceMotion
                  ? undefined
                  : { x: pressed && !isChecked ? PRESSED_EXTENSION : 0 }
              }
            />
          </motion.span>
        }
      />
    </BaseSwitch.Root>
  );
}
