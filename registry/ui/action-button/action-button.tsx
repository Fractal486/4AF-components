"use client";

import { Check, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";

export type { ActionStatus };

export interface ActionButtonProps
  extends Omit<ButtonProps, "loading" | "children" | "asChild"> {
  /** The work. Return a promise and the button waits for it. */
  action: () => void | Promise<unknown>;
  /** The resting label. */
  children?: ReactNode;
  /** An icon shown beside the resting label. */
  icon?: ReactNode;
  /** Labels per state. Each falls back to the resting label. */
  labels?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
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
  labels,
  pendingMode = "label",
  revertAfter = 2000,
  pendingDelay = 0,
  announce,
  disabled,
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
  const labelled =
    Boolean(children) ||
    Boolean(labels && (labels.pending ?? labels.success ?? labels.error));
  // While idle, a label-only action still reserves the status glyph's width so its button
  // never resizes when it runs. That leading-only slot would otherwise push the visible
  // label to the right, so centre the idle label by half the reserved slot and gap. Once a
  // status glyph is visible, the icon-and-label group should be centred as a group.
  // Intentional icon-plus-label actions stay centred in every state.
  const labelOnlyOffset =
    !icon && labelled && status === "idle"
      ? size === "xs" || size === "sm"
        ? "-translate-x-2.5"
        : size === "icon-xs" || size === "icon-sm" || size === "icon" || size === "icon-lg"
          ? "-translate-x-2"
          : "-translate-x-3"
      : undefined;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        // Composed rather than owned outright, and taken off the spread below so nothing
        // can quietly replace it. A Base UI part that renders this button — a toolbar item,
        // a menu trigger — hands down its own click handling through the same prop, and
        // letting that land last meant the action simply never ran.
        onClick={(event) => {
          onClick?.(event);
          run();
        }}
        disabled={disabled || status === "pending"}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        data-pending-mode={pendingMode}
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
          <span
            className={cn(
              "inline-flex items-center gap-[inherit]",
              labelOnlyOffset,
              pendingIconOnly && "opacity-0",
            )}
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
                cursor is still on it, waiting. */}
            <Morph
              activeKey={glyphKey}
              items={{
                idle: icon,
                pending: <AsciiLoader />,
                success: <Check />,
                error: <TriangleAlert />,
              }}
            />
            {labelled && (
              <Morph
                activeKey={labelKey}
                items={{
                  idle: children,
                  pending: labels?.pending,
                  success: labels?.success,
                  error: labels?.error,
                }}
              />
            )}
          </span>

          {pendingMode === "icon" && (
            <span
              data-slot="action-button-pending-icon"
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 inline-grid place-items-center transition-[opacity] duration-(--duration-fast) ease-out",
                pendingIconOnly ? "opacity-100" : "opacity-0",
              )}
            >
              <AsciiLoader />
            </span>
          )}
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
