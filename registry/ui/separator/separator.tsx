import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A divider.
 *
 * Base UI's Separator, so it carries `role="separator"` and `aria-orientation` — a rule
 * that a screen reader announces, not just a line that looks like one. A real filled
 * hairline (`bg-border`), not a shadow: the job here is separation, not elevation, and
 * `shadow-border` is for the things that need to read as lifted.
 *
 * Not `"use client"` — it renders no state and handles no events, so it stays a server
 * component. It sizes itself to its container: full width when horizontal, full height
 * when vertical (give the parent a height for the vertical case).
 */
export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<typeof BaseSeparator>) {
  return (
    <BaseSeparator
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
