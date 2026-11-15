"use client";

import { forwardRef, useEffect, useState, type ComponentProps, type CSSProperties } from "react";
import { cn } from "@/registry/lib/cn";
import {
  matrixLoaderVariants,
  type MatrixLoaderVariants,
} from "./matrix-loader.variants";

export type MatrixLoaderVariant =
  | "scan"
  | "hash"
  | "attention"
  | "backprop"
  | "beacon"
  | "compile"
  | "drift"
  | "gradient-descent"
  | "helix"
  | "vector-index";
export type MatrixLoaderSize = NonNullable<MatrixLoaderVariants["size"]>;
export type MatrixLoaderShape = NonNullable<MatrixLoaderVariants["shape"]>;
export type MatrixLoaderGrid = 4 | 5;

type MatrixLoaderStyle = CSSProperties & {
  [key: string]: string | number | undefined;
};

export interface MatrixLoaderProps
  extends Omit<ComponentProps<"div">, "children" | "style"> {
  /** The delay pattern used to wake the dots. */
  variant?: MatrixLoaderVariant;
  /** Dots per side: a 4×4 or 5×5 grid. */
  grid?: MatrixLoaderGrid;
  /** Square cells or round dots. */
  shape?: MatrixLoaderShape;
  /** The dot and gap scale. */
  size?: MatrixLoaderSize;
  /** Seconds per full cycle. Defaults to the pattern's own cycle. */
  duration?: number;
  /** Whether to render the spinner. Omit to always show it. */
  loading?: boolean;
  /**
   * The optional accessible status label. Without a label the visual loader is hidden
   * from assistive technology so nearby status text can do the announcing.
   */
  label?: string;
  style?: MatrixLoaderStyle;
}

/** Clockwise angle from straight up around the grid centre, as a fraction of a turn. */
function turn(row: number, column: number, n: number) {
  const centre = (n - 1) / 2;
  const dx = column - centre;
  const dy = row - centre;
  if (dx === 0 && dy === 0) return 0.25;
  const angle = Math.atan2(dx, -dy) / (2 * Math.PI);
  return angle < 0 ? angle + 1 : angle;
}

interface Pattern {
  /** Keyframes in the 4AF theme. */
  keyframes: string;
  /** Default seconds per cycle. */
  cycle: number;
  easing: string;
  /** Per-dot delays as fractions of the cycle; two delays run two composed passes. */
  delays: (row: number, column: number, n: number) => number[];
}

/**
 * The scan and hash pulse is the theme's `matrix-pulse`, with no backwards fill. The other
 * patterns' delays are rules of row, column and grid size, so they fit 4×4 and 5×5.
 */
const PATTERNS: Record<Exclude<MatrixLoaderVariant, "scan" | "hash">, Pattern> = {
  // Rows light top to bottom in a steady sweep.
  attention: { keyframes: "matrix-attention", cycle: 1.8, easing: "linear", delays: (r) => [(r * 0.28) / 1.8] },
  // Pulses propagate forward then back across columns.
  backprop: {
    keyframes: "matrix-backprop",
    cycle: 2.8,
    easing: "linear",
    delays: (_, c, n) => [(c * 0.24) / 2.8, (0.44 + (2 * (n - 1) - c) * 0.24) / 2.8],
  },
  // A bright pulse rotates around the grid.
  beacon: { keyframes: "matrix-beacon", cycle: 2.4, easing: "linear", delays: (r, c, n) => [-turn(r, c, n)] },
  // Rows resolve from the bottom up.
  compile: { keyframes: "matrix-compile", cycle: 2, easing: "linear", delays: (r, _, n) => [((n - 1 - r) * 0.2) / 2] },
  // A soft wave drifts along the diagonal.
  drift: {
    keyframes: "matrix-drift",
    cycle: 3.2,
    easing: "cubic-bezier(0.4, 0, 0.6, 1)",
    delays: (r, c) => [((r + c) * 0.24) / 3.2],
  },
  // Rows descend, fading as they settle.
  "gradient-descent": {
    keyframes: "matrix-gradient-descent",
    cycle: 2.4,
    easing: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
    delays: (r) => [(r * 0.32) / 2.4],
  },
  // Brightness winds around like a strand.
  helix: {
    keyframes: "matrix-helix",
    cycle: 2.6,
    easing: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
    delays: (r, c, n) => [-turn(r, c, n)],
  },
  // Diagonals index across the grid.
  "vector-index": {
    keyframes: "matrix-vector-index",
    cycle: 2.4,
    easing: "linear",
    delays: (r, c) => [((r + c) * 0.22) / 2.4],
  },
};

