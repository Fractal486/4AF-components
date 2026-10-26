"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A popover — an interactive panel anchored to a trigger.
 *
 * Behaviour, positioning and focus are Base UI's: it opens on click, flips to the
 * opposite side when it would overflow, moves focus into the panel and returns it to the
 * trigger on close, and dismisses on Escape or an outside click. Unlike a dialog it isn't
 * modal by default — the page behind stays live — which is the right default for a
 * lightweight editing surface. Pass `modal` to trap focus and scroll-lock.
 *
 * The enter is CSS, not Motion: a popover is a plain enter/exit with no physics or
 * gesture, so it rides Base UI's `data-starting-style` / `data-ending-style` attributes.
 * It scales up out of a blur from the edge nearest the trigger — Base UI hands us
 * `--transform-origin` pointing there — so it resolves into place rather than snapping in.
 * Base UI holds the popup mounted through the transition and unmounts on `transitionend`,
 * which fires because a `transition` is set.
 */

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

const popupClassName = cn(
  // Same floating-panel material as the Select panel: the trigger's border, plus the
  // ring-less overlay lift (shadow-overlay's hairline stacked on a real border reads as a
  // doubled, too-heavy edge).
  "z-50 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface-raised p-4 text-sm text-foreground shadow-overlay-drop outline-none",
  // Scale grows from the anchor side; `blur-0` is the resting filter so it interpolates
  // from blur(4px) rather than from `none`, which some browsers won't tween. Only these
  // properties change, so only these are named.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,translate,filter] duration-(--duration-fast) ease-out",
  // Hidden pose: fade, shrink, blur — and slide in from *toward* the trigger, so a panel
  // below its trigger drops down into place. Larger offset entering than leaving.
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
  "data-[side=top]:data-[starting-style]:translate-y-2 data-[side=top]:data-[ending-style]:translate-y-1",
  "data-[side=bottom]:data-[starting-style]:-translate-y-2 data-[side=bottom]:data-[ending-style]:-translate-y-1",
  "data-[side=left]:data-[starting-style]:translate-x-2 data-[side=left]:data-[ending-style]:translate-x-1",
  "data-[side=right]:data-[starting-style]:-translate-x-2 data-[side=right]:data-[ending-style]:-translate-x-1",
);

export interface PopoverContentProps
  extends Omit<ComponentProps<typeof BasePopover.Popup>, "className"> {
  className?: string;
  /** Which side of the trigger to anchor to. */
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  /** Alignment along that side. */
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  /** Gap between trigger and panel, in px. */
  sideOffset?: number;
  /** Forwarded to Base UI's positioner (collision padding, sticky, anchor, etc.). */
  positionerProps?: Omit<
    ComponentProps<typeof BasePopover.Positioner>,
    "side" | "align" | "sideOffset" | "children" | "className"
  >;
}

export function PopoverContent({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 6,
  positionerProps,
  ...props
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50 outline-none"
        {...positionerProps}
      >
        <BasePopover.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mb-3 flex flex-col gap-1", className)} {...props} />;
}

export function PopoverTitle({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Title>) {
  return (
    <BasePopover.Title
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Description>) {
  return (
    <BasePopover.Description
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}
