"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, Ref } from "react";
import { cn } from "@/registry/lib/cn";
import {
  scrollAreaScrollbarVariants,
  scrollAreaThumbVariants,
  scrollAreaVariants,
  scrollAreaViewportVariants,
  type ScrollAreaVariants,
} from "./scroll-area.variants";

/**
 * A scroll container that draws its own scrollbar.
 *
 * Base UI's Scroll Area: the viewport still scrolls natively (wheel, touch, keyboard, momentum)
 * with the browser's scrollbar hidden, and a track and thumb are rendered in its place, so the
 * bar looks the same in every browser and overlays the content instead of taking width from it.
 * Scrollbars mount only for an axis that overflows.
 *
 * Give the root a size; the viewport fills it. `orientation` picks which axes get a scrollbar,
 * `scrollbar` whether they stay visible or show only on hover and scroll, and `fade` masks the
 * edges that have content beyond them.
 */

export interface ScrollAreaProps
  extends Omit<ComponentProps<typeof BaseScrollArea.Root>, "className">,
    ScrollAreaVariants {
  className?: string;
  /** Which axes scroll. Defaults to vertical. */
  orientation?: "vertical" | "horizontal" | "both";
  /** Extra classes for the viewport, the element that scrolls. */
  viewportClassName?: string;
  /** The viewport, for reading or setting the scroll position. */
  viewportRef?: Ref<HTMLDivElement>;
  /**
   * Other viewport props. `render` makes another part the scrolling element, such as a list
   * primitive that must own the scroll; `tabIndex={-1}` keeps the viewport out of the tab order
   * in a widget that scrolls with arrow keys.
   */
  viewportProps?: Omit<ComponentProps<typeof BaseScrollArea.Viewport>, "className" | "ref">;
}

export function ScrollArea({
  orientation = "vertical",
  scrollbar,
  fade,
  className,
  viewportClassName,
  viewportRef,
  viewportProps,
  children,
  ...props
}: ScrollAreaProps) {
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  return (
    <BaseScrollArea.Root
      data-orientation={orientation}
      data-scrollbar={scrollbar ?? "auto"}
      className={cn(scrollAreaVariants(), className)}
      {...props}
    >
      <BaseScrollArea.Viewport
        {...viewportProps}
        ref={viewportRef}
        className={cn(scrollAreaViewportVariants({ fade }), viewportClassName)}
      >
        {/* Content is sized to fit its children, so a wide child overflows horizontally
            rather than being squeezed to the viewport. Only when that axis scrolls. */}
        {horizontal ? <BaseScrollArea.Content>{children}</BaseScrollArea.Content> : children}
      </BaseScrollArea.Viewport>
      {vertical && <ScrollAreaScrollbar orientation="vertical" scrollbar={scrollbar} />}
      {horizontal && <ScrollAreaScrollbar orientation="horizontal" scrollbar={scrollbar} />}
      {vertical && horizontal && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  );
}

export interface ScrollAreaScrollbarProps
  extends Omit<ComponentProps<typeof BaseScrollArea.Scrollbar>, "className">,
    Pick<ScrollAreaVariants, "scrollbar"> {
  className?: string;
  /** Extra classes for the thumb. */
  thumbClassName?: string;
}

/** One scrollbar and its thumb. `ScrollArea` renders these; export for custom compositions. */
export function ScrollAreaScrollbar({
  scrollbar,
  className,
  thumbClassName,
  ...props
}: ScrollAreaScrollbarProps) {
  return (
    <BaseScrollArea.Scrollbar
      className={cn(scrollAreaScrollbarVariants({ scrollbar }), className)}
      {...props}
    >
      <BaseScrollArea.Thumb className={cn(scrollAreaThumbVariants(), thumbClassName)} />
    </BaseScrollArea.Scrollbar>
  );
}
