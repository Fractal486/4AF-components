import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * The column a reading page sits in beside the rail: the overview and the reference pages.
 * Component pages fill the main area with their playground instead.
 */
export function ArticleColumn({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-[60.5rem] lg:px-[clamp(2rem,4vw,4rem)]", className)}>
      {children}
    </div>
  );
}
