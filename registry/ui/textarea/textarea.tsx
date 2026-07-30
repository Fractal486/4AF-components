"use client";

import { useRef, type ComponentProps, type PointerEvent, type Ref } from "react";
import { cn } from "@/registry/lib/cn";
import { inputVariants, type InputVariants } from "@/registry/ui/ui/input.variants";

/**
 * A multi-line field — the Input, taller.
 *
 * It wears the exact same treatment (`inputVariants`): the same border, the same focus
 * ring that grows on `--duration-fast`, the same `variant`/`tone` axes. There's no Base UI
 * textarea primitive, so this is a native `<textarea>` — a textarea has no behaviour a
 * primitive would own, only the visual contract, which it shares wholesale with Input.
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
  /** Focus colour — only axis a textarea carries (it's always the bordered `default` box). */
  tone?: InputVariants["tone"];
  /** The drag-to-resize grip in the corner. */
  resizable?: boolean;
}

export function Textarea({
  className,
  tone = "neutral",
  resizable = true,
  disabled,
  ref,
  ...props
}: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    event.preventDefault();

    const grip = event.currentTarget;
    const startY = event.clientY;
    const startHeight = textarea.offsetHeight;
    grip.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      textarea.style.height = `${Math.max(MIN_HEIGHT, startHeight + (moveEvent.clientY - startY))}px`;
    };
    const onUp = () => {
      grip.releasePointerCapture(event.pointerId);
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", onUp);
    };
    // Pointer capture routes the move/up events here, so the drag tracks past the edge.
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onUp);
  };

  return (
    <div className="relative w-full" data-slot="textarea">
      <textarea
        ref={setRef}
        data-variant="default"
        data-tone={tone ?? "neutral"}
        disabled={disabled}
        className={cn(
          inputVariants({ variant: "default", tone: tone ?? "neutral" }),
          // Override the Input's single-line box: a block element that grows, no native
          // resize (the grip owns it), a touch more vertical padding, and room so the last
          // line's text doesn't run under the grip.
          "block h-auto min-h-16 resize-none py-2",
          resizable && "pb-4",
          className,
        )}
        {...props}
      />
      {resizable && (
        <button
          type="button"
          aria-label="Resize"
          tabIndex={-1}
          disabled={disabled}
          onPointerDown={startResize}
          className="absolute right-1 bottom-1 flex size-4 cursor-ns-resize touch-none items-center justify-center text-subtle-foreground outline-none transition-[color] duration-(--duration-fast) ease-out hover:text-foreground disabled:hidden"
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
}
