import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
// Not from `slot`: that module is client-only, and a Server Component can't call its
// exports. Rendering `Slot` is fine; calling `useSlotChild` from there is not.
import { useSlotChild } from "@/registry/lib/slot-child";
import {
  classicLoaderVariants,
  type ClassicLoaderVariants,
} from "./classic-loader.variants";

export type ClassicLoaderSize = NonNullable<ClassicLoaderVariants["size"]>;

type ClassicLoaderStyle = CSSProperties & {
  "--classic-cycle"?: string;
};

export interface ClassicLoaderProps extends Omit<ComponentProps<"span">, "children"> {
  /** Render onto a single empty child element instead of a span. */
  asChild?: boolean;
  children?: ReactElement;
  /** sm: 16px, md: 20px, lg: 32px. Utilities can override the dimensions. */
  size?: ClassicLoaderSize;
  /** Playback multiplier: 1 is normal, 2 is twice as fast, 0.5 is half speed. */
  speed?: number;
  /** Omit when nearby text already announces the busy state. */
  label?: string;
}

/**
 * The bars, as SVG in a 100-unit box, each rotated about the exact centre: 24 long,
 * 8 thick, running from 23 to 47 units out — upstream's proportions.
 *
 * Upstream lays them out with CSS (`left: -10%` on a 24%-wide bar, then rotate and
 * translate), which centres the ring 2% right of the box, so the right bar sits at the
 * edge and gets clipped in a tight container. And the right bar is the only one at
 * `rotate(0deg)`: the browser treats it as a plain translation and snaps it to whole
 * pixels, so at sizes where 8% is fractional (1.6px at md) it renders thicker than the
 * rest. SVG rasterizes every angle the same way and the ring is centred by construction.
 */
const BARS = Array.from({ length: 12 }, (_, index) => (
  <rect
    key={index}
    x={73}
    y={46}
    width={24}
    height={8}
    rx={4}
    transform={`rotate(${index * 30} 50 50)`}
    style={{
      // Negative delays give the first rendered frame the complete fading trail.
      animationDelay: `calc(var(--classic-cycle, 1.2s) * (${index} - 12) / 12)`,
    }}
  />
));

/** CSS-only radial status indicator. Its opacity loop keeps its own duration under reduced motion. */
export const ClassicLoader = forwardRef<HTMLElement, ClassicLoaderProps>(
  function ClassicLoader(
    {
      asChild = false,
      children: childrenProp,
      className,
      speed = 1,
      label,
      size = "md",
      style,
      ...props
    },
    ref,
  ) {
    const children = useSlotChild(childrenProp) as ReactElement | undefined;
    const Root = asChild ? Slot : "span";
    const playbackSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1;
    const cycle = 1.2 / playbackSpeed;
    const content = (
      <svg data-slot="classic-loader-inner" viewBox="0 0 100 100" aria-hidden="true">
        {BARS}
      </svg>
    );

    if (asChild && !isValidElement(children)) {
      throw new Error("ClassicLoader asChild expects a single empty React element.");
    }

    return (
      <Root
        ref={ref}
        data-slot="classic-loader"
        data-variant="classic"
        data-size={size}
        data-state="loading"
        data-loading="true"
        className={cn(classicLoaderVariants({ size }), className)}
        style={{
          "--classic-cycle": `${cycle}s`,
          ...style,
        } as ClassicLoaderStyle}
        role={label ? "status" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        {...props}
      >
        {asChild ? cloneElement(children!, undefined, content) : content}
      </Root>
    );
  },
);

ClassicLoader.displayName = "ClassicLoader";
