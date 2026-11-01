"use client";

import { TriangleAlert } from "lucide-react";
import { useImperativeHandle, useState, type ReactNode, type Ref } from "react";
import { cn } from "@/registry/lib/cn";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { LoadingIndicator } from "@/registry/lib/loader";
import { Morph } from "@/registry/ui/morph/morph";
import { Toggle, type ToggleProps } from "@/registry/ui/toggle/toggle";

export type { ActionStatus };

export interface ActionToggleActions {
  /** Clear feedback and ignore outstanding results without changing pressed state. */
  reset: () => void;
}

export interface ActionToggleProps
  extends Omit<ToggleProps, "pressed" | "defaultPressed" | "onPressedChange" | "children"> {
  /**
   * The work that has to succeed before the new state is real. It's handed the state
   * being moved *to*, so one function can serve both directions.
   */
  action?: (pressed: boolean) => void | Promise<unknown>;
  /** External feedback state, independent of the persistent pressed state. */
  status?: ActionStatus;
  onStatusChange?: (status: ActionStatus) => void;
  /** Rejection reason for an externally controlled error state. */
  error?: unknown;
  /** Imperative feedback controls; the ordinary ref still points to the button. */
  actionsRef?: Ref<ActionToggleActions>;
  /** Controlled state. Provide `onPressedChange` with it. */
  pressed?: boolean;
  /** Uncontrolled starting state. @default false */
  defaultPressed?: boolean;
  /** Reports success, or requests a change immediately when action is externally owned. */
  onPressedChange?: (pressed: boolean) => void;
  /** The resting label, unpressed. */
  children?: ReactNode;
  /** The resting glyph, unpressed. */
  icon?: ReactNode;
  /** Labels for the other states. Each falls back to the label it's replacing. */
  labels?: { pressed?: ReactNode; pending?: ReactNode; error?: ReactNode | ((error: unknown) => ReactNode) };
  /** Glyphs for the other states. Pending and error default to the loader and the
      warning triangle. */
  icons?: { pressed?: ReactNode; pending?: ReactNode; error?: ReactNode };
  loader?: ReactNode;
  /**
   * `"widest"` (the default) holds the control at the width of its widest state.
   * `"current"` fits it to the showing state and animates the width as the state changes.
   */
  sizing?: "widest" | "current";
  /** How long a failure is shown before the control goes quiet again, in ms.
      @default 2000 */
  revertAfter?: number;
  /** Hold back the pending glyph for this long, so a near-instant action doesn't flash
      a spinner. @default 0 */
  pendingDelay?: number;
  /** Announced to screen readers. `aria-pressed` covers the landing; this covers the
      wait and the failure, which are otherwise silent. */
  announce?: { pending?: string; error?: string };
  onError?: (error: unknown) => void;
}

/**
 * Updates pressed state after the action resolves. Rejections preserve the previous
 * state and show error feedback. The label stays unchanged while pending unless
 * `labels.pending` is supplied. Base UI's Toggle owns `aria-pressed`.
 *
 * ```tsx
 * <ActionToggle
 *   action={(following) => (following ? follow(id) : unfollow(id))}
 *   icon={<Plus />}
 *   icons={{ pressed: <Check /> }}
 *   labels={{ pressed: "Following" }}
 * >
 *   Follow
 * </ActionToggle>
 * ```
 */
