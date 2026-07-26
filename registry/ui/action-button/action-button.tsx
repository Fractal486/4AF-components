"use client";

import { Check, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";

export type { ActionStatus };

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
  const { status, run } = useAction({
    action,
    revertAfter,
    pendingDelay,
    onSuccess,
    onError,
  });

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
              <Content icon={<AsciiLoader />}>{label(labels?.pending)}</Content>
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
