"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cva } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { buttonVariants, type ButtonVariants } from "@/registry/ui/ui/button.variants";

/**
 * Pressed state leaves the background available for hover feedback and preserves solid
 * variant fills. State is shown through icon fill, labels, and `aria-pressed`; quiet
 * variants also strengthen the text color.
 */
const pressedVariants = cva("", {
  variants: {
    variant: {
      ghost: "data-[pressed]:text-foreground",
      plain: "data-[pressed]:text-foreground",
      outline: "",
      primary: "",
      destructive: "",
      link: "",
    },
  },
  defaultVariants: { variant: "ghost" },
});

/**
 * A Base UI toggle with controlled `pressed` / `onPressedChange` or uncontrolled
 * `defaultPressed` state. Base UI owns `aria-pressed`; variants and sizes use Button styles.
 */
export interface ToggleProps
  extends Omit<ComponentProps<typeof BaseToggle>, "className" | "render">,
    ButtonVariants {
  className?: string;
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
  pressScale = true,
  ...props
}: ToggleProps) {
  const reduceMotion = useReducedMotion();

  return (
    <BaseToggle
      // Base UI owns the button element, so the press spring has to be handed to it
      // through `render` — otherwise a Toggle would sit next to a Button looking
      // identical and feeling dead, which is worse than looking different.
      render={(toggleProps) => (
        <motion.button
          // Cast because `onDrag` and friends mean different things to React (a DOM
          // event) and to Motion (a gesture callback). It's a type-level collision
          // only — Base UI never passes them.
          {...(toggleProps as HTMLMotionProps<"button">)}
          whileTap={reduceMotion || props.disabled || !pressScale ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      )}
      className={cn(
        buttonVariants({ variant, size, shape }),
        // Base UI sets `data-pressed`. Styling off it keeps the look and the ARIA from
        // ever drifting apart — they're driven by the same attribute.
        pressedVariants({ variant }),
        fillIcon && [
          // `fill` is a paint property, not a compositor one — but it's a colour change
          // on a 16px glyph, so it's cheap, and there's no transform that fakes it.
          "[&_svg]:transition-[fill] [&_svg]:duration-(--duration-fast) [&_svg]:ease-out",
          "data-[pressed]:[&_svg]:fill-current",
        ],
        className,
      )}
      data-shape={shape}
      {...props}
    />
  );
}
