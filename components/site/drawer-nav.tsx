"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { NavGroup } from "@/lib/site-nav";
import { cn } from "@/registry/lib/cn";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { NavIcon } from "./nav-icons";

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The navigation in the phone drawer: plain rows. The desktop rail's ruler lives on hover, which
 * touch never has, so the drawer follows the shadcn sidebar instead: a Home row, then each group
 * a section under a static label ("Get Started", "Components" there), each page a menu row with
 * an icon. Sizes,
 * type, and highlights follow its group label and menu buttons.
 */
export function DrawerNav({
  nav,
  onNavigate,
  className,
}: {
  nav: NavGroup[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const viewportRef = useRef<HTMLDivElement>(null);

  // A long list puts the current page below the fold; open the drawer on it.
  useEffect(() => {
    viewportRef.current
      ?.querySelector("[aria-current=page]")
      ?.scrollIntoView({ block: "center" });
  }, [pathname]);

  return (
    // The rail's edges: a blurred fade at each end that has more beyond it, from the scroll
    // area's overflow attributes. Masked to the same gradient as the colour, so rows soften
    // progressively as they reach the edge.
    <div className="group/drawer-nav relative flex min-h-0 flex-1 flex-col">
      <ScrollArea fade={false} className="min-h-0 flex-1" viewportRef={viewportRef}>
        <nav aria-label="Site" className={className}>
          {nav.map((group, index) => (
            // The unlabelled lead group is the overview: a Home row above the first section.
            <section
              key={group.label ?? index}
              aria-label={group.label ?? "Home"}
              className={cn("flex flex-col p-2", !group.label && "pb-0")}
            >
              {group.label ? (
                <h2 className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-foreground/70">
                  {group.label}
                </h2>
              ) : null}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-2 rounded-md p-2 text-[13px] text-muted-foreground/90 dark:text-muted-foreground/80",
                      "hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
                      "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
                      FOCUS,
                    )}
                  >
                    <NavIcon href={item.href} />
                    <span className="truncate">{item.href === "/" ? "Home" : item.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </ScrollArea>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-surface-raised to-transparent opacity-0 backdrop-blur-[2px] transition-[opacity] duration-(--duration-fast) [mask-image:linear-gradient(to_bottom,black,transparent)] group-has-[[data-overflow-y-start]]/drawer-nav:opacity-100"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-surface-raised to-transparent opacity-0 backdrop-blur-[2px] transition-[opacity] duration-(--duration-fast) [mask-image:linear-gradient(to_top,black,transparent)] group-has-[[data-overflow-y-end]]/drawer-nav:opacity-100"
      />
    </div>
  );
}
