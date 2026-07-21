"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cva } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { buttonVariants, type ButtonVariants } from "@/registry/ui/button/button.variants";

/**
 * Pressed does not change the background. Two reasons, and the second is the one that
 * bites:
 *
 * The button's own hover *is* a background change. If pressed also sets a background,
 * a pressed toggle permanently wears its hover colour — it looks stuck hovered, and
 * hovering it does nothing, because there's nowhere left to go. Hover has to be a step
 * from wherever you are, so pressed has to leave the background alone for hover to use.
 *
 * And a solid variant has no room for it anyway: press a `primary` toggle with a
 * pressed background and it drops from ink to grey, which reads as broken rather than
 * as selected.
 *
 * So the state lives in the icon fill, the label, and `aria-pressed` — and, on the
 * quiet variants, in the text going from muted to full strength.
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
 * A button that holds a state.
 *
 * That sentence is the whole reason this isn't a prop on Button. A button *does*
 * something; a toggle *is* something — bookmarked, muted, bold — and the difference is
 * `aria-pressed`, which is what tells a screen reader the control has an on/off state
 * at all. Base UI owns that, along with the uncontrolled `defaultPressed` case.
 *
 * It borrows Button's styles wholesale, so every variant and size comes along for free
 * and a Toggle sat beside a Button is visually indistinguishable — which it should be.
 */
export interface ToggleProps
  extends Omit<ComponentProps<typeof BaseToggle>, "className" | "render">,
    ButtonVariants {
  className?: string;
  /**
   * Fill the icon when pressed, instead of swapping it.
   *
   * The right choice when a glyph has a filled counterpart — a bookmark, a star, a
   * heart. There's nothing to morph *to*: it's the same shape, and only its weight
   * changes. Reach for `Morph` when the shape actually changes (play → pause).
   */
  fillIcon?: boolean;
  /** Disable the tactile press scale. Defaults to `true`; useful for anchored triggers. */
  pressScale?: boolean;
}

export function Toggle({
  className,
  variant = "ghost",
  size = "icon",
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
        buttonVariants({ variant, size }),
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
      {...props}
    />
  );
}