export function ActionToggle({
  action,
  status: controlledStatus,
  onStatusChange,
  error: controlledError,
  actionsRef,
  pressed,
  defaultPressed = false,
  onPressedChange,
  children,
  icon,
  labels,
  loader,
  icons,
  sizing = "widest",
  revertAfter,
  pendingDelay,
  announce,
  disabled,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  pressScale,
  // A labelled toggle is the case this exists for, so it defaults to a control with room
  // for a label rather than to Toggle's icon-sized ghost. Pass `size="icon"` for a star.
  variant = "outline",
  size = "md",
  onError,
  ...props
}: ActionToggleProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultPressed);
  const isControlled = pressed !== undefined;
  const current = isControlled ? pressed : uncontrolled;
  const target = !current;

  const { status, error, run, reset, buttonProps } = useAction({
    action: action ? () => action(target) : undefined,
    status: controlledStatus,
    onStatusChange,
    revertAfter,
    pendingDelay,
    // The state moves here and nowhere else. A controlled parent is told the same way it
    // would be by a plain Toggle, just later — once the answer is in.
    onSuccess: () => {
      if (!isControlled) setUncontrolled(target);
      onPressedChange?.(target);
    },
    onError,
  });

  useImperativeHandle(actionsRef, () => ({ reset }), [reset]);

  const errorLabel = typeof labels?.error === "function"
    ? status === "error" ? labels.error(controlledError !== undefined ? controlledError : error) : undefined
    : labels?.error;

  // `success` deliberately shows the resting content: the control having *become*
  // Following is the confirmation, and a tick on top of that would be a second one.
  //
  // Glyph and label get their own keys, and each collapses to the resting one when the
  // state it's moving to would draw the same thing. A press with no `labels.pressed` then
  // leaves the label alone instead of scaling and blurring an unchanged word — and with
  // `fillIcon` and no `icons.pressed`, the glyph isn't swapped at all, so the fill
  // transition is left to do the job it's there for rather than fighting a morph.
  const glyphKey =
    status === "pending" || status === "error"
      ? status
      : current && icons?.pressed != null
        ? "on"
        : "off";
  const labelKey =
    status === "pending" && labels?.pending != null
      ? "pending"
      : status === "error" && errorLabel != null
        ? "error"
        : current && labels?.pressed != null
          ? "on"
          : "off";
  const labelled = Boolean(children) || Boolean(labels?.pressed) || Boolean(labels?.pending) || Boolean(errorLabel);
  // A fitted control drops the glyph's gap while no glyph is showing, on the same clock as
  // the Morph's width, so a label-only resting state sits centred.
  const glyphShown = glyphKey === "off" ? icon != null : true;

  return (
    <>
      <Toggle
        pressed={current}
        onPressedChange={(next) => {
          if (status === "pending") return;
          if (action) void run();
          else {
            if (!isControlled) setUncontrolled(next);
            onPressedChange?.(next);
          }
        }}
        disabled={disabled}
        // Base UI Toggle has no focusableWhenDisabled prop. Cancel its activation while
        // pending instead of making the focused button natively disabled.
        onClick={(event) => {
          if (status === "pending") {
            event.preventDefault();
            event.preventBaseUIHandler();
            return;
          }
          onClick?.(event);
        }}
        onPointerEnter={(event) => { onPointerEnter?.(event); buttonProps.onPointerEnter(event); }}
        onPointerLeave={(event) => { onPointerLeave?.(event); buttonProps.onPointerLeave(); }}
        onFocus={(event) => { onFocus?.(event); buttonProps.onFocus(); }}
        onBlur={(event) => { onBlur?.(event); buttonProps.onBlur(); }}
        pressScale={status === "pending" ? false : pressScale}
        aria-disabled={status === "pending" || undefined}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        variant={variant}
        size={size}
        data-sizing={sizing}
        {...props}
      >
        {/* One box, so the button's own gap applies between glyph and label rather than a
            second copy of it — and so the padding logic still sees a single child.

            Glyph and label morph separately: the loader is a text glyph, about half the
            advance width of a 16px icon, so morphing them together centres the narrower
            state and drags the label sideways on every status change. Each Morph is handed
            every state at once, so the control reserves the width of the widest and holds
            still — "Follow" and "Following" are different widths, and a button that resizes
            as it lands moves out from under the cursor that's still resting on it.
            `sizing="current"` trades that away on purpose. */}
        <span
          className={cn(
            "inline-flex items-center",
            sizing === "current" && "transition-[gap] duration-(--duration-base) ease-out",
            sizing === "current" && !glyphShown ? "gap-0" : "gap-[inherit]",
          )}
        >
          <Morph
            activeKey={glyphKey}
            sizing={sizing}
            items={{
              off: icon,
              on: icons?.pressed ?? icon,
              pending: icons?.pending ?? <LoadingIndicator loader={loader} />,
              error: icons?.error ?? <TriangleAlert />,
            }}
          />
          {labelled && (
            <Morph
              activeKey={labelKey}
              sizing={sizing}
              items={{
                off: children,
                on: labels?.pressed,
                pending: labels?.pending,
                error: errorLabel,
              }}
            />
          )}
        </span>

      </Toggle>

      {/* `aria-pressed` announces the landing on its own. What it can't say is that the
          control is working, or that the press didn't take. */}
      <span aria-live="polite" className="sr-only">
        {status === "pending" && (announce?.pending ?? "Working")}
        {status === "error" && (announce?.error ?? (typeof errorLabel === "string" ? errorLabel : "Something went wrong"))}
      </span>
    </>
  );
}
