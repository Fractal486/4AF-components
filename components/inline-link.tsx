import Link, { type LinkProps } from "fumadocs-core/link";
import { cn } from "@/registry/lib/cn";

/** Inline navigation, shared by the overview, documentation, and catalog. */
export function InlineLink({ className, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "rounded-xs font-normal text-foreground underline decoration-border-strong decoration-auto underline-offset-[3px] outline-none transition-[text-decoration-color] duration-(--duration-fast) hover:decoration-current hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}
