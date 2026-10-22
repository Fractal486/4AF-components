"use client";

import { TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, spring } from "@/registry/lib/motion";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { LoadingIndicator } from "@/registry/lib/loader";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Morph, morphVariants } from "@/registry/ui/morph/morph";

export type { ActionStatus };

function AnimatedCheck() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.svg
      data-slot="action-button-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.path
        d="M4 12.5l5 5L20 6.5"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            // Let the success icon appear before drawing its stroke.
            : { duration: duration.base, ease: ease.out, delay: 0.05 }
        }
      />
    </motion.svg>
  );
}

export interface ActionButtonProps
  extends Omit<ButtonProps, "loading" | "children" | "asChild"> {
  /** The work. Return a promise and the button waits for it. */
  action: () => void | Promise<unknown>;
  /** The resting label. */
  children?: ReactNode;
  /** An icon shown beside the resting label. */
  icon?: ReactNode;
  /**
   * Which side of the label the glyph sits on — the resting icon and the pending, success,
   * and error glyphs that replace it. Defaults to `"start"`.
   */
  iconPosition?: "start" | "end";
  /** Labels per state. Each falls back to the resting label. */
  labels?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /**
   * `"widest"` (the default) holds the button at the width of its widest state. `"current"`
   * fits it to the showing state and animates the width as the state changes.
   */
  sizing?: "widest" | "current";
  /** Whether pending keeps its label beside the loader or shows only a centered loader. */
  pendingMode?: "label" | "icon";
  /** How long the outcome holds before returning to idle, in ms. */
  revertAfter?: number;
  /**
   * Don't show `pending` until the action has been running this long, in ms.
   *
   * Defaults to 0 — the press must be answered on the frame it happens, or the button
   * feels broken. Raise it only when the action is genuinely near-instant (a clipboard
   * write, a warm cache), where a spinner would flash for a single frame on its way to
   * the check mark and read as a glitch rather than as progress.
   */
  pendingDelay?: number;
  /** Announced to screen readers. A state change they can't see is a state change
      they don't know about. */
  announce?: { pending?: string; success?: string; error?: string };
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * A button that runs something, shows how it went, and puts itself away.
 *
 * The state machine lives in `useAction` — the double-submit guard, the revert clock,
 * the unmount safety, the failure that must never render as success. It's a hook because
 * the same machine has to drive things that aren't buttons (a menu row that briefly
 * reads "Copied"), and those can't borrow a button's markup to get its behaviour. What's
 * left here is the presentation: the Morph between the four states, and the one thing
 * the hook can't do — saying the outcome out loud.
 */
