"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { radioVariants, type RadioVariants } from "./radio.variants";

/**
 * A radio group.
 *
 * Behaviour is Base UI's: roving-tabindex arrow-key selection within the group, the
 * `radiogroup`/`radio` roles, the hidden inputs for forms, and controlled/uncontrolled via
 * `value` / `defaultValue` / `onValueChange`.
 *
 * It's the Checkbox's sibling and shares its look — the same recessed well, border and
 * focus ring — differing only where the two controls genuinely differ: a radio is a single
 * choice, so it keeps its outline and shows a dot instead of filling. The dot is CSS, a
 * scale/opacity transition off Base UI's `data-checked`; unlike the checkbox's self-drawing
 * tick there's no path to animate, so no runtime is needed. The circle gives the same
 * press-scale on tap and — deliberately — nothing on hover, matching the Checkbox.
 */

// Dot diameter per box size — roughly 40% of the box, centred by the circle's flexbox.
const DOT = { sm: "size-1.5", md: "size-2", lg: "size-2.5" } as const;

export function RadioGroup({ className, ...props }: ComponentProps<typeof BaseRadioGroup>) {
  return <BaseRadioGroup className={cn("flex flex-col gap-2.5", className)} {...props} />;
}

export interface RadioProps
  extends Omit<ComponentProps<typeof BaseRadio.Root>, "className" | "render">,
    RadioVariants {
  className?: string;
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
  size,
  disabled,
  label,
  labelClassName,
  ...props
}: RadioProps) {
  const reduceMotion = useReducedMotion();

  const control = (
    <BaseRadio.Root
      disabled={disabled}
      className={cn(radioVariants({ size }), className)}
      // A span, not a native button (Base UI's default for a radio), so there's no
      // nativeButton dance — Motion only adds the press gesture.
      render={
        <motion.span
          whileTap={reduceMotion || disabled ? undefined : { scale: PRESS_SCALE }}
          transition={spring.press}
        />
      }
      {...props}
    >
      <BaseRadio.Indicator
        // keepMounted so the dot is in the DOM to scale *out* on deselect, not yanked.
        keepMounted
        className={cn(
          // Centred with a transform, not flexbox: at fractional device-pixel ratios a
          // laid-out box snaps to the pixel grid and lands half a pixel off inside the
          // 1.5px border; a translate renders sub-pixel and stays centred. (Tailwind v4
          // keeps `translate` and `scale` as separate properties, so they compose.)
          "absolute top-1/2 left-1/2 -translate-1/2 rounded-full bg-primary",
          DOT[size ?? "md"],
          "scale-0 opacity-0 transition-[scale,opacity] duration-(--duration-fast) ease-out",
          "data-[checked]:scale-100 data-[checked]:opacity-100",
        )}
      />
    </BaseRadio.Root>
  );

  if (label == null) return control;

  return (
    <label
      className={cn(
        "inline-flex w-fit cursor-pointer items-center gap-2 select-none",
        // Keyed off Base UI's `data-disabled` (via the circle's `peer`/a `:has`) rather
        // than the `disabled` prop, so the row dims whether the radio is disabled itself
        // or its whole group is.
        "has-[[data-disabled]]:cursor-not-allowed",
        labelClassName,
      )}
    >
      {control}
      <span className="text-sm text-foreground peer-data-[disabled]:text-muted-foreground">
        {label}
      </span>
    </label>
  );
}
