"use client";

import { Input as BaseInput, type InputState } from "@base-ui/react/input";
import { useRef, type ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { inputVariants, type InputVariants } from "./input.variants";

/**
 * A native input backed by Base UI.
 *
 * Base UI keeps this field compatible with its Field primitive and provides the
 * controlled/uncontrolled value APIs. This wrapper only adds the 4AF visual contract,
 * data attributes, and the source project's safe autocomplete default.
 */
export interface InputProps
  extends Omit<ComponentProps<typeof BaseInput>, "className">,
    InputVariants {
  className?: string | ((state: InputState) => string | undefined);
}

export function Input({
  className,
  variant = "default",
  tone = "neutral",
  type,
  disabled,
  readOnly,
  ref,
  ...props
}: InputProps) {
  const resolvedVariant = variant ?? "default";
  const resolvedTone = tone ?? "neutral";
  const baseClassName = inputVariants({ variant: resolvedVariant, tone: resolvedTone });
  const isNumber = type === "number";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mergedRef = useMergedRefs(inputRef, ref);

  const stepValue = (direction: "up" | "down") => {
    const input = inputRef.current;
    if (!input || disabled || readOnly) return;

    try {
      if (direction === "up") input.stepUp();
      else input.stepDown();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {
      // Invalid min/max/step combinations remain governed by native validation.
    }
  };

  const numberClassName = isNumber
    ? "pe-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    : undefined;
  const mergedClassName =
    typeof className === "function"
      ? (state: InputState) => cn(baseClassName, numberClassName, className(state))
      : cn(baseClassName, numberClassName, className);

  const input = (
    <BaseInput
      ref={mergedRef}
      type={type}
      autoComplete="off"
      data-slot="input"
      data-variant={resolvedVariant}
      data-tone={resolvedTone}
      data-number-stepper={isNumber || undefined}
      className={mergedClassName}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
    />
  );

  if (!isNumber) return input;

  const stepperDisabled = disabled || readOnly;

  return (
    <span className="relative block w-full" data-slot="input-number">
      {input}
      <span className="absolute inset-y-0 end-0 flex w-8 flex-col items-center justify-center gap-0">
        <button
          type="button"
          aria-label="Increase value"
          disabled={stepperDisabled}
          onClick={() => stepValue("up")}
          className="flex h-3.5 w-7 items-center justify-center rounded-sm text-subtle-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-[oklch(0.390_0_0_/_0.502)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Chevron direction="up" />
        </button>
        <button
          type="button"
          aria-label="Decrease value"
          disabled={stepperDisabled}
          onClick={() => stepValue("down")}
          className="flex h-3.5 w-7 items-center justify-center rounded-sm text-subtle-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-[oklch(0.390_0_0_/_0.502)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Chevron direction="down" />
        </button>
      </span>
    </span>
  );
}

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-3"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "up" ? "m4 9 4-4 4 4" : "m4 7 4 4 4-4"} />
    </svg>
  );
}
