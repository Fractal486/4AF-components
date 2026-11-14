import type { ReactNode } from "react";

/**
 * The column a reading page sits in beside the rail: the overview and the reference pages.
 * Component pages fill the main area with their playground instead.
 */
export function ArticleColumn({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[60.5rem] lg:px-[clamp(2rem,4vw,4rem)]">{children}</div>
  );
}
