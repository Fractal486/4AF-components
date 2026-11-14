"use client";

import { Bell, ChevronRight, Files, Inbox, LayoutDashboard, Plus, Settings, Star, Users } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarPanel,
  SidebarRail,
  SidebarRailButton,
  SidebarTrigger,
} from "@/registry/ui/sidebar/sidebar";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import { SidebarLayout, useSidebarLayoutRailSlot } from "@/registry/ui/sidebar-layout/sidebar-layout";
import { bool, defineEntry, onMobile, select, withIcons } from "../schema";
import { VIEWPORT_ICONS } from "../setting-icons";
import { resolveSidebarVariant } from "./sidebar";
import { DesktopPreview, Line, WireframePage } from "./wireframe";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, width: 64 },
  { label: "Inbox", icon: Inbox, width: 44 },
  { label: "Files", icon: Files, width: 52 },
  { label: "Team", icon: Users, width: 40 },
] as const;

const PERSONAL = [
  { label: "Starred", icon: Star, width: 48 },
  { label: "Notifications", icon: Bell, width: 72 },
] as const;

function NavRows({ rows, active }: { rows: readonly { label: string; icon: typeof Files; width: number }[]; active?: string }) {
  return (
    <SidebarMenu>
      {rows.map((row) => (
        <SidebarMenuItem key={row.label}>
          <SidebarMenuButton tooltip={<Line width={row.width} />} aria-label={row.label} isActive={row.label === active}>
            <row.icon />
            <Line width={row.width} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function NavGroup({ label, rows, active }: { label: number; rows: Parameters<typeof NavRows>[0]["rows"]; active?: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel><Line width={label} /></SidebarGroupLabel>
      <SidebarGroupContent><NavRows rows={rows} active={active} /></SidebarGroupContent>
    </SidebarGroup>
  );
}

function OneColumnSidebar() {
  return (
    <>
      <SidebarHeader>
        <NavRows rows={[{ label: "Workspace", icon: LayoutDashboard, width: 72 }]} />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label={48} rows={NAV} active="Dashboard" />
        <NavGroup label={40} rows={PERSONAL} />
      </SidebarContent>
      <SidebarFooter>
        <NavRows rows={[{ label: "Settings", icon: Settings, width: 48 }]} />
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

const PANELS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, rows: NAV },
  { value: "inbox", label: "Inbox", icon: Inbox, rows: PERSONAL },
  { value: "team", label: "Team", icon: Users, rows: NAV.slice(1) },
] as const;

function SplitRail() {
  return (
    <div className="flex h-full flex-col items-center gap-2">
      {PANELS.map((panel) => (
        <SidebarRailButton key={panel.value} tooltip={<Line width={48} />} aria-label={panel.label} value={panel.value}>
          <panel.icon />
        </SidebarRailButton>
      ))}
      <SidebarRailButton tooltip={<Line width={48} />} aria-label="Settings" className="mt-auto"><Settings /></SidebarRailButton>
    </div>
  );
}

function SplitPanels() {
  return PANELS.map((panel) => (
    <SidebarPanel key={panel.value} value={panel.value}>
      <SidebarHeader>
        <span className="mt-1 flex h-6 items-center px-1"><Line width={64} /></span>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label={48} rows={panel.rows} active={panel.rows[0].label} />
      </SidebarContent>
    </SidebarPanel>
  ));
}

/** A full-height detail panel, portalled into the layout's rail slot beside the content. */
function DetailRail() {
  const slot = useSidebarLayoutRailSlot();
  if (!slot) return null;
  return createPortal(
    <aside aria-label="Details" className="flex w-40 shrink-0 flex-col gap-3 border-l border-border p-3">
      <Line width={64} />
      <Line width={96} />
      <Line width={80} />
      <div className="mt-auto flex h-8 items-center rounded-lg border border-border px-2"><Line width={48} /></div>
    </aside>,
    slot,
  );
}

// The wireframe: surfaces go clear so only the outlines remain, each icon becomes a light
// square (an `<svg>` takes a background), and the active row is outlined instead of filled.
const BLUEPRINT = [
  "[&_.bg-surface]:bg-transparent [&_.bg-background]:bg-transparent",
  "[&_svg]:rounded-[3px] [&_svg]:bg-foreground/10 [&_svg]:text-transparent",
  // The mobile drawer covers the page, so it keeps a surface.
  "[&_[data-slot=sidebar][data-mobile=true]]:bg-background",
  "[&_[data-slot=sidebar-menu-button]:hover]:bg-muted/40 [&_[data-slot=sidebar-rail-button]:hover]:bg-muted/40",
  "[&_[data-slot=sidebar-menu-button][data-active]]:bg-transparent [&_[data-slot=sidebar-menu-button][data-active]]:shadow-border",
  "[&_[data-slot=sidebar-rail-button][data-active]]:bg-transparent [&_[data-slot=sidebar-rail-button][data-active]]:shadow-border",
].join(" ");

function SidebarLayoutBlueprint({
  layout,
  variant,
  collapsible,
  header,
  headerActions,
  collapseControl,
  detailRail,
  viewport,
}: {
  layout: "default" | "split";
  variant: "default" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  header: "title" | "custom";
  headerActions: boolean;
  collapseControl: boolean;
  detailRail: boolean;
  viewport: "desktop" | "mobile";
}) {
  const split = layout === "split";
  const mobile = viewport === "mobile";
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const crumbs: ReactNode = (
    <span className="flex min-w-0 items-center gap-1.5">
      <Line width={48} />
      <ChevronRight className="size-3" />
      <Line width={64} />
    </span>
  );

  return (
    // Both app-shell demos share the same canvas-fitted desktop and mobile windows.
    <div className="grid h-full w-full place-items-center" style={{ containerType: "size" }}>
      <DesktopPreview mobile={mobile}>
      <div
        ref={setFrame}
        className={cn(
          "relative overflow-hidden rounded-lg border [contain:paint]",
          "h-full w-full",
          // Floating and inset draw their own outlines inside, so the window's edge steps back.
          variant === "default" || mobile ? "border-border" : "border-border/50",
          BLUEPRINT,
        )}
      >
        <SidebarLayout
          sidebar={
            <Sidebar
              variant={resolveSidebarVariant(layout, variant)}
              collapsible={split ? "offcanvas" : collapsible}
              defaultActivePanel={split ? "dashboard" : undefined}
              className="h-full"
              mobileContainer={frame}
              rail={split ? <SplitRail /> : undefined}
            >
              {split ? <SplitPanels /> : <OneColumnSidebar />}
            </Sidebar>
          }
          title={<Line width={72} />}
          headerContent={header === "custom" ? crumbs : undefined}
          headerActions={headerActions ? (
            <>
              <Button variant="outline-ghost" size="icon-sm" aria-label="Alerts"><Bell /></Button>
              <Button variant="outline-ghost" size="sm" aria-label="New"><Plus data-icon-start="" /><Line width={28} /></Button>
            </>
          ) : undefined}
          // The trigger's own tooltip shows the shortcut's keys, so the blueprint drops the
          // shortcut and gives the trigger a placeholder tooltip instead, on a wrapper so the
          // trigger keeps the `data-slot` the sidebar returns focus to.
          keyboardShortcut={null}
          // On mobile the trigger is the only way to open the drawer, so it always shows.
          collapseControl={collapseControl || mobile ? <Tooltip content={<Line width={40} />} delay={500}><span className="inline-flex"><SidebarTrigger /></span></Tooltip> : null}
          // One page in a box: no cookie, and a narrower sidebar that suits the box.
          persist={false}
          mobile={mobile}
          style={{ "--sidebar-width": "12rem" } as CSSProperties}
          className="h-full min-h-0"
          contentClassName="gap-3 p-4"
        >
          <WireframePage />
          {detailRail && <DetailRail />}
        </SidebarLayout>
      </div>
      </DesktopPreview>
    </div>
  );
}

export const sidebarLayoutEntry = defineEntry({
  slug: "sidebar-layout",
  name: "Sidebar Layout",
  controls: {
    // Split adds the fixed icon rail; the default keeps one navigation column.
    // The desktop shell, or the mobile drawer (opened from the header's trigger).
    // Mobile on a phone-width screen, where the desktop shell doesn't fit.
    viewport: onMobile(withIcons(select(["desktop", "mobile"] as const, "desktop", "Viewport"), VIEWPORT_ICONS), "mobile"),
    layout: select(["default", "split"] as const, "default", "Layout"),
    // The drawer has no variants.
    variant: select(["default", "floating", "inset"] as const, "default", "Variant", (values) => values.viewport === "mobile"),
    // Split has no collapse modes: its panel closes and the icon rail stays.
    // The mobile drawer opens and closes whole, so collapse modes don't apply to it.
    collapsible: select(["offcanvas", "icon", "none"] as const, "icon", undefined, (values) => values.layout === "split" || values.viewport === "mobile"),
    // The title, or `headerContent` in its place (a breadcrumb here).
    header: select(["title", "custom"] as const, "title", "Header content"),
    headerActions: bool(true, "Header actions"),
    collapseControl: bool(true, "Collapse control", (values) => values.viewport === "mobile"),
    // A panel portalled into the rail slot, beside the scrolling content.
    detailRail: bool(false, "Detail rail"),
  },
  render(values) {
    // Remounted per shell option so the fixed panel measures against the new geometry
    // instead of animating between two layouts.
    return <SidebarLayoutBlueprint key={`${values.viewport}-${values.layout}-${values.variant}-${values.layout === "split" || values.collapsible}`} {...values} />;
  },
});
