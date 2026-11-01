"use client";

import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
import {
  emptyVariants,
  emptyHeaderVariants,
  emptyMediaVariants,
  emptyTitleVariants,
  emptyDescriptionVariants,
  emptyContentVariants,
  type EmptyMediaVariants,
} from "./empty.variants";

export interface EmptyPartProps extends useRender.ComponentProps<"div"> {
  /** Apply the part's props to its single child. Takes precedence over render. */
  asChild?: boolean;
}

export interface EmptyProps extends EmptyPartProps {
  /** Compact spacing, media, and typography, or the original responsive layout. */
  size?: "sm" | "md";
  /** Fade the media, title, description, and actions upward in sequence on mount. */
  animated?: boolean;
}

/** A composable empty state. Add className="border" for a dashed outline. */
export function Empty({
  className, size = "md", animated = true, asChild = false, render, ref, ...props
}: EmptyProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...props,
      "data-slot": "empty",
      "data-size": size,
      "data-animated": animated ? "" : undefined,
      className: cn(emptyVariants({ size }), className),
    },
  });
}

export function EmptyHeader({ className, asChild = false, render, ref, ...props }: EmptyPartProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: { ...props, "data-slot": "empty-header", className: cn(emptyHeaderVariants(), className) },
  });
}

export type EmptyMediaProps = EmptyPartProps & EmptyMediaVariants;

export function EmptyMedia({
  className, variant = "default", asChild = false, render, ref, ...props
}: EmptyMediaProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...props,
      "data-slot": "empty-media",
      "data-variant": variant,
      className: cn(emptyMediaVariants({ variant }), className),
    },
  });
}

export function EmptyTitle({ className, asChild = false, render, ref, ...props }: EmptyPartProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: { ...props, "data-slot": "empty-title", className: cn(emptyTitleVariants(), className) },
  });
}

export function EmptyDescription({ className, asChild = false, render, ref, ...props }: EmptyPartProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: { ...props, "data-slot": "empty-description", className: cn(emptyDescriptionVariants(), className) },
  });
}

export function EmptyContent({ className, asChild = false, render, ref, ...props }: EmptyPartProps) {
  return useRender({
    render: asChild ? <Slot /> : render,
    ref,
    props: { ...props, "data-slot": "empty-content", className: cn(emptyContentVariants(), className) },
  });
}
