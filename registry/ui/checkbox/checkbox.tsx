"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { motion, useReducedMotion, type HTMLMotionProps, type SVGMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, PRESS_SCALE, spring } from "@/registry/lib/motion";
import { checkboxGroupVariants, checkboxVariants } from "./checkbox.variants";

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
  extends ComponentProps<typeof BaseCheckbox.Root> {
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

export interface CheckboxMarkProps extends Omit<SVGMotionProps<SVGSVGElement>, "children"> {
  checked: boolean;
  indeterminate?: boolean;
}

/**
 * The checkbox's mark: the tick that draws itself in and rubs out, or the indeterminate
 * dash. Exported so a row that shows a checkbox without being one — a menu's checkbox
 * item — strikes the same tick, with the same timing, as the real control.
 */
export function CheckboxMark({ checked, indeterminate = false, ...props }: CheckboxMarkProps) {
  const reduceMotion = useReducedMotion();

  // The tick draws in after the box has started filling, and rubs out faster than it
  // draws. Under reduced motion it's simply present or absent — a zero-length stroke.
  const drawIn = reduceMotion
    ? { duration: 0 }
    : { duration: duration.base, ease: ease.out, delay: 0.08 };
  const drawOut = reduceMotion ? { duration: 0 } : { duration: duration.fast, ease: ease.in };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      aria-hidden="true"
      {...props}
    >
      {indeterminate ? (
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
            checked
              ? { pathLength: 1, opacity: 1, transition: drawIn }
              : { pathLength: 0, opacity: 0, transition: drawOut }
          }
        />
      )}
    </motion.svg>
  );
}

export function Checkbox({
  className,
  disabled,
  label,
  labelClassName,
  render,
  nativeButton = render == null,
  children,
  ...props
}: CheckboxProps) {
  const reduceMotion = useReducedMotion();

  const box = (
    <BaseCheckbox.Root
      disabled={disabled}
      nativeButton={nativeButton}
      className={typeof className === "function"
        ? (state) => cn(checkboxVariants(), className(state))
        : cn(checkboxVariants(), className)}
      render={render ?? ((rootProps, state) => (
        <motion.button
          {...(rootProps as HTMLMotionProps<"button">)}
          whileTap={reduceMotion || state.disabled ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      ))}
      {...props}
      data-slot="checkbox"
    >
      <BaseCheckbox.Indicator
        // keepMounted so the tick is in the DOM to draw *out* on uncheck, not yanked.
        keepMounted
        data-slot="checkbox-indicator"
        className="grid size-[70%] place-items-center text-current"
        render={(indicatorProps, state) => (
          <CheckboxMark
            // Cast: Base UI types these as DOM span props, and `onAnimationStart` and
            // friends mean different things to React and to Motion. Type-level only —
            // Base UI passes data attributes and a ref, not animation callbacks.
            {...(indicatorProps as unknown as SVGMotionProps<SVGSVGElement>)}
            checked={state.checked}
            indeterminate={state.indeterminate}
          />
        )}
      />
      {children}
    </BaseCheckbox.Root>
  );

  if (label == null) return box;

  return (
    <label
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "group/checkbox-label inline-flex w-fit cursor-pointer items-center gap-2 select-none",
        "data-[disabled]:cursor-not-allowed has-[[data-slot=checkbox][data-disabled]]:cursor-not-allowed",
        labelClassName,
      )}
    >
      {box}
      <span className="text-sm text-foreground group-data-[disabled]/checkbox-label:text-muted-foreground group-has-[[data-slot=checkbox][data-disabled]]/checkbox-label:text-muted-foreground">
        {label}
      </span>
    </label>
  );
}

export type CheckboxGroupProps = ComponentProps<typeof BaseCheckboxGroup>;

/** Shared values and parent selection, with all interaction owned by Base UI. */
export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup
      className={typeof className === "function"
        ? (state) => cn(checkboxGroupVariants(), className(state))
        : cn(checkboxGroupVariants(), className)}
      {...props}
      data-slot="checkbox-group"
    />
  );
}
