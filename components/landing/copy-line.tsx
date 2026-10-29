"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";

/** How long "Copied!" stays up after a click, in ms. */
const SHOWN = 1200;

/**
 * A command on the landing page that copies itself: plain monospace text, highlighted on hover
 * like a selection, and a "Copied!" tooltip above it after a click. No box and no copy button;
 * the line is the control. The highlight is on an inline span, so it covers the glyphs alone:
 * no padding, no rounding, and no taller than the font.
 */
export function CopyLine({ value, className, children }: { value: string; className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    // Controlled, so the tooltip opens only on a copy, never on hover.
    <Tooltip content="Copied!" open={copied}>
      <button
        type="button"
        aria-label={`Copy: ${value}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), SHOWN);
          });
        }}
        className={cn(
          "group w-fit cursor-default text-left font-mono text-xs leading-6 whitespace-nowrap text-muted-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <span
          className={cn(
            "transition-[background-color,color] duration-(--duration-fast) ease-out",
            "group-hover:bg-muted group-hover:text-foreground group-focus-visible:bg-muted group-focus-visible:text-foreground",
          )}
        >
          {children ?? value}
        </span>
      </button>
    </Tooltip>
  );
}
