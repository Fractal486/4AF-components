"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Spinner, type ButtonProps } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";

export type ActionStatus = "idle" | "pending" | "success" | "error";

export interface ActionButtonProps
  extends Omit<ButtonProps, "onClick" | "loading" | "children" | "asChild"> {
  /** The work. Return a promise and the button waits for it. */
  action: () => void | Promise<unknown>;
  /** The resting label. */
  children?: ReactNode;
  /** An icon shown beside the resting label. */
  icon?: ReactNode;
  /** Labels per state. Each falls back to the resting label. */
  labels?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
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
 * The state machine is the component. Every app writes this by hand and every app gets
 * some part of it wrong: the double-submit while the request is in flight, the
 * `setState` landing on an unmounted component, the failure that silently renders as
 * success, the confirmation that no screen reader ever hears.
 */
export function ActionButton({
  action,
  children,
  icon,
  labels,
  revertAfter = 2000,
  pendingDelay = 0,
  announce,
  disabled,
  variant,
  size,
  onSuccess,
  onError,
  ...props
}: ActionButtonProps) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  // The real double-submit guard. `status` can still be "idle" during a fast action
  // (see pendingDelay), and it's a render value anyway — a second click landing in the
  // same tick would read a stale one. A ref is the only thing that's true immediately.
  const running = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      // The action is async: it can resolve long after the user has navigated away.
      // Without this the resolution lands on a component that no longer exists.
      alive.current = false;
      clearTimeout(revertTimer.current ?? undefined);
      clearTimeout(pendingTimer.current ?? undefined);
    };
  }, []);

  const scheduleRevert = useCallback(() => {
    clearTimeout(revertTimer.current ?? undefined);
    revertTimer.current = setTimeout(() => {
      // `!running.current` as well as `alive`: a revert must never land on an action
      // that's in flight. Belt and braces — `run` already cancels this timer — but the
      // failure mode is a button that says "Deploy" while it's still deploying, which
      // is worth two lines to make impossible.
      if (alive.current && !running.current) setStatus("idle");
    }, revertAfter);
  }, [revertAfter]);

  const run = useCallback(async () => {
    // The button is `disabled` while pending too, but guard here as well: `disabled` is
    // a DOM state, and a stray programmatic `.click()` doesn't respect it.
    if (running.current) return;
    running.current = true;

    // Cancel the previous outcome's teardown. Press again while "Deployed" is still
    // showing and its revert is already scheduled — leave it running and it fires on the
    // *old* clock: mid-way through the new action it flips the button back to idle, or it
    // cuts the second confirmation short. Each run owns its own revert, so the last one's
    // has to be dropped the moment a new one starts.
    clearTimeout(revertTimer.current ?? undefined);

    // Instant by default. A button that swallows a press and does nothing for a beat
    // reads as broken, and no amount of correctness later makes up for that first
    // moment. Deferring is opt-in, for actions that finish so fast the spinner would be
    // a flicker rather than progress — and even a `setTimeout(…, 0)` is a frame too
    // late, so zero means synchronous, not "very soon".
    clearTimeout(pendingTimer.current ?? undefined);
    if (pendingDelay <= 0) {
      setStatus("pending");
    } else {
      pendingTimer.current = setTimeout(() => {
        if (alive.current && running.current) setStatus("pending");
      }, pendingDelay);
    }

    try {
      await action();
    } catch (error) {
      // A failure that renders as success is the worst outcome available: the user
      // believes the work happened and moves on.
      running.current = false;
      clearTimeout(pendingTimer.current ?? undefined);
      if (!alive.current) return;
      setStatus("error");
      onError?.(error);
      scheduleRevert();
      return;
    }

    running.current = false;
    clearTimeout(pendingTimer.current ?? undefined);
    if (!alive.current) return;
    setStatus("success");
    onSuccess?.();
    scheduleRevert();
  }, [action, pendingDelay, onError, onSuccess, scheduleRevert]);

  const label = (override: ReactNode | undefined) => override ?? children;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={run}
        disabled={disabled || status === "pending"}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        {...props}
      >
        {/* Morph is handed every state at once, so the button reserves the width of the
            widest and never resizes as it moves through them. A button that changes
            width mid-action moves the target out from under the cursor — and here the
            cursor is still on it, waiting. */}
        <Morph
          activeKey={status}
          className="gap-2"
          items={{
            idle: (
              <Content icon={icon}>{children}</Content>
            ),
            pending: (
              <Content icon={<Spinner />}>{label(labels?.pending)}</Content>
            ),
            success: (
              <Content icon={<Check />}>{label(labels?.success)}</Content>
            ),
            error: (
              <Content icon={<TriangleAlert />}>{label(labels?.error)}</Content>
            ),
          }}
        />
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

function Content({ icon, children }: { icon?: ReactNode; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}
