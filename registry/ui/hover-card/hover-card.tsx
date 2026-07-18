"use client";

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A hover card — a rich preview of what's behind a link, for sighted pointer users.
 *
 * Behaviour, positioning and timing are Base UI's PreviewCard: it opens on hover *and*
 * focus after a short delay, stays open while the pointer travels the gap between trigger
 * and card, flips at the viewport edge, and closes on a close-delay so a jittery cursor
 * doesn't flicker it. It's a preview, not a control — it holds no focus trap and isn't
 * modal, and it's purely an enhancement (a touch or keyboard user follows the link
 * itself), so nothing essential lives only inside it.
 *
 * The enter is CSS, not Motion: a hover card is a plain enter/exit with no physics or
 * gesture, so it rides Base UI's `data-starting-style` / `data-ending-style`. It scales up
 * out of a blur from the edge nearest the trigger — Base UI hands us `--transform-origin`
 * pointing there. Base UI holds the popup mounted through the transition and unmounts on
 * `transitionend`, which fires because a `transition` is set.
 */

export const HoverCard = BasePreviewCard.Root;
export const HoverCardTrigger = BasePreviewCard.Trigger;

const popupClassName = cn(
  // The same floating-panel material as the Popover and Select panels: the border, plus
  // the ring-less overlay lift (shadow-overlay's hairline over a real border reads as a
  // doubled edge).
  "z-50 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-background p-4 text-sm text-foreground shadow-overlay-drop outline-none",
  // Scale grows from the anchor side; `blur-0` is the resting filter so it interpolates
  // from blur(4px) rather than from `none`, which some browsers won't tween. Only these
  // properties change, so only these are named.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,translate,filter] duration-(--duration-fast) ease-out",
  // Hidden pose: fade, shrink, blur — and slide in from *toward* the trigger. Larger
  // offset entering than leaving.
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
  "data-[side=top]:data-[starting-style]:translate-y-2 data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=bottom]:data-[starting-style]:-translate-y-2 data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-2 data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-2 data-[side=right]:data-[ending-style]:-translate-x-1",
);

export interface HoverCardContentProps
  extends Omit<ComponentProps<typeof BasePreviewCard.Popup>, "className"> {
  className?: string;
  /** Which side of the trigger to anchor to. */
  side?: ComponentProps<typeof BasePreviewCard.Positioner>["side"];
  /** Alignment along that side. */
  align?: ComponentProps<typeof BasePreviewCard.Positioner>["align"];
  /** Gap between trigger and card, in px. */
  sideOffset?: number;
  /** Forwarded to Base UI's positioner (collision padding, sticky, anchor, etc.). */
  positionerProps?: Omit<
    ComponentProps<typeof BasePreviewCard.Positioner>,
    "side" | "align" | "sideOffset" | "children" | "className"
  >;
}

export function HoverCardContent({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 6,
  positionerProps,
  ...props
}: HoverCardContentProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50 outline-none"
        {...positionerProps}
      >
        <BasePreviewCard.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