const PULSE_CYCLE = 1.2;

/** Per dot for `hash`: a start point in the cycle, and the cycle stretched or shrunk. */
interface Jitter {
  phase: number;
  stretch: number;
}

function randomJitter(count: number): Jitter[] {
  return Array.from({ length: count }, () => ({ phase: Math.random(), stretch: 0.7 + Math.random() * 0.6 }));
}

function dotStyle(variant: MatrixLoaderVariant, index: number, n: number, jitter?: Jitter): MatrixLoaderStyle {
  const row = Math.floor(index / n);
  const column = index % n;
  if (variant === "scan") {
    return {
      "--matrix-delay": column / 10,
      animationDelay: "calc(var(--matrix-delay, 0) * var(--matrix-cycle, 1.2s))",
    };
  }
  if (variant === "hash") {
    // Each dot runs its own cycle length from a random point in it, so the order drifts
    // and never repeats. Until the client picks values, the dots pulse together.
    const { phase, stretch } = jitter ?? { phase: 0, stretch: 1 };
    return {
      animationDelay: `calc(${-phase} * var(--matrix-cycle, 1.2s))`,
      animationDuration: `calc(${stretch} * var(--matrix-cycle, 1.2s))`,
    };
  }
  const pattern = PATTERNS[variant];
  const delays = pattern.delays(row, column, n);
  const pass = `${pattern.keyframes} var(--matrix-cycle) ${pattern.easing} infinite both`;
  return {
    animation: delays.map(() => pass).join(", "),
    animationDelay: delays.map((delay) => `calc(${delay} * var(--matrix-cycle))`).join(", "),
    // Two passes add onto a resting opacity rather than replacing each other.
    ...(delays.length > 1 ? { animationComposition: "add", opacity: 0.16 } : null),
  };
}

/**
 * A compact matrix loader: a 4×4 or 5×5 grid of square cells or round dots, with ten
 * patterns.
 *
 * The animation is CSS-only; `hash` picks its random per-dot timing on the client. The
 * per-dot delays are data, while the keyframes live in the 4AF theme so an installed copy
 * carries everything it needs. Looping indicators keep their own duration under reduced
 * motion instead of collapsing to a strobe.
 */
export const MatrixLoader = forwardRef<HTMLDivElement, MatrixLoaderProps>(
  function MatrixLoader(
    {
      className,
      duration,
      grid = 4,
      loading = true,
      label,
      shape = "square",
      size = "sm",
      style,
      variant = "scan",
      ...props
    },
    ref,
  ) {
    const n = grid === 5 ? 5 : 4;
    const [jitter, setJitter] = useState<Jitter[]>();

    useEffect(() => {
      if (!loading || variant !== "hash") return;
      // Random values only exist on the client: rendering them would break hydration.
      setJitter(randomJitter(n * n));
    }, [loading, n, variant]);

    if (!loading) return null;
    const fallback = variant === "scan" || variant === "hash" ? PULSE_CYCLE : PATTERNS[variant].cycle;
    const cycle = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : fallback;

    return (
      <div
        ref={ref}
        data-size={size}
        data-slot="matrix-loader"
        data-variant={variant}
        data-grid={n}
        data-shape={shape}
        className={cn(matrixLoaderVariants({ size, shape, grid: n === 5 ? "5" : "4" }), className)}
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
        {Array.from({ length: n * n }, (_, index) => (
          <i key={index} aria-hidden="true" style={dotStyle(variant, index, n, jitter?.[index])} />
        ))}
      </div>
    );
  },
);

MatrixLoader.displayName = "MatrixLoader";
