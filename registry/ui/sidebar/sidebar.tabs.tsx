"use client";

import { cn } from "@/registry/lib/cn";
import { Tabs, TabsList, TabsTab, type TabsProps } from "@/registry/ui/tabs/tabs";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";

export interface SidebarTabsProps extends Omit<TabsProps, "size" | "appearance"> {
  /** @default "outline" */
  appearance?: TabsProps["appearance"];
  /** @default "sm" */
  size?: TabsProps["size"];
}

/**
 * Tabs that switch the sidebar's contents, with the row in the header under its title.
 *
 * The root wraps the header, the panels and the footer, so it fills the sidebar's column
 * the way those parts would on their own. Selection, keyboard and the indicator are Tabs';
 * `variant` and `appearance` pass through to it.
 *
 *   <SidebarTabs defaultValue="workspace">
 *     <SidebarHeader>
 *       <span>Acme Inc</span>
 *       <SidebarTabsList aria-label="Sections">
 *         <SidebarTabsTab value="workspace">Workspace</SidebarTabsTab>
 *         <SidebarTabsTab value="personal">Personal</SidebarTabsTab>
 *       </SidebarTabsList>
 *     </SidebarHeader>
 *     <SidebarTabsPanel value="workspace"><SidebarContent>…</SidebarContent></SidebarTabsPanel>
 *     <SidebarTabsPanel value="personal"><SidebarContent>…</SidebarContent></SidebarTabsPanel>
 *     <SidebarFooter>…</SidebarFooter>
 *   </SidebarTabs>
 */
export function SidebarTabs({ appearance = "outline", size = "sm", className, ...props }: SidebarTabsProps) {
  return (
    <Tabs
      data-slot="sidebar-tabs"
      appearance={appearance}
      size={size}
      className={cn("min-h-0 flex-1 gap-0", className)}
      {...props}
    />
  );
}

/**
 * The tab row, the sidebar's full width with the tabs sharing it evenly. Collapsed to
 * icons there is no room for labels, so the row hides and the selected panel stays.
 */
export function SidebarTabsList({ className, ...props }: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      data-slot="sidebar-tabs-list"
      className={cn("w-full self-stretch group-data-[collapsible=icon]:hidden", className)}
      {...props}
    />
  );
}

export function SidebarTabsTab({ className, ...props }: ComponentProps<typeof TabsTab>) {
  return <TabsTab data-slot="sidebar-tabs-tab" className={cn("min-w-0 flex-1", className)} {...props} />;
}

/**
 * One tab's contents, usually a `SidebarContent`. Inactive panels stay mounted and hidden,
 * so their scroll position and open sections survive a switch.
 */
export function SidebarTabsPanel({
  className,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.Panel>, "className" | "keepMounted"> & { className?: string }) {
  return (
    <BaseTabs.Panel
      keepMounted
      data-slot="sidebar-tabs-panel"
      className={cn("flex min-h-0 flex-1 flex-col outline-none", className)}
      {...props}
    />
  );
}
