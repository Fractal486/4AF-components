"use client";

import { useState, type ComponentProps } from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/registry/lib/cn";
import { skeletonContentVariants, skeletonTextLineVariants, skeletonTextVariants, skeletonVariants } from "./skeleton.variants";

export interface SkeletonProps extends useRender.ComponentProps<"div"> {
  /** When supplied, keeps children in layout while loading and reveals them when ready. */
  loading?: boolean;
}

/** A square-cornered pulsing placeholder, or a wrapper that preserves its children's size. */
export function Skeleton({ className, loading, render, ref, children, ...props }: SkeletonProps) {
  const [previous, setPrevious] = useState(loading);
  const [revealed, setRevealed] = useState(false);
  if (loading !== previous) {
    setPrevious(loading);
    setRevealed(previous === true && loading === false);
  }

  const wrapped = loading !== undefined;
  const pending = !wrapped || loading;
  return useRender({
    render,
    ref,
    props: {
      ...props,
      "data-slot": "skeleton",
      "data-state": pending ? "loading" : "ready",
      "data-loading": wrapped ? String(loading) : undefined,
      "data-wrapped": wrapped ? "" : undefined,
      "data-revealed": wrapped && !loading && revealed ? "" : undefined,
      "aria-hidden": wrapped ? props["aria-hidden"] : true,
      "aria-busy": wrapped && loading ? true : props["aria-busy"],
      inert: wrapped ? props.inert : true,
      className: cn(skeletonVariants(), className),
      children: wrapped ? (
        <span
          data-slot="skeleton-content"
          data-loading={loading ? "" : undefined}
          className={skeletonContentVariants()}
          inert={loading || undefined}
          aria-hidden={loading || undefined}
        >
          {children}
        </span>
      ) : children,
    },
  });
}

export interface SkeletonTextProps extends ComponentProps<"div"> {
  /** Number of placeholder lines, rounded down and clamped to 1–50. */
  lines?: number;
}

/** Text-sized placeholders follow the surrounding font size and line height. */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  const count = Math.min(50, Math.max(1, Math.floor(Number.isFinite(lines) ? lines : 1)));
  return (
    <div {...props} data-slot="skeleton-text" aria-hidden="true" inert className={cn(skeletonTextVariants(), className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-slot="skeleton-text-line" className={skeletonTextLineVariants()}>
          <Skeleton data-short={count > 1 && index === count - 1 ? "" : undefined} className="h-[0.8em] w-full data-[short]:w-3/5" />
        </div>
      ))}
    </div>
  );
}
