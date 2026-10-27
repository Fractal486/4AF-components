import type { ReactNode } from "react";
import { SiteRail } from "@/components/site/site-rail";
import { REPOSITORY, siteNav } from "@/lib/site-nav";

/**
 * The site shell, shared by the overview and every docs page. Being a layout, it stays
 * mounted across navigation, so the rail keeps its scroll position between pages.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    // Full width: component pages fill the main area; reading pages centre an ArticleColumn.
    <div className="w-full lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      <div className="sticky top-0 z-30 border-b bg-background lg:h-dvh lg:border-b-0">
        <SiteRail
          nav={siteNav()}
          repository={REPOSITORY}
        />
      </div>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
