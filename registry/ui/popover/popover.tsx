"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { usePopoverHeight } from "./popover.height";
import {
  popoverPopupVariants, popoverPositionerVariants, popoverHeaderVariants,
  popoverTitleVariants, popoverDescriptionVariants,
} from "./popover.variants";

/** Visibility, positioning, nested dismissal, and focus belong to Base UI. */
export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;
export const createPopoverHandle = BasePopover.createHandle;
export type PopoverProps<Payload = unknown> = BasePopover.Root.Props<Payload>;
export type PopoverHandle<Payload = unknown> = BasePopover.Handle<Payload>;
export type PopoverTriggerProps<Payload = unknown> = BasePopover.Trigger.Props<Payload>;

export type PopoverPortalProps = ComponentProps<typeof BasePopover.Portal>;
export function PopoverPortal(props: PopoverPortalProps) {
  return <BasePopover.Portal data-slot="popover-portal" {...props} />;
}

export type PopoverPositionerProps = ComponentProps<typeof BasePopover.Positioner>;
export function PopoverPositioner({ className, sideOffset = 6, collisionPadding = 8, ...props }: PopoverPositionerProps) {
  return <BasePopover.Positioner data-slot="popover-positioner" sideOffset={sideOffset}
    collisionPadding={collisionPadding} {...props}
    className={mergeStateClassName(popoverPositionerVariants(), className)} />;
}

export interface PopoverPopupProps extends ComponentProps<typeof BasePopover.Popup> {
  /** Smoothly follow content height. Disable when the caller owns the panel height. */
  autoSize?: boolean;
  /** Layout classes for the content inside the scroll viewport. */
  contentClassName?: string;
}

/** A measured surface; Scroll Area owns overflow, while Base UI owns focus and presence. */
export function PopoverPopup({ className, children, autoSize = true, contentClassName, ...props }: PopoverPopupProps) {
  const sizerRef = usePopoverHeight();
  return (
    <BasePopover.Popup data-slot="popover-content" data-popover-frame="" data-auto-size={autoSize ? "" : undefined}
      {...props} className={mergeStateClassName(popoverPopupVariants(), className)}>
      {/* Bleed the viewport into the panel padding so focus rings and button shadows
          do not get clipped or create a scrollbar when the content otherwise fits. */}
      <ScrollArea data-slot="popover-scroll-area" className="-m-1.5 min-h-0 min-w-0 flex-auto" viewportClassName="p-1.5">
        <div ref={autoSize ? sizerRef : undefined} data-slot="popover-content-sizer"
          className={cn("flow-root min-w-0 wrap-anywhere", contentClassName)}>
          {children}
        </div>
      </ScrollArea>
    </BasePopover.Popup>
  );
}

export interface PopoverContentProps extends PopoverPopupProps {
  /** Which side of the trigger to anchor to. */
  side?: PopoverPositionerProps["side"];
  /** Alignment along that side. */
  align?: PopoverPositionerProps["align"];
  /** Gap between trigger and panel, in px. */
  sideOffset?: PopoverPositionerProps["sideOffset"];
  /** Portal container, mounting behavior, ref, and other portal props. */
  portalProps?: Omit<PopoverPortalProps, "children">;
  /** Collision padding, anchor, sticky positioning, state classes, and other positioner props. */
  positionerProps?: Omit<PopoverPositionerProps, "side" | "align" | "sideOffset" | "children">;
}

/** Convenient portal + positioner + popup. Its ref and DOM props belong to the popup. */
export function PopoverContent({
  side = "bottom", align = "center", sideOffset = 6, portalProps, positionerProps, ...popupProps
}: PopoverContentProps) {
  return (
    <PopoverPortal {...portalProps}>
      <PopoverPositioner side={side} align={align} sideOffset={sideOffset} {...positionerProps}>
        <PopoverPopup {...popupProps} />
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="popover-header" {...props} className={cn(popoverHeaderVariants(), className)} />;
}

export function PopoverTitle({ className, ...props }: ComponentProps<typeof BasePopover.Title>) {
  return <BasePopover.Title data-slot="popover-title" {...props}
    className={mergeStateClassName(popoverTitleVariants(), className)} />;
}

export function PopoverDescription({ className, ...props }: ComponentProps<typeof BasePopover.Description>) {
  return <BasePopover.Description data-slot="popover-description" {...props}
    className={mergeStateClassName(popoverDescriptionVariants(), className)} />;
}
