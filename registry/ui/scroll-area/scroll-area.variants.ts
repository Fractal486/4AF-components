import { cva, type VariantProps } from "class-variance-authority";

/**
 * The root only clips: Base UI positions it and the scrollbars itself. It is a flex column so a
 * `max-h-*` cap works as well as a fixed height: the viewport shrinks to the root instead of
 * needing a definite height to resolve `100%` against.
 */
export const scrollAreaVariants = cva("flex min-h-0 min-w-0 flex-col overflow-hidden");

/**
 * The scrolling element. It is focusable while it overflows, so it carries an inset ring: an
 * outset one would be clipped by the root.
 *
 * Overscroll is contained per axis, and only on an axis that overflows. Base UI makes the
 * viewport a scroll container on both axes (`overflow: scroll`), and a browser can apply
 * `overscroll-behavior` even to a scroll container with nothing to scroll: a blanket `contain`
 * would stop the wheel over a short code block or an unfilled panel from ever reaching the
 * page or pane around it.
 *
 * `fade` masks the edges with content beyond them. Base UI publishes each edge's remaining
 * scroll distance as `--scroll-area-overflow-*`, and the fade is the smaller of that and
 * `--scroll-area-fade`, so it grows in as the content leaves an edge and needs no transition.
 * The two axes are separate mask layers, intersected; an axis with no overflow stays opaque.
 * The top fade starts at `--scroll-area-inset-top`, so a pinned header above it stays opaque.
 * Logical `x` edges flip under RTL, where the start edge is on the right.
 */
export const scrollAreaViewportVariants = cva(
  [
    "min-h-0 w-full flex-auto rounded-[inherit] outline-none",
    "data-[has-overflow-x]:overscroll-x-contain data-[has-overflow-y]:overscroll-y-contain",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
  ],
  {
    variants: {
      fade: {
        true: [
          "[--scroll-area-fade:1.75rem] [mask-composite:intersect]",
          "[mask-image:linear-gradient(to_bottom,black_var(--scroll-area-inset-top,0px),transparent_var(--scroll-area-inset-top,0px),black_calc(var(--scroll-area-inset-top,0px)_+_min(var(--scroll-area-overflow-y-start,0px),var(--scroll-area-fade))),black_calc(100%_-_min(var(--scroll-area-overflow-y-end,0px),var(--scroll-area-fade))),transparent),linear-gradient(to_right,transparent,black_min(var(--scroll-area-overflow-x-start,0px),var(--scroll-area-fade)),black_calc(100%_-_min(var(--scroll-area-overflow-x-end,0px),var(--scroll-area-fade))),transparent)]",
          "rtl:[mask-image:linear-gradient(to_bottom,black_var(--scroll-area-inset-top,0px),transparent_var(--scroll-area-inset-top,0px),black_calc(var(--scroll-area-inset-top,0px)_+_min(var(--scroll-area-overflow-y-start,0px),var(--scroll-area-fade))),black_calc(100%_-_min(var(--scroll-area-overflow-y-end,0px),var(--scroll-area-fade))),transparent),linear-gradient(to_left,transparent,black_min(var(--scroll-area-overflow-x-start,0px),var(--scroll-area-fade)),black_calc(100%_-_min(var(--scroll-area-overflow-x-end,0px),var(--scroll-area-fade))),transparent)]",
        ],
        false: "",
      },
    },
    defaultVariants: { fade: false },
  },
);

/**
 * A 10px hit area holding a 5px rail and thumb, 3px from the area's outer edge. The rail is a
 * pseudo-element inset by the same padding, so it runs the scrollbar's full length behind the
 * thumb. Base UI mounts a
 * scrollbar only while its axis overflows and sets `data-hovering` while the pointer is over
 * the area and `data-scrolling` while it scrolls (it lingers briefly after the last scroll).
 *
 * The vertical bar starts `--scroll-area-inset-top` below the root's top edge (0 by default), so
 * a caller with a pinned header can keep the bar to the part that scrolls. A margin rather than
 * `top`, which Base UI sets inline; Base UI sizes the thumb from the bar's resulting height.
 *
 * `auto` keeps the bar hidden until one of those, so it overlays the content without taking
 * room from it; touch has no hover, so there it shows only while scrolling. It appears on the
 * fast token and leaves on the slow one.
 */
export const scrollAreaScrollbarVariants = cva(
  [
    "flex touch-none p-0.5 select-none",
    "data-[orientation=vertical]:w-[10px] data-[orientation=vertical]:pe-[3px]",
    "data-[orientation=vertical]:mt-[var(--scroll-area-inset-top,0px)]",
    "data-[orientation=horizontal]:h-[10px] data-[orientation=horizontal]:pb-[3px] data-[orientation=horizontal]:flex-col",
    "before:absolute before:inset-0.5 data-[orientation=vertical]:before:end-[3px] data-[orientation=horizontal]:before:bottom-[3px] before:rounded-full before:bg-neutral-200 dark:before:bg-neutral-950",
  ],
  {
    variants: {
      scrollbar: {
        auto: [
          "opacity-0 transition-[opacity] duration-(--duration-slow) ease-out",
          "data-[hovering]:opacity-100 data-[hovering]:duration-(--duration-fast)",
          "data-[scrolling]:opacity-100 data-[scrolling]:duration-(--duration-fast)",
        ],
        always: "",
      },
    },
    defaultVariants: { scrollbar: "auto" },
  },
);

/**
 * Base UI sizes the thumb along its axis; the cross axis fills the track. `relative` lifts it
 * over the rail. Fixed ramp steps in dark mode: the text greys read too bright there for
 * something that sits over content.
 */
export const scrollAreaThumbVariants = cva(
  [
    "relative rounded-full bg-subtle-foreground dark:bg-neutral-800",
    "data-[orientation=vertical]:w-full data-[orientation=horizontal]:h-full",
  ],
);

export type ScrollAreaVariants = VariantProps<typeof scrollAreaViewportVariants> &
  VariantProps<typeof scrollAreaScrollbarVariants>;
