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
 *  - it *squishes wider* while held, the way a physical toggle gives under a thumb.
 *    That press-stretch is the detail that makes it feel like an object rather than a
 *    checkbox, and there's no CSS-only way to anchor a width change to the pressed edge.
 *
 * `tone` is the two versions: `adaptive` flips the thumb light/dark to stay in contrast
 * with the track; `fixed` holds it dark in both states.
 */
export interface SwitchProps
  extends Omit<ComponentProps<typeof BaseSwitch.Root>, "className" | "render">,
    SwitchVariants {
  className?: string;
}

const PRESSED_WIDTH = 19;
const RESTING_WIDTH = 16;

export function Switch({ className, tone, disabled, ...props }: SwitchProps) {
  // Pointer-only affordance: the squish answers a press, so it's driven by pointer
  // state, not by `checked`. A keyboard toggle skips it, which is correct — there's no
  // thumb being held down.
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : spring.snappy;

  const release = () => setPressed(false);

  return (
    <BaseSwitch.Root
      disabled={disabled}
      className={cn(switchTrackVariants(), className)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      {...props}
    >
      <BaseSwitch.Thumb
        className={cn(switchThumbVariants({ tone }))}
        render={
          <motion.span
            // `layout` turns the flex justify flip into a transform slide (GPU), while
            // `animate` handles the press-stretch. Base UI still owns the state; Motion
            // only owns how the thumb gets from one place to the other.
            layout
            transition={transition}
            animate={
              reduceMotion ? undefined : { width: pressed ? PRESSED_WIDTH : RESTING_WIDTH }
            }
          />
        }
      />
    </BaseSwitch.Root>
  );
}
