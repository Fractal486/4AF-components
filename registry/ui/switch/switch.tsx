"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Check } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import { LoadingIndicator } from "@/registry/lib/loader";
import { useMergedRefs } from "@/registry/lib/refs";
import { useSwitchState, type SwitchChangeHandler } from "./switch-state";
import { useSwitchDrag } from "./switch-drag";
import {
  switchThumbVariants,
  switchTrackVariants,
  type SwitchVariants,
} from "./switch.variants";

/**
 * A switch.
 *
 * Behaviour is Base UI's: the role, the keyboard toggle, the hidden input for forms,
 * and controlled/uncontrolled via `checked` / `defaultChecked` / `onCheckedChange`.
 *
 * Two motions, both worth the Motion runtime:
 *  - the thumb follows a drag, then springs to the accepted checked position;
 *  - its middle section grows between fixed rounded end caps: a little on hover, more
 *    while held. That stretch is the detail that makes it feel like an object rather
 *    than a checkbox, while keeping the thumb's ends round instead of turning the circle
 *    into an oval. It grows toward the track's center, so the outer edge stays put, and
 *    on release it lets go as the thumb slides, landing as a circle. It is all
 *    transform-driven, so it stays off the layout path.
 *
 * `tone` is the two versions: `adaptive` flips the thumb light/dark to stay in contrast
 * with the track; `fixed` holds it dark in both states.
 */
export interface SwitchProps
  extends Omit<ComponentProps<typeof BaseSwitch.Root>, "onCheckedChange">,
    SwitchVariants {
  /** Return a promise for optimistic saving; rejection rolls back an uncontrolled switch. */
  onCheckedChange?: SwitchChangeHandler;
  /** Show decorative on/off marks in the track. @default false */
  icons?: boolean;
  /** Delay the saving indicator, without delaying the change. @default 400 */
  pendingDelay?: number;
  loader?: ReactNode;
  onError?: (error: unknown) => void;
}

/** How far the thumb stretches toward the track's center on hover, and while pressed. */
const HOVER_EXTENSION = 1.5;
const PRESSED_EXTENSION = 3.5;
/** How far the bridge tucks under each cap, so their antialiased edges never meet. */
const BRIDGE_OVERLAP = 0.5;
const BRIDGE_WIDTH = PRESSED_EXTENSION + BRIDGE_OVERLAP * 2;

