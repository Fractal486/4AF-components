import type { ComponentProps, CSSProperties, ElementType } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * Text that blurs and rises into place, one letter (or word) after another — an entrance
 * for a heading or a short line.
 *
 * Plain CSS: each segment runs the theme's `blur-text-in` keyframes with its own
 * `animation-delay`, so it starts on first paint with no client JavaScript and no Motion.
 * The rise and blur are in `em`, so the effect scales with the text. Durations come from the
 * motion tokens, and under reduced motion the text is simply shown.
 *
 * Letters are grouped per word in a no-wrap box: a line can otherwise break between any two
 * inline-block letters, mid-word. Splitting is on ordinary whitespace only, so a no-break
 * space keeps its words together. The full text is kept once for assistive technology; the
 * animated copy is hidden from it.
 *
 * Not `"use client"`: it has no state or handlers.
 */

export interface BlurTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** The text to reveal. Changing it replays the entrance. */
  children: string;
  /** The element to render, such as `"h1"` or `"p"`. Defaults to a `<span>`. */
  as?: ElementType;
  /** Whether letters or whole words enter one after another. Defaults to `"character"`. */
  by?: "character" | "word";
  /** Milliseconds before the first segment starts. Defaults to `0`. */
  delay?: number;
  /**
   * Milliseconds between consecutive segments. Defaults to spreading the starts across
   * 300ms, so short and long text take about as long to begin.
   */
  stagger?: number;
}

const SPREAD = 300;
const WHITESPACE = /([ \t\n]+)/;
const IS_WHITESPACE = /^[ \t\n]+$/;

// `whitespace-pre` so a segment keeps its own spacing inside the `pre-wrap` container.
const SEGMENT_CLASS = "inline-block whitespace-pre animate-blur-text-in motion-reduce:animate-none";

export function BlurText({
  children,
  as: Comp = "span",
  by = "character",
  delay = 0,
  stagger,
  className,
  ...props
}: BlurTextProps) {
  // Each word with its segments and the position of its first segment in the whole run,
  // worked out up front so every segment's delay is a function of the text alone.
  const parts: ({ space: string } | { segments: string[]; first: number })[] = [];
  let count = 0;
  for (const part of children.split(WHITESPACE)) {
    if (!part) continue;
    if (IS_WHITESPACE.test(part)) {
      parts.push({ space: part });
      continue;
    }
    const segments = by === "character" ? Array.from(part) : [part];
    parts.push({ segments, first: count });
    count += segments.length;
  }
  const step = stagger ?? (count > 1 ? SPREAD / (count - 1) : 0);
  const timing = (position: number): CSSProperties => ({
    animationDelay: `${delay + position * step}ms`,
  });

  return (
    <Comp
      data-slot="blur-text"
      data-by={by}
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    >
      <span className="sr-only">{children}</span>
      {/* Keyed by the text, so new text remounts and replays the entrance. */}
      <span key={children} aria-hidden="true">
        {parts.map((part, partIndex) =>
          "space" in part ? (
            part.space
          ) : by === "word" ? (
            <span key={partIndex} className={SEGMENT_CLASS} style={timing(part.first)}>
              {part.segments[0]}
            </span>
          ) : (
            <span key={partIndex} className="inline-block whitespace-nowrap">
              {part.segments.map((letter, letterIndex) => (
                <span
                  key={letterIndex}
                  className={SEGMENT_CLASS}
                  style={timing(part.first + letterIndex)}
                >
                  {letter}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Comp>
  );
}
