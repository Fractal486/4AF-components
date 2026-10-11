import type { ReactNode } from "react";
import { TableOfContents, type TocItem } from "@/registry/ui/table-of-contents/table-of-contents";

/**
 * A page inside the site shell: the content column, and the page's own headings in a sticky
 * column beside it once there is room (`xl`). Below that the headings are omitted; the rail
 * still reaches every page.
 */
export function PageFrame({ toc, children }: { toc: TocItem[]; children: ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-12">
      <div className="min-w-0 px-5 pt-9 pb-16 sm:px-10 sm:pt-18 sm:pb-28 lg:px-0">{children}</div>
      {toc.length > 0 ? (
        <div className="sticky top-0 max-h-dvh pt-18 pb-8 max-xl:hidden">
          <p className="mb-3 font-mono text-2xs tracking-[0.04em] text-subtle-foreground">
            On this page
          </p>
          <TableOfContents
            aria-label="On this page"
            variant="single"
            items={toc}
            className="max-h-[calc(100dvh-10rem)]"
          />
        </div>
      ) : null}
    </div>
  );
}
