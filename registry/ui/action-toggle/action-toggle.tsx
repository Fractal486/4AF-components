"use client";

import { TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAction } from "@/registry/lib/use-action";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { Morph } from "@/registry/ui/morph/morph";
import { Toggle, type ToggleProps } from "@/registry/ui/toggle/toggle";

export interface ActionToggleProps
  extends Omit<ToggleProps, "pressed" | "defaultPressed" | "onPressedChange" | "children"> {
  /**
   * The work that has to succeed before the new state is real. It's handed the state
   * being moved *to*, so one function can serve both directions.
   */
  action: (pressed: boolean) => void | Promise<unknown>;
  /** Controlled state. Provide `onPressedChange` with it. */
  pressed?: boolean;
  /** Uncontrolled starting state. @default false */
  defaultPressed?: boolean;
  /** Called once the action has settled, never before. */
  onPressedChange?: (pressed: boolean) => void;
  /** The resting label, unpressed. */
  children?: ReactNode;
  /** The resting glyph, unpressed. */
  icon?: ReactNode;
  /** Labels for the other states. Each falls back to the label it's replacing. */
  labels?: { pressed?: ReactNode; pending?: ReactNode; error?: ReactNode };
  /** Glyphs for the other states. Pending and error default to the loader and the
      warning triangle. */
  icons?: { pressed?: ReactNode; pending?: ReactNode; error?: ReactNode };
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
 * A toggle whose state has to be earned: press it, it waits, and it lands — or it
 * doesn't, and nothing moved. Follow ⇄ Following, Subscribe ⇄ Subscribed, a setting that
 * isn't on until the server says so.
 *
 * **Why this isn't `ActionButton` with the revert switched off.** A button *does*
 * something and goes back to how it was; its whole model is idle → outcome → idle. This
 * *is* something afterwards, and the difference is `aria-pressed` — the same argument
 * that keeps `Toggle` from being a prop on `Button`. Base UI's Toggle owns that here.
 *
 * **And why it isn't optimistic.** Flipping the label immediately and rolling it back on
 * failure is the fashionable choice, but it can't be combined with a spinner: a control
 * that already says "Following" while a spinner insists it's still working is telling the
 * user two things at once, and one of them is a guess. So the label holds, the loader
 * runs, and the state changes when it's true. A failure needs no rollback because nothing
 * moved — it just says so and goes quiet.
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
  pressed,
  defaultPressed = false,
  onPressedChange,
  children,
  icon,
  labels,
  icons,
  revertAfter,
  pendingDelay,
  announce,
  disabled,
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

  const { status, run } = useAction({
    action: () => action(target),
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

  // `success` deliberately shows the resting content: the control having *become*
  // Following is the confirmation, and a tick on top of that would be a second one.
  const key = status === "pending" || status === "error" ? status : current ? "on" : "off";
  const restingLabel = current ? (labels?.pressed ?? children) : children;

  return (
    <Toggle
      pressed={current}
      onPressedChange={run}
      disabled={disabled || status === "pending"}
      aria-busy={status === "pending" || undefined}
      data-status={status}
      variant={variant}
      size={size}
      {...props}
    >
      {/* Every state at once, so the control reserves the width of the widest and holds
          still. "Follow" and "Following" are different widths, and a button that resizes
          as it lands moves out from under the cursor that's still resting on it. */}
      <Morph
        activeKey={key}
        className="gap-2"
        items={{
          off: <Content icon={icon}>{children}</Content>,
          on: <Content icon={icons?.pressed ?? icon}>{labels?.pressed ?? children}</Content>,
          pending: (
            <Content icon={icons?.pending ?? <AsciiLoader />}>
              {labels?.pending ?? restingLabel}
            </Content>
          ),
          error: (
            <Content icon={icons?.error ?? <TriangleAlert />}>
              {labels?.error ?? restingLabel}
            </Content>
          ),
        }}
      />

      {/* `aria-pressed` announces the landing on its own. What it can't say is that the
          control is working, or that the press didn't take. */}
      <span aria-live="polite" className="sr-only">
        {status === "pending" && (announce?.pending ?? "Working")}
        {status === "error" && (announce?.error ?? "Something went wrong")}
      </span>
    </Toggle>
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
