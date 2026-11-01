"use client";

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentProps, ReactNode } from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { usePopupHeight } from "@/registry/lib/use-popup-height";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { useHoverCardSideLock } from "./hover-card.position";
import { hoverCardPopupVariants, hoverCardPositionerVariants, hoverCardSkeletonVariants } from "./hover-card.variants";

/** A supplemental preview. Base UI owns hover/focus timing, pointer travel, and dismissal. */
export const HoverCard = BasePreviewCard.Root;
export const HoverCardTrigger = BasePreviewCard.Trigger;
export const createHoverCardHandle = BasePreviewCard.createHandle;
export type HoverCardProps<Payload = unknown> = BasePreviewCard.Root.Props<Payload>;
export type HoverCardTriggerProps<Payload = unknown> = BasePreviewCard.Trigger.Props<Payload>;
export type HoverCardHandle<Payload = unknown> = BasePreviewCard.Handle<Payload>;

export interface HoverCardSkeletonProps extends ComponentProps<"div"> {
  /** Keeps the avatar placeholder when the preview represents a profile or author. */
  showAvatar?: boolean;
}

export function HoverCardSkeleton({ className, showAvatar = true, ...props }: HoverCardSkeletonProps) {
  return (
    <div data-slot="hover-card-skeleton" aria-hidden="true" {...props} className={cn(hoverCardSkeletonVariants(), className)}>
      {showAvatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export type HoverCardPortalProps = ComponentProps<typeof BasePreviewCard.Portal>;
export function HoverCardPortal(props: HoverCardPortalProps) {
  return <BasePreviewCard.Portal data-slot="hover-card-portal" {...props} />;
}

export interface HoverCardPositionerProps extends ComponentProps<typeof BasePreviewCard.Positioner> {
  /** Keep the initially resolved side until the card closes. @default true */
  lockSide?: boolean;
}

export function HoverCardPositioner({
  className, ref, side = "bottom", sideOffset = 6, collisionPadding = 8,
  collisionAvoidance, lockSide = true, ...props
}: HoverCardPositionerProps) {
  const { ref: lockRef, lockedSide } = useHoverCardSideLock(side, lockSide);
  const mergedRef = useMergedRefs(lockRef, ref);
  return (
    <BasePreviewCard.Positioner data-slot="hover-card-positioner" data-side-locked={lockedSide ? "" : undefined}
      {...props} ref={mergedRef} side={lockedSide ?? side} sideOffset={sideOffset} collisionPadding={collisionPadding}
      collisionAvoidance={lockedSide ? { ...collisionAvoidance, side: "none", fallbackAxisSide: "none" } : collisionAvoidance}
      className={mergeStateClassName(hoverCardPositionerVariants(), className)} />
  );
}

export interface HoverCardPopupProps extends ComponentProps<typeof BasePreviewCard.Popup> {
  /** Shows a loading placeholder instead of the preview while its data is pending. */
  loading?: boolean;
  /** Optional custom placeholder; defaults to HoverCardSkeleton. */
  loadingContent?: ReactNode;
  /** Smoothly follow content height. Disable when the caller owns the height. @default true */
  autoSize?: boolean;
  /** Layout classes for the content inside the scroll viewport. */
  contentClassName?: string;
}

export function HoverCardPopup({
  className, children, loading = false, loadingContent, autoSize = true, contentClassName, ...props
}: HoverCardPopupProps) {
  const sizerRef = usePopupHeight("[data-hover-card-frame]");
  return (
    <BasePreviewCard.Popup data-slot="hover-card-content" data-hover-card-frame="" {...props}
      className={mergeStateClassName(hoverCardPopupVariants(), className)}
      data-auto-size={autoSize ? "" : undefined} data-loading={loading || undefined} aria-busy={loading || undefined}>
      {/* The viewport extends into the padding so text and shadows retain their breathing room. */}
      <ScrollArea data-slot="hover-card-scroll-area" className="-m-1.5 min-h-0 min-w-0 flex-auto" viewportClassName="p-1.5">
        <div ref={autoSize ? sizerRef : undefined} data-slot="hover-card-body"
          className={cn("flow-root min-w-0 wrap-anywhere", contentClassName)}>
          {loading ? (loadingContent ?? <HoverCardSkeleton />) : children}
        </div>
      </ScrollArea>
    </BasePreviewCard.Popup>
  );
}

export interface HoverCardContentProps extends HoverCardPopupProps {
  side?: HoverCardPositionerProps["side"];
  align?: HoverCardPositionerProps["align"];
  sideOffset?: HoverCardPositionerProps["sideOffset"];
  /** Keep the initially resolved side while content changes. @default true */
  lockSide?: boolean;
  /** Portal container, mounting behavior, ref, and other portal props. */
  portalProps?: Omit<HoverCardPortalProps, "children">;
  /** Collision handling, anchor tracking, refs, and state-based positioner classes. */
  positionerProps?: Omit<HoverCardPositionerProps, "side" | "align" | "sideOffset" | "lockSide" | "children">;
}

/** Convenience composition; refs, render, and DOM props belong to the popup. */
export function HoverCardContent({
  side = "bottom", align = "center", sideOffset = 6, lockSide = true, portalProps, positionerProps, ...popupProps
}: HoverCardContentProps) {
  return (
    <HoverCardPortal {...portalProps}>
      <HoverCardPositioner side={side} align={align} sideOffset={sideOffset} lockSide={lockSide} {...positionerProps}>
        <HoverCardPopup {...popupProps} />
      </HoverCardPositioner>
    </HoverCardPortal>
  );
}
