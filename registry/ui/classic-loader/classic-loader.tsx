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
import {
  classicLoaderVariants,
  type ClassicLoaderVariants,
} from "./classic-loader.variants";

/**
 * Adapted from loading.dev's Classic spinner:
 * https://github.com/jakubkrehel/loading/blob/d536a7459b2fdc99d09a03d79f7895ee0e6ff38a/src/classic.tsx
 *
 * MIT License
 * Copyright (c) 2026 Jakub Krehel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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

const BARS = Array.from({ length: 12 }, (_, index) => (
  <i
    key={index}
    aria-hidden="true"
    style={{
      transform: `rotate(${index * 30}deg) translate(146%)`,
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
      children,
      className,
      speed = 1,
      label,
      size = "md",
      style,
      ...props
    },
    ref,
  ) {
    const Root = asChild ? Slot : "span";
    const playbackSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1;
    const cycle = 1.2 / playbackSpeed;
    const content = (
      <span data-slot="classic-loader-inner" aria-hidden="true">
        {BARS}
      </span>
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
