"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/registry/lib/cn";
import { groups } from "./index";

export function Sidebar() {
  // The active link is the one whose route we're on: `/c/<group>` for a stacked group,
  // `/c/<group>?component=<entry>` for a single-entry page. Both pieces are needed — the
  // pathname alone can't tell two entries in the same group apart.
  const pathname = usePathname();
  const componentParam = useSearchParams().get("component");

  return (
    <aside className="w-full shrink-0 px-6 pt-4 md:sticky md:top-0 md:w-48 md:self-start md:pt-8">
      <nav aria-label="Components">
        <ul className="flex flex-wrap gap-1 md:flex-col">
          {groups.flatMap((group) =>
            // A stacked group is one line (its whole page renders every entry); the rest
            // list each entry, since those pages show one at a time.
            (group.stacked
              ? [{ slug: group.slug, name: group.name, href: `/c/${group.slug}`, isActive: pathname === `/c/${group.slug}` }]
              : group.entries.map((entry) => ({
                  slug: entry.slug,
                  name: entry.name,
                  href: `/c/${group.slug}?component=${entry.slug}`,
                  isActive:
                    pathname === `/c/${group.slug}` && componentParam === entry.slug,
                }))
            ).map((link) => (
              <li key={link.slug}>
                <Link
                  href={link.href}
                  aria-current={link.isActive ? "page" : undefined}
                  // Hover as an overlay relative to the foreground, not `bg-muted`.
                  // The sidebar sits on the page background, and `muted` is one faint
                  // step off it — invisible in light mode (near-white on near-white).
                  // A translucent foreground tint has real contrast in both themes.
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-[background-color,color] duration-(--duration-fast) ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    link.isActive
                      ? // The selected component reads at full strength (ink/white) on the
                        // same translucent fill the hovered rows use, so the current row stays
                        // marked even when the cursor is elsewhere.
                        "bg-foreground/[0.07] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground",
                  )}
                >
                  {link.name}
                </Link>
              </li>
            )),
          )}
        </ul>
      </nav>
    </aside>
  );
}
