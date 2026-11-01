"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { useEffect, useId, useRef, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from "react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { fieldDescriptionVariants, fieldWrapperVariants, inputVariants, type InputVariants } from "@/registry/ui/ui/input.variants";
import { clampRows, useTextareaAutosize } from "./textarea-autosize";
import { textareaVariants } from "./textarea.variants";

/**
 * A multi-line field — the Input, taller.
 *
 * A Base UI Field control rendering a native `<textarea>`, sharing Input's styling.
 * Choose the bordered
 * default or a plain field when its surrounding surface already provides the frame.
 * Base UI owns field labels, descriptions, validation, and value notifications.
 *
 * The one addition is the corner grip. The native resize handle is the browser's, not
 * ours, so it's turned off (`resize-none`) and replaced with a grip that drags the height
 * itself — pointer-captured, so the drag keeps tracking past the textarea's edge, and
 * `touch-none` so a touch-drag resizes rather than scrolls the page.
 */

const MIN_HEIGHT = 64;

export interface TextareaProps extends Omit<ComponentProps<"textarea">, "className" | "ref"> {
  className?: string;
  ref?: Ref<HTMLTextAreaElement>;
  /** `default` is bordered; `plain` removes the border and focus shadow. */
  variant?: "default" | "plain";
  /** Focus colour. */
  tone?: InputVariants["tone"];
  /** The drag-to-resize grip in the corner. */
  resizable?: boolean;
  /** Supporting content below the field, linked through aria-describedby. */
  description?: ReactNode;
  /** Grow with content between minRows and maxRows. @default true */
  autoResize?: boolean;
  /** Starting row count. Falls back to rows, then 3. */
  minRows?: number;
  /** Maximum automatically visible rows before scrolling. @default 10 */
  maxRows?: number;
  /** Submit the associated form with Ctrl/Command + Enter. @default false */
  submitOnShortcut?: boolean;
  onValueChange?: ComponentProps<typeof BaseInput>["onValueChange"];
}

export function Textarea({
  className,
  variant = "default",
  tone = "neutral",
  resizable = true,
  autoResize = true,
  minRows,
  maxRows = 10,
  rows,
  submitOnShortcut = false,
  onKeyDown,
  onValueChange,
  description,
  "aria-describedby": describedBy,
  disabled,
  ref,
  ...props
}: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mergedRef = useMergedRefs(textareaRef, ref);
  const resizeCleanup = useRef<(() => void) | null>(null);
  const descriptionId = useId();
  const hasDescription = description != null && typeof description !== "boolean" && description !== "";
  const minimumRows = clampRows(minRows ?? rows, 3);
  const maximumRows = Math.max(minimumRows, clampRows(maxRows, 10));
  const showGrip = resizable && !autoResize;
  useTextareaAutosize(textareaRef, autoResize, minimumRows, maximumRows, props.form);

  useEffect(() => () => resizeCleanup.current?.(), [disabled, showGrip]);

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.disabled || event.button !== 0) return;
    event.preventDefault();
    resizeCleanup.current?.();

    const grip = event.currentTarget;
    const startY = event.clientY;
    const startHeight = textarea.offsetHeight;
    const pointerId = event.pointerId;
    grip.setPointerCapture(pointerId);

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      if (textarea.disabled) { cleanup(); return; }
      textarea.style.height = `${Math.max(MIN_HEIGHT, startHeight + (moveEvent.clientY - startY))}px`;
    };
    const cleanup = () => {
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", onEnd);
      grip.removeEventListener("pointercancel", onEnd);
      grip.removeEventListener("lostpointercapture", onEnd);
      resizeCleanup.current = null;
      if (grip.hasPointerCapture(pointerId)) grip.releasePointerCapture(pointerId);
    };
    const onEnd = (endEvent: globalThis.PointerEvent) => {
      if (endEvent.pointerId === pointerId) cleanup();
    };
    resizeCleanup.current = cleanup;
    // Pointer capture routes events here until release, cancellation, or lost capture.
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onEnd);
    grip.addEventListener("pointercancel", onEnd);
    grip.addEventListener("lostpointercapture", onEnd);
  };

  const control = (
    <div className="relative w-full [&:has(>textarea:disabled)>button]:hidden" data-slot="textarea">
      <BaseInput
        {...(props as unknown as ComponentProps<typeof BaseInput>)}
        ref={mergedRef}
        render={<textarea rows={minimumRows} />}
        onValueChange={onValueChange}
        onKeyDown={(event) => {
          const keyEvent = event as unknown as KeyboardEvent<HTMLTextAreaElement>;
          onKeyDown?.(keyEvent);
          if (submitOnShortcut && !keyEvent.defaultPrevented && keyEvent.key === "Enter"
            && (keyEvent.metaKey || keyEvent.ctrlKey) && !keyEvent.nativeEvent.isComposing
            && keyEvent.keyCode !== 229 && keyEvent.currentTarget.form) {
            keyEvent.preventDefault();
            keyEvent.currentTarget.form.requestSubmit();
          }
        }}
        data-variant={variant}
        data-tone={tone ?? "neutral"}
        data-autoresize={autoResize ? "" : undefined}
        disabled={disabled}
        className={cn(
          inputVariants({ variant, tone: tone ?? "neutral" }),
          // Height reflows the form when auto-growing. Manual mode reserves grip space.
          textareaVariants({ autoResize, grip: showGrip }),
          className,
        )}
        aria-describedby={[describedBy, hasDescription ? descriptionId : undefined].filter(Boolean).join(" ") || undefined}
      />
      {showGrip && (
        <button
          type="button"
          aria-label="Resize"
          tabIndex={-1}
          disabled={disabled}
          onPointerDown={startResize}
          className="absolute right-1 bottom-1 flex size-4 cursor-ns-resize touch-none items-center justify-center rounded-[6px] text-subtle-foreground outline-none transition-[color] duration-(--duration-fast) ease-out hover:text-foreground disabled:hidden"
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="size-3">
            <path
              d="M11 4 4 11M11 8 8 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );

  if (description === undefined) return control;
  return (
    <div data-slot="textarea-field" className={fieldWrapperVariants()}>
      {control}
      {hasDescription && (
        <div id={descriptionId} data-slot="textarea-description" className={fieldDescriptionVariants()}>
          {description}
        </div>
      )}
    </div>
  );
}
