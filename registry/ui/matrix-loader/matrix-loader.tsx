import { forwardRef, type ComponentProps, type CSSProperties } from "react";
import { cn } from "@/registry/lib/cn";
import {
  matrixLoaderVariants,
  type MatrixLoaderVariants,
} from "./matrix-loader.variants";

const TWINKLE_ORDER = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4];

export type MatrixLoaderVariant = "scan" | "twinkle";
export type MatrixLoaderSize = NonNullable<MatrixLoaderVariants["size"]>;

type MatrixLoaderStyle = CSSProperties & {
  [key: string]: string | number | undefined;
};

export interface MatrixLoaderProps
  extends Omit<ComponentProps<"div">, "children" | "style"> {
  /** The delay pattern used to wake the dots. */
  variant?: MatrixLoaderVariant;
  /** The dot and gap scale. */
  size?: MatrixLoaderSize;
  /** Seconds per full color-pulse cycle. */
  duration?: number;
  /**
   * The optional accessible status label. Without a label the visual loader is hidden
   * from assistive technology so nearby status text can do the announcing.
   */
  label?: string;
  style?: MatrixLoaderStyle;
}

function delayFor(index: number, variant: MatrixLoaderVariant) {
  switch (variant) {
    case "scan":
      return (index % 4) / 10;
    case "twinkle":
      return TWINKLE_ORDER.indexOf(index) / 16;
  }
}

function validDuration(duration: number) {
  return Number.isFinite(duration) && duration > 0 ? duration : 1.2;
}

/**
 * A compact 4×4 matrix loader with scan and twinkle patterns.
 *
 * The animation is CSS-only. The per-dot delay table is data, while the shared
 * keyframe and theme animation token live in the 4AF theme so an installed copy
 * carries everything it needs. Looping indicators keep their own duration under
 * reduced motion instead of collapsing to a strobe.
 */
export const MatrixLoader = forwardRef<HTMLDivElement, MatrixLoaderProps>(
  function MatrixLoader(
    {
      className,
      duration = 1.2,
      label,
      size = "sm",
      style,
      variant = "scan",
      ...props
    },
    ref,
  ) {
    const cycle = validDuration(duration);

    return (
      <div
        ref={ref}
        data-size={size}
        data-slot="matrix-loader"
        data-variant={variant}
        className={cn(matrixLoaderVariants({ size }), className)}
        style={{
          "--matrix-cycle": String(cycle) + "s",
          "--matrix-active": "var(--foreground)",
          ...style,
        } as MatrixLoaderStyle}
        role={label ? "status" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        {...props}
      >
        {Array.from({ length: 16 }, (_, index) => {
          return (
            <i
              key={index}
              aria-hidden="true"
              style={{
                "--matrix-delay": delayFor(index, variant),
                animationDelay:
                  "calc(var(--matrix-delay, 0) * var(--matrix-cycle, 1.2s))",
              } as MatrixLoaderStyle}
            />
          );
        })}
      </div>
    );
  },
);

MatrixLoader.displayName = "MatrixLoader";
