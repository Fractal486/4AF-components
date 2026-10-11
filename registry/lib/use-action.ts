"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ActionStatus = "idle" | "pending" | "success" | "error";

export interface UseActionOptions {
  /** The work. Return a promise and the status waits for it. */
  action: () => void | Promise<unknown>;
  /** How long the outcome holds before returning to idle, in ms. @default 2000 */
  revertAfter?: number;
  /**
   * Don't report `pending` until the action has been running this long, in ms.
   *
   * Defaults to 0 — the press must be answered on the frame it happens, or the control
   * feels broken. Raise it only when the action is genuinely near-instant (a clipboard
   * write, a warm cache), where a spinner would flash for a single frame on its way to
   * the check mark and read as a glitch rather than as progress.
   */
  pendingDelay?: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Runs an action with pending, success, and error states. Prevents concurrent runs,
 * ignores updates after unmount, and resets the outcome after `revertAfter`.
 * Shared by ActionButton and asynchronous menu rows.
 */
export function useAction({
  action,
  revertAfter = 2000,
  pendingDelay = 0,
  onSuccess,
  onError,
}: UseActionOptions): { status: ActionStatus; run: () => Promise<void> } {
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
      // failure mode is a control that says "Deploy" while it's still deploying, which
      // is worth two lines to make impossible.
      if (alive.current && !running.current) setStatus("idle");
    }, revertAfter);
  }, [revertAfter]);

  const run = useCallback(async () => {
    // Callers disable the control while pending too, but guard here as well: `disabled`
    // is a DOM state, and a stray programmatic `.click()` doesn't respect it.
    if (running.current) return;
    running.current = true;

    // Cancel the previous outcome's teardown. Press again while "Deployed" is still
    // showing and its revert is already scheduled — leave it running and it fires on the
    // *old* clock: mid-way through the new action it flips back to idle, or it cuts the
    // second confirmation short. Each run owns its own revert, so the last one's has to
    // be dropped the moment a new one starts.
    clearTimeout(revertTimer.current ?? undefined);

    // Instant by default. A control that swallows a press and does nothing for a beat
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
      try {
        onError?.(error);
      } finally {
        // Consumer notifications may throw, but must not strand the state machine.
        scheduleRevert();
      }
      return;
    }

    running.current = false;
    clearTimeout(pendingTimer.current ?? undefined);
    if (!alive.current) return;
    setStatus("success");
    try {
      onSuccess?.();
    } finally {
      scheduleRevert();
    }
  }, [action, pendingDelay, onError, onSuccess, scheduleRevert]);

  return { status, run };
}
