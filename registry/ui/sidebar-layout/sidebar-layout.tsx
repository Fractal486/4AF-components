import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  type SidebarProviderProps,
} from "@/registry/ui/sidebar/sidebar";

/**
 * An optional application shell for Sidebar.
 *
 * Sidebar stays a low-level, composable navigation primitive. This companion adds the
 * common page frame around it: the provider, the inset content surface, a compact title
 * header, and a collapse trigger before the title on the header's left edge.
 *
 * It also opens a rail slot to the right of the scrolling content — the mount point for a
 * full-height detail panel. The slot is a sibling of the scroll container rather than a
 * child of it, which is what lets a rail hold its own scroll and pin a footer while the
 * page scrolls independently. Nothing renders there until something portals in, and the
 * slot collapses to nothing when empty.
 */

/** The id of the rail slot, for a caller that cannot reach the context. */
export const SIDEBAR_LAYOUT_RAIL_SLOT_ID = "sidebar-layout-rail";

const RailSlotContext = createContext<HTMLElement | null>(null);

/**
 * The element a detail rail should portal into, or null when there is no shell above.
 *
 * A page renders in the same pass that first commits the shell, so looking the slot up by
 * id during render finds nothing — the element is not in the document yet. The slot's own
 * ref callback fires at commit and publishes it here, which is one render later and
 * always correct.
 */
export function useSidebarLayoutRailSlot(): HTMLElement | null {
  return useContext(RailSlotContext);
}

export interface SidebarLayoutProps extends Omit<SidebarProviderProps, "children" | "title"> {
  /** The Sidebar instance to place beside the page content. */
  sidebar: ReactNode;
  /** The current page or panel label shown in the header. */
  title?: ReactNode;
  /** Optional controls rendered on the header's right side. */
  headerActions?: ReactNode;
  /** Replace the default left-aligned SidebarTrigger, or pass null to omit it. */
  collapseControl?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  children?: ReactNode;
}

export function SidebarLayout({
  sidebar,
  title,
  headerActions,
  collapseControl,
  headerClassName,
  contentClassName,
  children,
  className,
  ...providerProps
}: SidebarLayoutProps) {
  const [railSlot, setRailSlot] = useState<HTMLElement | null>(null);

  return (
    <SidebarProvider {...providerProps} className={cn("h-svh overflow-hidden", className)}>
      {sidebar}
      <SidebarInset className="min-h-0 overflow-hidden">
        <header
          data-slot="sidebar-layout-header"
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b border-border px-3",
            headerClassName,
          )}
        >
          {collapseControl === undefined ? <SidebarTrigger /> : collapseControl}
          {title !== undefined && (
            <span className="min-w-0 truncate text-sm text-muted-foreground">{title}</span>
          )}
          <div
            data-slot="sidebar-layout-header-actions"
            className="ml-auto flex items-center gap-2"
          >
            {headerActions}
          </div>
        </header>
        {/* The scrolling content and the rail are siblings, so the rail can run the full
            height of the inset without riding the page's scroll. */}
        <div className="flex min-h-0 flex-1">
          <div
            data-slot="sidebar-layout-content"
            className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", contentClassName)}
          >
            <RailSlotContext value={railSlot}>{children}</RailSlotContext>
          </div>
          {/* `contents`: whatever portals in becomes a direct flex child of this row
              rather than sitting inside a wrapper that would need its own sizing. */}
          <div
            data-slot="sidebar-layout-rail"
            id={SIDEBAR_LAYOUT_RAIL_SLOT_ID}
            ref={setRailSlot}
            className="contents"
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
