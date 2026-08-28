"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { motion, useReducedMotion, type SVGMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { ease, PRESS_SCALE, spring } from "@/registry/lib/motion";
import { checkboxVariants } from "./checkbox.variants";

/**
 * A checkbox.
 *
 * Behaviour is Base UI's: the role, the keyboard toggle, the hidden input for forms,
 * indeterminate state, and controlled/uncontrolled via `checked` / `defaultChecked` /
 * `onCheckedChange`.
 *
 * The check *draws itself* — the tick's path animates from zero length, so it's struck
 * rather than swapped in. That stroke is the whole character of the component and it's
 * genuinely Motion's: there's no CSS way to animate an SVG `pathLength`.
 *
 * The box gives a small press-scale on tap and — deliberately — does *nothing* on
 * hover. A control that grows under the cursor is a second signal for "you're on it"
 * that the cursor already gives, and it never fires on touch, so the box would feel
 * different depending on what you're pointing with.
 */
export interface CheckboxProps
  extends Omit<ComponentProps<typeof BaseCheckbox.Root>, "className" | "render" | "nativeButton"> {
  className?: string;
  /**
   * Text beside the box. When set, the box and the text sit inside one `<label>`, so
   * clicking anywhere on the row toggles the checkbox — the label binds to Base UI's
   * hidden input (its only labelable descendant), which is also what names the control
   * for a screen reader, so no separate `aria-label` is needed.
   */
  label?: ReactNode;
  /** Class for the wrapping `<label>` when `label` is set. */
  labelClassName?: string;
}

export function Checkbox({
  className,
  disabled,
  label,
  labelClassName,
  ...props
}: CheckboxProps) {
  const reduceMotion = useReducedMotion();

  // The tick draws in after the box has started filling, and rubs out faster than it
  // draws. Under reduced motion it's simply present or absent — a zero-length stroke.
  const drawIn = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: ease.out, delay: 0.08 };
  const drawOut = reduceMotion ? { duration: 0 } : { duration: 0.15, ease: ease.in };

  const box = (
    <BaseCheckbox.Root
      disabled={disabled}
      // The render below is a native <button>, so tell Base UI as much — otherwise it
      // warns and would add synthetic button attributes on top of the native ones.
      nativeButton
      className={cn(checkboxVariants(), className)}
      // Element form, not a function: Base UI clones this and injects its own props,
      // so there's no explicit spread to collide with Motion's gesture props.
      render={
        <motion.button
          whileTap={reduceMotion || disabled ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      }
      {...props}
    >
      <BaseCheckbox.Indicator
        // keepMounted so the tick is in the DOM to draw *out* on uncheck, not yanked.
        keepMounted
        className="grid size-[70%] place-items-center text-current"
        render={(indicatorProps, state) => (
          <motion.svg
            // Cast: Base UI types these as DOM span props, and `onAnimationStart` and
            // friends mean different things to React and to Motion. Type-level only —
            // Base UI passes data attributes and a ref, not animation callbacks.
            {...(indicatorProps as unknown as SVGMotionProps<SVGSVGElement>)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            aria-hidden="true"
          >
            {state.indeterminate ? (
              <motion.line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={drawIn}
              />
            ) : (
              <motion.path
                d="M4.5 12.75l6 6 9-13.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={
                  state.checked
                    ? { pathLength: 1, opacity: 1, transition: drawIn }
                    : { pathLength: 0, opacity: 0, transition: drawOut }
                }
              />
            )}
          </motion.svg>
        )}
      />
    </BaseCheckbox.Root>
  );

  if (label == null) return box;

  return (
    <label
      className={cn(
        "inline-flex w-fit items-center gap-2 select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        labelClassName,
      )}
    >
      {box}
      <span className={cn("text-sm", disabled ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
    </label>
  );
}
