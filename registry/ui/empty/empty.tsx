import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { emptyMediaVariants, type EmptyMediaVariants } from "./empty.variants";

/**
 * An empty state — the placeholder for when there's nothing to show: no results, an empty
 * list, a fresh page. Compose it as a centred column — `EmptyMedia`, `EmptyTitle`,
 * `EmptyDescription`, then `EmptyContent` for an action. Purely presentational, so it's not
 * `"use client"`.
 *
 * Borderless by default; add `border` for the dashed placeholder outline (the container
 * already carries `border-dashed`, so whatever border width you add lands dashed).
 */
export function Empty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-xl border-dashed border-border p-6 text-center text-balance md:p-12",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
      {...props}
    />
  );
}

export function EmptyMedia({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & EmptyMediaVariants) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

export function EmptyTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function EmptyDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}
