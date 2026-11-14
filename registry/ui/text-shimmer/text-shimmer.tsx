import type { ComponentPropsWithRef, CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { textShimmerVariants } from "./text-shimmer.variants";

type TextShimmerOwnProps<E extends ElementType> = {
  children: ReactNode;
  /** The element to render. Defaults to a span. */
  as?: E;
  /** Sweep duration in seconds. Invalid or non-positive values use 2.5 seconds. */
  duration?: number;
  /** Run a single sweep and leave ordinary text afterwards. */
  once?: boolean;
  /** Turn the shimmer on or off without replacing the element. */
  active?: boolean;
};

export type TextShimmerProps<E extends ElementType = "span"> = TextShimmerOwnProps<E>
  & Omit<ComponentPropsWithRef<E>, keyof TextShimmerOwnProps<E>>;

/**
 * A CSS-only, color-aware sweep over one accessible copy of the text.
 * The theme moves a masked overlay with translate, keeping glyphs out of per-frame paint.
 * The cycle stays independent of motion duration tokens; reduced motion removes the effect.
 */
export function TextShimmer<E extends ElementType = "span">({
  children,
  as,
  duration = 2.5,
  once = false,
  active = true,
  className,
  style,
  ...props
}: TextShimmerProps<E>) {
  const Comp: ElementType = as ?? "span";
  const cycle = Number.isFinite(duration) && duration > 0 ? duration : 2.5;
  return (
    <Comp
      {...props}
      data-slot="text-shimmer"
      data-active={active ? "true" : "false"}
      data-once={once ? "" : undefined}
      style={{ "--text-shimmer-duration": cycle + "s", ...style } as CSSProperties}
      className={cn(textShimmerVariants(), className)}
    >
      {children}
    </Comp>
  );
}
