"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A tooltip.
 *
 * Behaviour, positioning and timing are Base UI's: it opens on hover *and* focus (a
 * mouse-only tooltip is invisible to keyboard users), flips to the opposite side when
 * it would overflow the viewport, wires `aria-describedby` from trigger to popup, and
 * — via the Provider — opens instantly once a neighbour has just closed, so sweeping a
 * toolbar doesn't re-wait the delay on every button.
 *
 * The enter is CSS, not Motion: a tooltip is a plain enter/exit with no physics or
 * gesture, so it rides Base UI's `data-starting-style` / `data-ending-style` attributes.
 * It scales up from the edge nearest the trigger — Base UI hands us `--transform-origin`
 * pointing there — with a brief blur, so it resolves into focus rather than snapping in.
 */

export const TooltipProvider = BaseTooltip.Provider;

const popupClassName = cn(
  // `bg-surface`: the same fill as an outline button at rest, so the tooltip reads as
  // the same material as the control it describes.
  "w-fit max-w-xs rounded-md bg-surface px-2.5 py-1",
  "text-xs font-medium text-pretty text-foreground",
  // A single faint 1px ring instead of shadow-overlay's heavier one, plus a soft drop
  // shadow. rgba, not oklch, so the `/` alpha can't trip Tailwind's arbitrary parser.
  "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.18)]",
  "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_14px_30px_-12px_rgba(0,0,0,0.6)]",
  // Scale grows from the anchor side; `blur-0` is the resting filter so it interpolates
  // from blur(5px) rather than from `none`, which some browsers won't tween. Only these
  // properties change, so only these are named. Base UI holds the popup mounted through
  // the transition and unmounts on transitionend; its `data-instant` state short-circuits
  // that transition when the provider moves directly between neighbouring triggers.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,translate,filter] duration-(--duration-fast) ease-out data-instant:transition-none",
  // Hidden pose: fade, shrink, blur — and slide in from *toward* the trigger, so a top
  // tooltip rises up from below into place rather than only scaling. Larger offset
  // entering than leaving.
  "data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:blur-[5px]",
  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
  "data-[side=top]:data-[starting-style]:translate-y-4 data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=bottom]:data-[starting-style]:-translate-y-4 data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-4 data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-4 data-[side=right]:data-[ending-style]:-translate-x-1",
);

export interface TooltipProps {
  /** The tooltip text. Empty content hides the popup without remounting the trigger. */
  content: ReactNode;
  /** The element the tooltip describes. Becomes the trigger. */
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Gap between trigger and tooltip, in px. */
  sideOffset?: number;
  /** How long to wait before opening, in milliseconds. */
  delay?: number;
  /** Whether pressing the trigger closes an open tooltip. */
  closeOnClick?: boolean;
  /** Controlled open state. Omit this for the default hover/focus behavior. */
  open?: boolean;
  /** Close as soon as the pointer leaves the trigger instead of entering the popup. */
  disableHoverablePopup?: boolean;
  /** Class for the popup. */
  className?: string;
  /** Forwarded to Base UI's positioner (collision padding, sticky, etc.). */
  positionerProps?: Omit<
    ComponentProps<typeof BaseTooltip.Positioner>,
    "side" | "align" | "sideOffset" | "children"
  >;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  delay,
  closeOnClick = true,
  open,
  disableHoverablePopup = false,
  className,
  positionerProps,
}: TooltipProps) {
  const empty = content == null || content === "";

  return (
    <BaseTooltip.Root open={open} disabled={empty} disableHoverablePopup={disableHoverablePopup}>
      <BaseTooltip.Trigger render={children} delay={delay} closeOnClick={closeOnClick} />
      {!empty && (
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            side={side}
            align={align}
            sideOffset={sideOffset}
            {...positionerProps}
            className={(state) => cn(
              "z-50 outline-none",
              typeof positionerProps?.className === "function"
                ? positionerProps.className(state)
                : positionerProps?.className,
            )}
          >
            <BaseTooltip.Popup className={cn(popupClassName, className)}>
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      )}
    </BaseTooltip.Root>
  );
}
