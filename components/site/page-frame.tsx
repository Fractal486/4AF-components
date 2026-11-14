import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { MobileToc } from "@/components/site/mobile-toc";
import { TableOfContents, type TocItem } from "@/registry/ui/table-of-contents/table-of-contents";

/**
 * A page inside the site shell: the content column, and the page's own headings in a sticky
 * column beside it once there is room (`xl`), or a sticky dropdown below that.
 */
export function PageFrame({
  toc,
  mobileToc = true,
  footer,
  children,
}: {
  toc: TocItem[];
  /**
   * Whether to render the narrow-screen dropdown. A page with content above the frame (the
   * home page's hero) turns it off and renders `MobileToc` itself, directly under the top bar.
   */
  mobileToc?: boolean;
  /**
   * Rendered under the content column, inside the frame. A sticky element only sticks within
   * its container, so a footer outside the frame would leave the "On this page" rail behind
   * once the content ends; inside it, the rail spans both rows and stays beside the footer.
   */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    // Column gap only: a row gap would open space between the content and the footer. Without
    // a rail there is one column, or the footer would take the rail's place beside the content.
    <div className={cn(toc.length > 0 && "xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-x-12")}>
      {mobileToc && toc.length > 0 ? <MobileToc items={toc} /> : null}
      <div className="min-w-0 px-5 pt-9 pb-16 sm:px-10 sm:pt-18 sm:pb-28 lg:px-0">{children}</div>
      {toc.length > 0 ? (
        <div className={cn("sticky top-0 max-h-dvh pt-18 pb-8 max-xl:hidden", footer != null && "xl:row-span-2")}>
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
      {/* After the rail in source order, so grid placement puts it in the second row of the
          first column, under the content. */}
      {footer}
    </div>
  );
}
