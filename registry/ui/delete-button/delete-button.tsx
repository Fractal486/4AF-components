"use client";

import { Check, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { buttonContentGap } from "@/registry/ui/button/button.variants";
import { Morph } from "@/registry/ui/morph/morph";

/**
 * A destructive button that asks first, in place.
 *
 * The press arms it, and the button becomes its own confirmation — no dialog, no second
 * control appearing beside it. That's the right shape when the action is small and
 * reversible-ish (remove a row, drop a tag); reach for AlertDialog when the consequence
 * needs a sentence to explain.
 *
 * Morph does the swap, and it's handed both states at once so the button reserves the
 * width of the wider one and never resizes. That matters more here than anywhere else:
 * the cursor is already on the button, waiting to press again, and a button that grows
 * under a resting cursor moves the target out from under it.
 *
 * Three ways out, because arming something destructive and then being stuck with it is
 * its own kind of alarming: Escape, moving focus away, and a timeout.
 */

/**
 * A double-click lands two presses in a few dozen milliseconds. Without this the first
 * arms and the second confirms, and the whole point of the component — that deleting
 * takes two deliberate acts — is gone in one gesture. Presses inside the window are
 * dropped rather than queued: the button is already showing "Confirm", so the user gets
 * the pause they were owed.
 */
const DOUBLE_PRESS_GUARD = 350;

export interface DeleteButtonProps
  extends Omit<
    ButtonProps,
    "variant" | "children" | "onClick" | "asChild" | "loading"
  > {
  /**
   * Which quiet Button variant carries it — a bordered chip, a hover-only button, or bare
   * text. Never the solid `destructive` fill: red is the signal here, and a button that is
   * already entirely red has nowhere left to escalate when it arms.
   */
  variant?: "outline" | "ghost" | "plain";
  /** The resting label. */
  children?: ReactNode;
  /** The armed label. */
  confirmLabel?: ReactNode;
  icon?: ReactNode;
  confirmIcon?: ReactNode;
  /** Runs on the confirming press — never on the arming one. */
  onDelete?: () => void;
  armed?: boolean;
  defaultArmed?: boolean;
  onArmedChange?: (armed: boolean) => void;
  /** How long an armed button waits before disarming itself, in ms. `0` never does. */
  resetAfter?: number;
  /** Announced when the button arms. A state change nobody can see is one they don't know about. */
  announce?: string;
}

export function DeleteButton({
  variant = "outline",
  children = "Delete",
  confirmLabel = "Confirm",
  icon = <Trash2 />,
  confirmIcon = <Check />,
  onDelete,
  armed,
  defaultArmed = false,
  onArmedChange,
  resetAfter = 3000,
  announce = "Press again to confirm",
  size,
  className,
  onKeyDown,
  onBlur,
  ...props
}: DeleteButtonProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultArmed);
  const isControlled = armed !== undefined;
  const isArmed = isControlled ? armed : uncontrolled;
  const contentGap = buttonContentGap({ size: size ?? "md" });
  const armedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setArmed = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onArmedChange?.(next);
    },
    [isControlled, onArmedChange],
  );

  // Re-armed presses restart the clock, and the timer is dropped on unmount so a pending
  // disarm can't land on a component that's gone.
  useEffect(() => {
    clearTimeout(timer.current ?? undefined);
    if (!isArmed || resetAfter <= 0) return;
    timer.current = setTimeout(() => setArmed(false), resetAfter);
    return () => clearTimeout(timer.current ?? undefined);
  }, [isArmed, resetAfter, setArmed]);

  const handleClick = () => {
    if (!isArmed) {
      armedAt.current = Date.now();
      setArmed(true);
      return;
    }
    if (Date.now() - armedAt.current < DOUBLE_PRESS_GUARD) return;
    setArmed(false);
    onDelete?.();
  };

  return (
    <>
      <Button
        // A quiet variant carrying red text, rather than the solid destructive fill: a
        // delete sitting in a row or a toolbar shouldn't be the loudest thing on screen.
        // `hover:text-destructive` is pinned because `ghost` moves its text to
        // `foreground` on hover, which would drop the red exactly when the pointer is on
        // the button and the colour matters most.
        variant={variant}
        size={size}
        className={cn("text-destructive hover:text-destructive", className)}
        onClick={handleClick}
        onKeyDown={(event) => {
          // Escape is what people already reach for to back out, and the button has
          // focus at this point, so it's the cheapest exit available.
          if (event.key === "Escape" && isArmed) {
            event.preventDefault();
            setArmed(false);
          }
          onKeyDown?.(event);
        }}
        onBlur={(event) => {
          // Leaving a primed destructive button behind — in a row that scrolls away, or
          // a form the user has moved on from — is exactly how it gets pressed by
          // accident later.
          if (isArmed) setArmed(false);
          onBlur?.(event);
        }}
        data-armed={isArmed || undefined}
        {...props}
      >
        <Morph
          activeKey={isArmed ? "armed" : "idle"}
          items={{
            idle: <Content gap={contentGap} icon={icon}>{children}</Content>,
            armed: <Content gap={contentGap} icon={confirmIcon}>{confirmLabel}</Content>,
          }}
        />
      </Button>

      {/* The visible change is a swapped word inside a button that already had focus,
          which screen readers won't otherwise report. */}
      <span aria-live="polite" className="sr-only">
        {isArmed && announce}
      </span>
    </>
  );
}

function Content({ gap, icon, children }: { gap: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <span data-slot="delete-button-content" className={cn("inline-flex items-center", gap)}>
      {icon}
      {children}
    </span>
  );
}