export function Switch({
  className,
  tone,
  disabled,
  readOnly,
  ref,
  inputRef: inputRefProp,
  icons = false,
  pendingDelay,
  loader,
  onError,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerEnter,
  onPointerLeave,
  onPointerCancel,
  onLostPointerCapture,
  onClickCapture,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  // Pointer-only affordance: the squish answers a press, so it's driven by pointer
  // state, not by `checked`. A keyboard toggle skips it, which is correct — there's no
  // thumb being held down.
  const [pressed, setPressed] = useState(false);
  // Hover is a mouse affordance; a touch has no hover to answer. After a release the hover
  // stretch stays off until the pointer leaves, so the thumb lands as a circle instead of
  // stretching again the moment its slide ends.
  const [hovered, setHovered] = useState(false);
  const [settled, setSettled] = useState(false);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const thumbRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [announcementTarget, setAnnouncementTarget] = useState<HTMLElement | null>(null);
  const announcementRef = useCallback((node: HTMLElement | null) => {
    setAnnouncementTarget(node?.ownerDocument.body ?? null);
  }, []);
  const localRef = useMergedRefs(rootRef, announcementRef);
  const mergedRef = useMergedRefs(localRef, ref);
  const mergedInputRef = useMergedRefs(inputRef, inputRefProp);
  const state = useSwitchState({ checked, defaultChecked, onCheckedChange, onError, pendingDelay, rootRef, inputRef, form: props.form });
  const isChecked = state.checked;
  const blocked = Boolean(disabled || readOnly || state.pending);
  const drag = useSwitchDrag(rootRef, thumbRef, isChecked, blocked, reduceMotion);
  const extension = blocked || drag.dragging ? 0 : pressed ? PRESSED_EXTENSION : hovered && !settled ? HOVER_EXTENSION : 0;

  const transition = reduceMotion ? { duration: 0 } : spring.snappy;

  // The bridge is derived from the caps rather than animated alongside them. The gap it
  // fills runs from the start cap's inner edge to the end cap's, and both edges move on
  // their own springs, often in opposite directions when a press releases into a toggle.
  // An independently animated strip only lines up with that gap at rest, which left
  // fractional slivers uncovered mid-spring. Reading the caps' live offsets keeps it
  // exactly over the gap on every frame, overshoot included.
  const startX = useMotionValue(0);
  const endX = useMotionValue(0);
  const bridgeScale = useTransform(
    () => (endX.get() - startX.get() + BRIDGE_OVERLAP * 2) / BRIDGE_WIDTH,
  );

  const release = () => setPressed(false);
  const leave = () => {
    setPressed(false);
    setHovered(false);
    setSettled(false);
  };

  return (
    <>
      <BaseSwitch.Root
        ref={mergedRef}
        inputRef={mergedInputRef}
        checked={isChecked}
        disabled={disabled}
        readOnly={readOnly}
        className={typeof className === "function"
          ? (switchState) => cn(switchTrackVariants(), className(switchState))
          : cn(switchTrackVariants(), className)}
        {...props}
        data-slot="switch"
        data-pending={state.pending ? "" : undefined}
        data-error={state.failed ? "" : undefined}
        data-dragging={drag.dragging ? "" : undefined}
        aria-busy={state.pending || undefined}
        aria-disabled={state.pending || props["aria-disabled"]}
        onCheckedChange={state.change}
        onClickCapture={(event) => { onClickCapture?.(event); drag.onClickCapture(event); }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          drag.onPointerDown(event);
          if (!event.defaultPrevented && !blocked && event.button === 0 && !event.currentTarget.hasAttribute("data-disabled")) setPressed(true);
        }}
        onPointerMove={(event) => { onPointerMove?.(event); drag.onPointerMove(event); }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          drag.onPointerUp(event);
          if (pressed) setSettled(true);
          release();
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.pointerType === "mouse" && !blocked && !event.currentTarget.hasAttribute("data-disabled")) setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          leave();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          drag.onPointerCancel(event);
          release();
        }}
        onLostPointerCapture={(event) => { onLostPointerCapture?.(event); drag.onLostPointerCapture(event); release(); }}
      >
        {icons && <span aria-hidden="true" data-slot="switch-icons" className="pointer-events-none absolute inset-0 flex items-center justify-between px-1.5">
          <Check className="size-2.5 text-primary-foreground opacity-0 group-data-[checked]/switch:opacity-100" strokeWidth={3} />
          <span className="size-2 rounded-full border border-muted-foreground group-data-[checked]/switch:opacity-0" />
        </span>}
        <BaseSwitch.Thumb
          ref={thumbRef}
          className={cn(switchThumbVariants({ tone }))}
          render={
            <motion.span
              data-slot="switch-thumb"
              data-pressed={pressed || undefined}
              style={{ x: drag.x }}
              transition={transition}
            >
              <span className="absolute inset-0 rounded-full bg-inherit rtl:rotate-180">
                <motion.span
                  aria-hidden="true"
                  data-slot="switch-thumb-cap-start"
                  className="absolute inset-y-0 left-0 w-1/2 rounded-l-full bg-inherit"
                  style={{ x: startX }}
                  transition={transition}
                  animate={
                    { x: reduceMotion ? 0 : isChecked ? -extension : 0 }
                  }
                />
                {/* Starts half a pixel inside the start cap and ends half a pixel inside the
                    end cap, at any extension. At rest it's a 1px sliver over the seam, inside
                    the circle. Flat cap edges make the tuck invisible. */}
                <motion.span
                  aria-hidden="true"
                  data-slot="switch-thumb-middle"
                  className="absolute top-0 left-[calc(50%-0.5px)] h-full w-1 origin-left bg-inherit"
                  style={{ x: startX, scaleX: bridgeScale }}
                />
                <motion.span
                  aria-hidden="true"
                  data-slot="switch-thumb-cap-end"
                  className="absolute inset-y-0 right-0 w-1/2 rounded-r-full bg-inherit"
                  style={{ x: endX }}
                  transition={transition}
                  animate={
                    { x: reduceMotion ? 0 : isChecked ? 0 : extension }
                  }
                />
              </span>
              {state.pending && state.slow && <LoadingIndicator loader={loader} className="absolute inset-0 z-10 m-auto size-3" />}
            </motion.span>
          }
        />
      </BaseSwitch.Root>
      {/* Keep announcements outside a wrapping label so they never change its name. */}
      {announcementTarget && createPortal(
        <span className="sr-only" role="status" aria-live="polite">{state.pending ? "Saving" : state.failed ? "Could not save change." : ""}</span>,
        announcementTarget,
      )}
    </>
  );
}
