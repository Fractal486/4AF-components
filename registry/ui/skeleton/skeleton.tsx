import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A loading placeholder — a muted block that pulses while content loads. Size and shape it
 * with utilities (`h-4 w-2/3`, `size-12 rounded-full`) to trace the content it stands in for.
 *
 * The pulse is a looping indicator, so — like a spinner — reduced motion switches it off
 * (`motion-reduce:animate-none`): a static block still reads as "loading", whereas
 * collapsing the loop's duration would make it strobe. Not `"use client"`: it's a plain
 * styled div.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
