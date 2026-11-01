"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { buttonVariants, type ButtonVariants } from "@/registry/ui/ui/button.variants";
import { pressedVariants } from "./toggle.variants";

/**
 * A Base UI toggle with controlled `pressed` / `onPressedChange` or uncontrolled
 * `defaultPressed` state. Base UI owns `aria-pressed`; variants and sizes use Button styles.
 */
export interface ToggleProps
  extends ComponentProps<typeof BaseToggle>,
    ButtonVariants {
  /** Change the background while pressed, independently of fillIcon. @default false */
  fillBackground?: boolean;
  /**
   * Fill the icon when pressed. Opt in with `fillIcon`; defaults to false.
   *
   * The right choice when a glyph has a filled counterpart — a bookmark, a star, a
   * heart. There's nothing to morph *to*: it's the same shape, and only its weight
   * changes. Reach for `Morph` when the shape actually changes (play → pause).
   */
  fillIcon?: boolean;
  /** Animate a scale change while pressed. Set false for anchored triggers. @default true */
  pressScale?: boolean;
}

export function Toggle({
  className,
  variant = "ghost",
  size = "icon",
  shape = "rectangular",
  fillIcon = false,
  fillBackground = false,
  pressScale = true,
  render,
  ...props
}: ToggleProps) {
  const reduceMotion = useReducedMotion();
  const baseClassName = cn(
    buttonVariants({ variant, size, shape }),
    pressedVariants({ variant }),
    fillIcon && [
      "[&_svg]:transition-[fill] [&_svg]:duration-(--duration-fast) [&_svg]:ease-out",
      "data-[pressed]:[&_svg]:fill-current",
    ],
  );

  return (
    <BaseToggle
      // Base UI owns the button element, so the press spring has to be handed to it
      // through `render` — otherwise a Toggle would sit next to a Button looking
      // identical and feeling dead, which is worse than looking different.
      render={render ?? ((toggleProps) => (
        <motion.button
          // Cast because `onDrag` and friends mean different things to React (a DOM
          // event) and to Motion (a gesture callback). It's a type-level collision
          // only — Base UI never passes them.
          {...(toggleProps as HTMLMotionProps<"button">)}
          whileTap={reduceMotion || props.disabled || !pressScale ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      ))}
      className={typeof className === "function"
        ? (state) => cn(baseClassName, className(state))
        : cn(baseClassName, className)}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-fill-background={fillBackground || undefined}
      {...props}
    />
  );
}
