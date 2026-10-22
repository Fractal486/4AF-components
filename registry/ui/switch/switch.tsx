"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
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
 *  - its middle section grows between fixed rounded end caps: a little on hover, more
 *    while held. That stretch is the detail that makes it feel like an object rather
 *    than a checkbox, while keeping the thumb's ends round instead of turning the circle
 *    into an oval. It grows toward the track's center, so the outer edge stays put, and
 *    on release it lets go as the thumb slides, landing as a circle. It is all
 *    transform-driven, so it stays off the layout path.
 *
 * `tone` is the two versions: `adaptive` flips the thumb light/dark to stay in contrast
 * with the track; `fixed` holds it dark in both states.
 */
export interface SwitchProps
  extends Omit<ComponentProps<typeof BaseSwitch.Root>, "className" | "render">,
    SwitchVariants {
  className?: string;
}

/** How far the thumb stretches toward the track's center on hover, and while pressed. */
const HOVER_EXTENSION = 1.5;
const PRESSED_EXTENSION = 3.5;
/** How far the bridge tucks under each cap, so their antialiased edges never meet. */
const BRIDGE_OVERLAP = 0.5;
const BRIDGE_WIDTH = PRESSED_EXTENSION + BRIDGE_OVERLAP * 2;

export function Switch({
  className,
  tone,
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerEnter,
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
  // Hover is a mouse affordance; a touch has no hover to answer. After a release the hover
  // stretch stays off until the pointer leaves, so the thumb lands as a circle instead of
  // stretching again the moment its slide ends.
  const [hovered, setHovered] = useState(false);
  const [settled, setSettled] = useState(false);
  const extension = pressed ? PRESSED_EXTENSION : hovered && !settled ? HOVER_EXTENSION : 0;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolledChecked;
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : spring.snappy;

  // The bridge is derived from the caps rather than animated alongside them. The gap it
  // fills runs from the start cap's inner edge to the end cap's, and both edges move on
  // their own springs, often in opposite directions when a press releases into a toggle.
  // An independently animated strip only lines up with that gap at rest, which left
  // fractional slivers uncovered mid-spring. Reading the caps' live offsets keeps it
  // exactly over the gap on every frame, overshoot included.
  const startX = useMotionValue(0);
  const endX = useMotionValue(0);
  const bridgeScale = useTransform(
    () => (endX.get() - startX.get() + BRIDGE_OVERLAP * 2) / BRIDGE_WIDTH,
  );

  const release = () => setPressed(false);
  const leave = () => {
    setPressed(false);
    setHovered(false);
    setSettled(false);
  };

  return (
    <BaseSwitch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      className={cn(switchTrackVariants(), className)}
      {...props}
      onCheckedChange={(nextChecked, eventDetails) => {
        onCheckedChange?.(nextChecked, eventDetails);
        if (checked === undefined && !eventDetails.isCanceled) setUncontrolledChecked(nextChecked);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !disabled) setPressed(true);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (pressed) setSettled(true);
        release();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse" && !disabled) setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        leave();
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
              style={{ x: startX }}
              transition={transition}
              animate={
                reduceMotion
                  ? undefined
                  : { x: isChecked ? -extension : 0 }
              }
            />
            {/* Starts half a pixel inside the start cap and ends half a pixel inside the
                end cap, at any extension. At rest it's a 1px sliver over the seam, inside
                the circle. Flat cap edges make the tuck invisible. */}
            <motion.span
              aria-hidden="true"
              data-slot="switch-thumb-middle"
              className="absolute top-0 left-[calc(50%-0.5px)] h-full w-1 origin-left bg-inherit"
              style={{ x: startX, scaleX: bridgeScale }}
            />
            <motion.span
              aria-hidden="true"
              data-slot="switch-thumb-cap-end"
              className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-inherit"
              style={{ x: endX }}
              transition={transition}
              animate={
                reduceMotion
                  ? undefined
                  : { x: isChecked ? 0 : extension }
              }
            />
          </motion.span>
        }
      />
    </BaseSwitch.Root>
  );
}
