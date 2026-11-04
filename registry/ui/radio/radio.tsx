"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { radioIndicatorVariants, radioVariants, type RadioVariants } from "./radio.variants";

/**
 * A radio group.
 *
 * Behaviour is Base UI's: roving-tabindex arrow-key selection within the group, the
 * `radiogroup`/`radio` roles, the hidden inputs for forms, and controlled/uncontrolled via
 * `value` / `defaultValue` / `onValueChange`.
 *
 * It's the Checkbox's sibling and shares its look — the same recessed well, border and
 * focus ring — differing only where the two controls genuinely differ: a radio is a single
 * choice, so it keeps its outline and fills a white ring around an open center. The ring is CSS, a
 * scale/opacity/blur transition off Base UI's `data-checked`; unlike the checkbox's self-drawing
 * tick there's no path to animate, so no runtime is needed. The circle gives the same
 * press-scale on tap and — deliberately — nothing on hover, matching the Checkbox.
 */

// Row gap per size — the smaller the control, the tighter the rows sit.
const GROUP_GAP = { sm: "gap-1.5", md: "gap-2.5", lg: "gap-3" } as const;

type Size = NonNullable<RadioVariants["size"]>;

// The group's size is the default for its radios, so it's set once on the group.
const RadioSizeContext = createContext<Size>("md");

export interface RadioGroupProps extends ComponentProps<typeof BaseRadioGroup> {
  /** Sizes the radios (each can still override) and tightens the row gap to match. */
  size?: Size;
}

export function RadioGroup({ className, size = "md", ...props }: RadioGroupProps) {
  return (
    <RadioSizeContext.Provider value={size}>
      <BaseRadioGroup
        className={typeof className === "function"
          ? (state) => cn("flex flex-col", GROUP_GAP[size], className(state))
          : cn("flex flex-col", GROUP_GAP[size], className)}
        {...props}
        data-slot="radio-group"
      />
    </RadioSizeContext.Provider>
  );
}

export interface RadioProps
  extends ComponentProps<typeof BaseRadio.Root>,
    RadioVariants {
  /**
   * Text beside the circle. When set, the circle and text sit inside one `<label>`, so
   * clicking anywhere on the row selects it — the label binds to Base UI's hidden radio
   * input, which also names the control for a screen reader.
   */
  label?: ReactNode;
  /** Class for the wrapping `<label>` when `label` is set. */
  labelClassName?: string;
}

export function Radio({
  className,
  size: sizeProp,
  disabled,
  label,
  labelClassName,
  render,
  children,
  ...props
}: RadioProps) {
  const reduceMotion = useReducedMotion();
  const groupSize = useContext(RadioSizeContext);
  // Falls back to the group's size, so `<RadioGroup size>` sizes every radio at once.
  const size = sizeProp ?? groupSize;

  const control = (
    <BaseRadio.Root
      disabled={disabled}
      className={typeof className === "function"
        ? (state) => cn(radioVariants({ size }), className(state))
        : cn(radioVariants({ size }), className)}
      render={render ?? ((rootProps, state) => (
        <motion.span
          {...(rootProps as HTMLMotionProps<"span">)}
          whileTap={reduceMotion || state.disabled ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      ))}
      {...props}
      data-slot="radio"
    >
      <BaseRadio.Indicator
        // Keep the ring mounted so it can scale out on deselect.
        keepMounted
        data-slot="radio-indicator"
        className={radioIndicatorVariants({ size })}
      />
      {children}
    </BaseRadio.Root>
  );

  if (label == null) return control;

  return (
    <label
      className={cn(
        "inline-flex w-fit cursor-pointer items-center gap-2 text-foreground select-none",
        // Keyed off Base UI's `data-disabled` (via `:has`) rather than the `disabled`
        // prop, so the row dims whether the radio is disabled itself or its whole group
        // is. The text colour inherits, so dimming the label dims it.
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-muted-foreground",
        labelClassName,
      )}
    >
      {control}
      <span className="text-sm">{label}</span>
    </label>
  );
}
