"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

export type ActionStatus = "idle" | "pending" | "success" | "error";
export type ActionRevertAfter = number | { success?: number; error?: number };

export interface UseActionOptions {
  /** Optional when an external form owns the work and status. */
  action?: () => void | Promise<unknown>;
  status?: ActionStatus;
  onStatusChange?: (status: ActionStatus) => void;
  /** Milliseconds before idle, shared or per outcome. Omitted outcomes use 2000. */
  revertAfter?: ActionRevertAfter;
  /** Delay the pending indicator for near-instant work. @default 0 */
  pendingDelay?: number;
  /** Outcome callbacks still run after unmount, unless reset invalidated the request. */
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

type RevertClock = {
  status: "success" | "error";
  duration: number;
  revision: number;
  remaining: number;
};

/** Async feedback shared by action controls and menu rows. Reset ignores late results;
 * it does not abort the underlying work. Spread buttonProps to hold errors while reading. */
export function useAction({
  action,
  status: controlledStatus,
  onStatusChange,
  revertAfter = 2000,
  pendingDelay = 0,
  onSuccess,
  onError,
}: UseActionOptions) {
  const [internalStatus, setInternalStatus] = useState<ActionStatus>("idle");
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const status = controlledStatus ?? internalStatus;
  const held = status === "error" && (hovered || focused);
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clock = useRef<RevertClock | null>(null);
  const generation = useRef(0);
  const running = useRef(false);
  const alive = useRef(true);

  const clearTimers = useCallback(() => {
    clearTimeout(revertTimer.current ?? undefined);
    clearTimeout(pendingTimer.current ?? undefined);
    revertTimer.current = null;
    pendingTimer.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  const changeStatus = useCallback((next: ActionStatus) => {
    if (!alive.current) return;
    setInternalStatus(next);
    onStatusChange?.(next);
  }, [onStatusChange]);

  const outcomeDuration = typeof revertAfter === "number" ? revertAfter
    : status === "error" ? revertAfter.error ?? 2000 : revertAfter.success ?? 2000;
  const resetDuration = Number.isFinite(outcomeDuration) ? Math.max(0, outcomeDuration) : 2000;

  useEffect(() => {
    if (status !== "success" && status !== "error") {
      clock.current = null;
      return;
    }
    if (!clock.current || clock.current.status !== status || clock.current.duration !== resetDuration
      || clock.current.revision !== revision) {
      clock.current = { status, duration: resetDuration, revision, remaining: resetDuration };
    }
    // Hover and focus share one clock. Leaving one does not resume it while the other holds it.
    if (held || running.current) return;
    const current = clock.current;
    const started = Date.now();
    const timer = setTimeout(() => {
      if (!alive.current || running.current || clock.current !== current) return;
      changeStatus("idle");
    }, current.remaining);
    revertTimer.current = timer;
    return () => {
      clearTimeout(timer);
      current.remaining = Math.max(0, current.remaining - (Date.now() - started));
    };
  }, [status, resetDuration, revision, held, changeStatus]);

  const reset = useCallback(() => {
    generation.current += 1;
    running.current = false;
    clearTimers();
    clock.current = null;
    if (!alive.current) return;
    setError(undefined);
    setRevision(value => value + 1);
    changeStatus("idle");
  }, [clearTimers, changeStatus]);

  const run = useCallback(async () => {
    // The ref guards the delay window and same-tick presses, before React has rendered.
    if (!action || !alive.current || running.current || controlledStatus === "pending") return;
    const request = ++generation.current;
    running.current = true;
    clearTimers();
    clock.current = null;
    // Keep a previous rejection while pendingDelay still shows its error label.
    // The next outcome or an explicit reset replaces it.
    if (pendingDelay <= 0) {
      changeStatus("pending");
    } else {
      pendingTimer.current = setTimeout(() => {
        if (alive.current && running.current && generation.current === request) changeStatus("pending");
      }, pendingDelay);
    }

    let failed = false;
    let reason: unknown;
    try {
      await action();
    } catch (caught) {
      failed = true;
      reason = caught;
    }
    if (generation.current !== request) return;
    running.current = false;
    clearTimeout(pendingTimer.current ?? undefined);
    if (alive.current) {
      // Wrap arbitrary rejection values: a thrown function is data, not a React updater.
      setError(() => reason);
      setRevision(value => value + 1);
      changeStatus(failed ? "error" : "success");
    }
    if (failed) onError?.(reason);
    else onSuccess?.();
  }, [action, controlledStatus, pendingDelay, onSuccess, onError, changeStatus, clearTimers]);

  const buttonProps = {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return { status, error, run, reset, buttonProps };
}
