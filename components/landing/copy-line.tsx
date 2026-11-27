"use client";

import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { useAction } from "@/registry/lib/use-action";
import { writeToClipboard } from "@/registry/ui/copy-button/copy-button";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";

/**
 * A landing-page command that copies itself and reports the result in a tooltip.
 * The inline highlight follows the glyphs when the command wraps.
 */
export function CopyLine({ value, className, children }: { value: string; className?: string; children?: ReactNode }) {
  const { status, run, buttonProps } = useAction({ action: () => writeToClipboard(value), revertAfter: 1200 });
  const feedback = status === "success" ? "Copied!" : status === "error" ? "Couldn't copy" : "";

  return (
    <>
      <Tooltip content={feedback} open={Boolean(feedback)} className="data-instant:transition-[opacity,scale,translate,filter]">
        <button
          {...buttonProps}
          type="button"
          aria-label={`Copy: ${value}`}
          onClick={run}
          className={cn(
            // Wraps between words when the screen is narrower than the command, and anywhere
            // as a last resort, so a long command never widens the page.
            "group w-fit cursor-default text-left font-mono text-xs leading-6 wrap-anywhere text-muted-foreground",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <span
            className={cn(
              // `box-decoration-clone`: a wrapped line keeps the highlight on each of its lines.
              "box-decoration-clone transition-[background-color,color] duration-(--duration-fast) ease-out",
              "group-hover:bg-muted group-hover:text-foreground group-focus-visible:bg-muted group-focus-visible:text-foreground",
            )}
          >
            {children ?? value}
          </span>
        </button>
      </Tooltip>
      <span role="status" className="sr-only">{feedback}</span>
    </>
  );
}
