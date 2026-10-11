import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A loading placeholder — a muted block that pulses while content loads. Size and shape it
 * with utilities (`h-4 w-2/3`, `size-12 rounded-full`) to trace the content it stands in for.
 *
 * Square by default. A placeholder is standing in for content, not pretending to be a card, and
 * a radius here quietly became the shape of every text line in the library. Corners are opt-in:
 * `rounded-full` for an avatar, `rounded-lg` for a thumbnail.
 *
 * Reduced motion disables the pulse, leaving a static placeholder. No `"use client"`
 * directive is needed: this is a styled div.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
