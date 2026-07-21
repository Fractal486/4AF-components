import type { ReactNode } from "react";
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
 */
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
  ...providerProps
}: SidebarLayoutProps) {
  return (
    <SidebarProvider {...providerProps}>
      {sidebar}
      <SidebarInset>
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
          {headerActions !== undefined && (
            <div className="ml-auto flex items-center gap-2">{headerActions}</div>
          )}
        </header>
        <div
          data-slot="sidebar-layout-content"
          className={cn("flex flex-1 flex-col", contentClassName)}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