export function ActionButton({
  action,
  children,
  icon,
  iconPosition = "start",
  labels,
  loader,
  sizing = "widest",
  pendingMode = "label",
  revertAfter = 2000,
  pendingDelay = 0,
  announce,
  disabled,
  focusableWhenDisabled,
  variant,
  size,
  onClick,
  onSuccess,
  onError,
  ...props
}: ActionButtonProps) {
  const { status, run } = useAction({
    action,
    revertAfter,
    pendingDelay,
    onSuccess,
    onError,
  });

  const reduceMotion = useReducedMotion();
  // The Morph's own transition, so the icon-only swap moves exactly like every other one.
  const swap = reduceMotion ? { duration: 0 } : spring.clean;
  const pendingIconOnly = pendingMode === "icon" && status === "pending";
  // Which label is actually showing, and — the part that matters — whether it differs from
  // the resting one at all. A status with no override of its own keeps the idle key, so the
  // label doesn't animate a swap for a change that never touched it.
  // Icon-only pending deliberately keeps the idle label in the hidden sizer. That preserves
  // the button's accessible name while the centered loader is drawn over the whole content
  // box.
  const override = status === "idle" || pendingIconOnly ? undefined : labels?.[status];
  const labelKey = pendingIconOnly ? "idle" : override == null ? "idle" : status;
  const glyphKey = pendingIconOnly ? "idle" : status;
  const fit = sizing === "current";
  const glyph = (
    <Morph
      activeKey={glyphKey}
      sizing={sizing}
      items={{
        idle: icon,
        pending: <LoadingIndicator loader={loader} />,
        success: <AnimatedCheck />,
        error: <TriangleAlert />,
      }}
    />
  );
  const labelled =
    Boolean(children) ||
    Boolean(labels && (labels.pending ?? labels.success ?? labels.error));
  // While idle, a label-only action still reserves the status glyph's width so its button
  // never resizes when it runs. That leading-only slot would otherwise push the visible
  // label to the right, so centre the idle label by half the reserved slot and gap. Once a
  // status glyph is visible, the icon-and-label group should be centred as a group.
  // Intentional icon-plus-label actions stay centred in every state.
  // The nudge points away from the reserved slot, so it flips with `iconPosition`.
  // A fitted button reserves nothing, so it has nothing to compensate for. It drops the
  // glyph's gap instead while no glyph is showing, on the same clock as the Morph's width.
  const labelOnlyOffset =
    !fit && !icon && labelled && status === "idle"
      ? size === "xs" || size === "sm"
        ? iconPosition === "end" ? "translate-x-2.5" : "-translate-x-2.5"
        : size === "icon-xs" || size === "icon-sm" || size === "icon" || size === "icon-lg"
          ? iconPosition === "end" ? "translate-x-2" : "-translate-x-2"
          : iconPosition === "end" ? "translate-x-3" : "-translate-x-3"
      : undefined;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        loader={loader}
        // Composed rather than owned outright, and taken off the spread below so nothing
        // can quietly replace it. A Base UI part that renders this button — a toolbar item,
        // a menu trigger — hands down its own click handling through the same prop, and
        // letting that land last meant the action simply never ran.
        onClick={(event) => {
          onClick?.(event);
          run();
        }}
        disabled={disabled || status === "pending"}
        focusableWhenDisabled={(!disabled && status === "pending") || focusableWhenDisabled}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        data-pending-mode={pendingMode}
        data-sizing={sizing}
        data-icon-position={iconPosition}
        {...props}
      >
        {/* The outer grid keeps one intrinsic content box. In icon-only pending mode the
            regular group remains as an invisible sizer, and the loader is centred over it;
            taking the label out of flow would make the button shrink while it is busy. */}
        <span
          data-slot="action-button-content"
          className="relative inline-grid place-items-center gap-[inherit]"
        >
          {/* One box, so `iconEdges` still sees a single child and the padding doesn't move
              — and `gap-[inherit]` so the space between glyph and label is the button's own,
              per size, rather than a second copy of that number. */}
          {/* Icon-only pending morphs this whole group out as the loader morphs in, in the
              Morph's own poses, rather than cutting it: the group cannot change key and
              unmount, because its label is still the button's accessible name. The label-only
              offset slides rather than jumps, so the label never moves without animating. */}
          <motion.span
            data-slot="action-button-group"
            data-state={pendingIconOnly ? "hidden" : "visible"}
            className={cn(
              "inline-flex items-center ease-out",
              fit
                ? "transition-[gap] duration-(--duration-base)"
                : "transition-[translate] duration-(--duration-fast)",
              fit && glyphKey === "idle" && icon == null ? "gap-0" : "gap-[inherit]",
              labelOnlyOffset,
            )}
            variants={morphVariants}
            initial={false}
            animate={pendingIconOnly ? "exit" : "animate"}
            transition={swap}
          >
            {/* The glyph morphs in its own box, separately from the label, and that split is
                the whole point. The loader is a text glyph — roughly half the advance width
                of a 16px icon — so morphing the two together centres the narrower state and
                slides the label sideways every time the status changes. Apart, the glyph
                swaps inside a box as wide as the widest glyph and the label holds still.
                It's the same split the menu's action row makes, for the same reason.

                Each Morph is handed every state at once, so the button reserves the width of
                the widest and never resizes as it moves through them. A button that changes
                width mid-action moves the target out from under the cursor — and here the
                cursor is still on it, waiting. `sizing="current"` trades that away on
                purpose. */}
            {iconPosition === "start" && glyph}
            {labelled && (
              <Morph
                activeKey={labelKey}
                sizing={sizing}
                items={{
                  idle: children,
                  pending: labels?.pending,
                  success: labels?.success,
                  error: labels?.error,
                }}
              />
            )}
            {iconPosition === "end" && glyph}
          </motion.span>

          <AnimatePresence initial={false}>
            {pendingIconOnly && (
              <motion.span
                data-slot="action-button-pending-icon"
                data-state="visible"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 inline-grid place-items-center"
                variants={morphVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={swap}
              >
                <LoadingIndicator loader={loader} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </Button>

      {/* Politely, so it waits for a pause rather than interrupting. The pending
          announcement matters most: a sighted user sees a spinner, everyone else gets
          silence unless you say something. */}
      <span aria-live="polite" className="sr-only">
        {status === "pending" && (announce?.pending ?? "Working")}
        {status === "success" && (announce?.success ?? "Done")}
        {status === "error" && (announce?.error ?? "Something went wrong")}
      </span>
    </>
  );
}
