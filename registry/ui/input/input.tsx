"use client";

import { Input as BaseInput, type InputState } from "@base-ui/react/input";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { fieldDescriptionVariants, fieldWrapperVariants, inputVariants, type InputVariants } from "./input.variants";

export { InputCount, type InputCountProps } from "./input-count";

/**
 * A native input backed by Base UI.
 *
 * Base UI keeps this field compatible with its Field primitive and provides the
 * controlled/uncontrolled value APIs. This wrapper only adds the 4AF visual contract,
 * data attributes. Autocomplete is off by default and can be overridden.
 */
export interface InputProps
  extends Omit<ComponentProps<typeof BaseInput>, "className">,
    InputVariants {
  className?: string | ((state: InputState) => string | undefined);
  /** Layout classes for the outer wrapper; className and ref still target the input. */
  wrapperClassName?: string;
  /**
   * An optional glyph pinned to the leading edge of the field. A Lucide icon sits
   * right; it is rendered decoratively at `size-4` and never takes the pointer, so a
   * click on it still lands on the input.
   */
  startIcon?: ReactNode;
  /**
   * An optional control pinned to the trailing edge of the field, such as a clear, copy,
   * or reveal button, or a labelled `xs` Button. The slot measures its content and the
   * text stops short of it, so the label can change width. It squares the button's corners
   * to sit concentrically inside the field. Interactive, so the caller gives it an
   * accessible name. Ignored on number and file inputs, which use the trailing edge themselves.
   */
  endAction?: ReactNode;
  /** Supporting content below the field, linked through aria-describedby. */
  description?: ReactNode;
}

export function Input({
  className,
  wrapperClassName,
  variant = "default",
  tone = "neutral",
  type,
  startIcon,
  endAction,
  description,
  "aria-describedby": describedBy,
  disabled,
  readOnly,
  ref,
  ...props
}: InputProps) {
  const resolvedVariant = variant ?? "default";
  const resolvedTone = tone ?? "neutral";
  const baseClassName = inputVariants({ variant: resolvedVariant, tone: resolvedTone });
  const isNumber = type === "number";
  const hasStartIcon = startIcon != null && startIcon !== false;
  const hasEndAction = endAction != null && endAction !== false && !isNumber && type !== "file";
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const actionRef = useRef<HTMLSpanElement | null>(null);

  // The action's width drives the input's trailing padding through a CSS variable. It is
  // written straight to the wrapper's style, so a label that changes width (Copy → Copied)
  // re-pads the text without re-rendering the input. `offsetWidth` is the layout width, so
  // a pressed Button's scale does not shrink the padding for a frame.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const action = actionRef.current;
    if (!hasEndAction || !wrapper || !action) return;
    const measure = () => wrapper.style.setProperty("--input-action-width", `${action.offsetWidth}px`);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(action);
    return () => observer.disconnect();
  }, [hasEndAction]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  const descriptionId = useId();
  const hasDescription = description != null && typeof description !== "boolean" && description !== "";
  const [fileSelection, setFileSelection] = useState({ type, hasFiles: false });
  if (fileSelection.type !== type) {
    // Changing an input's type clears its native file selection.
    setFileSelection({ type, hasFiles: false });
  }

  useEffect(() => {
    if (type !== "file") return;
    const form = inputRef.current?.form;
    const onReset = (event: Event) => {
      // Reset can be canceled by the caller. Wait for all reset handlers to finish.
      queueMicrotask(() => {
        if (!event.defaultPrevented) setFileSelection({ type, hasFiles: false });
      });
    };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [type, props.form]);

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
      data-icon-start={hasStartIcon || undefined}
      data-action-end={hasEndAction || undefined}
      data-file-empty={type === "file" && (!fileSelection.hasFiles || props.value === "") ? "" : undefined}
      className={mergedClassName}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
      onChange={(event) => {
        if (type === "file") setFileSelection({ type, hasFiles: (event.currentTarget.files?.length ?? 0) > 0 });
        props.onChange?.(event);
      }}
      aria-describedby={[describedBy, hasDescription ? descriptionId : undefined].filter(Boolean).join(" ") || undefined}
    />
  );

  const stepperDisabled = disabled || readOnly;

  // Keep the input at the same position when a value-dependent icon or action appears.
  // Replacing an unwrapped input with this span would lose focus and native input state.
  const control = (
    <span
      // `group/input` lets the field keep its focus treatment while focus is on the action.
      ref={wrapperRef}
      className={cn("relative block w-full min-w-0", hasEndAction && "group/input", description === undefined && wrapperClassName)}
      data-slot="input-wrapper"
      data-number-stepper={isNumber || undefined}
      data-icon-start={hasStartIcon || undefined}
      data-action-end={hasEndAction || undefined}
    >
      {input}
      {hasStartIcon && (
        <span
          aria-hidden="true"
          data-slot="input-icon"
          data-disabled={disabled ? "" : undefined}
          // `start-3` on the boxed variants matches the field's own `px-3`; `underline`
          // drops its padding, so the glyph goes flush with the text it leads.
          className={cn(
            "pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground",
            "transition-[color,opacity] duration-(--duration-fast) ease-out [&_svg]:size-4",
            "data-[disabled]:opacity-50",
            resolvedVariant === "underline" && "start-0",
          )}
        >
          {startIcon}
        </span>
      )}
      {hasEndAction && (
        <span
          ref={actionRef}
          data-slot="input-action"
          data-disabled={disabled ? "" : undefined}
          // A 24px button centred in the 34px field leaves a 5px inset, so `end-[5px]` keeps
          // it even on all three sides and its radius is the field's 8px minus that inset.
          // An `xs` Button is also 24px high, so a labelled one gets the same geometry.
          // `underline` has no box to be concentric with, so the button keeps its own radius.
          className={cn(
            "absolute inset-y-0 flex items-center",
            resolvedVariant === "underline" ? "end-0" : "end-[5px] *:rounded-[3px]",
          )}
        >
          {endAction}
        </span>
      )}
      {isNumber && (
        <span className="absolute inset-y-0 end-0 flex w-8 flex-col items-center justify-center gap-0">
          <button
            type="button"
            aria-label="Increase value"
            disabled={stepperDisabled}
            onClick={() => stepValue("up")}
            className="flex h-3.5 w-7 items-center justify-center rounded-[6px] text-subtle-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-[oklch(0.390_0_0_/_0.502)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Chevron direction="up" />
          </button>
          <button
            type="button"
            aria-label="Decrease value"
            disabled={stepperDisabled}
            onClick={() => stepValue("down")}
            className="flex h-3.5 w-7 items-center justify-center rounded-[6px] text-subtle-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-[oklch(0.390_0_0_/_0.502)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Chevron direction="down" />
          </button>
        </span>
      )}
    </span>
  );

  // Keep the description wrapper when its content is hidden with null, so toggling helper
  // text does not remount the input or discard its uncontrolled value and focus.
  if (description === undefined) return control;
  return (
    <span data-slot="input-field" className={cn(fieldWrapperVariants(), wrapperClassName)}>
      {control}
      {hasDescription && (
        <span id={descriptionId} data-slot="input-description" className={fieldDescriptionVariants()}>
          {description}
        </span>
      )}
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
