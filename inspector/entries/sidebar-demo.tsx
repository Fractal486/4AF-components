"use client";

import {
  ChevronDown,
  Files,
  Inbox,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useIsFullscreen } from "../fullscreen";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderButton,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarPanel,
  SidebarProvider,
  SidebarRail,
  SidebarRailButton,
  SidebarTrigger,
} from "@/registry/ui/sidebar/sidebar";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: Inbox, badge: "12" },
  { id: "files", label: "Files", icon: Files },
  { id: "team", label: "Team", icon: Users },
] as const;

const PROJECTS = ["Aurora", "Basecamp", "Cartography"] as const;

export function SidebarDemo({
  side,
  variant,
  collapsible,
  loading,
}: {
  side: "left" | "right";
  variant: "sidebar" | "floating" | "inset" | "split";
  collapsible: "offcanvas" | "icon" | "none";
  loading: boolean;
}) {
  const [active, setActive] = useState<string>("dashboard");
  const [dashboardSelection, setDashboardSelection] = useState("overview");
  const [mailSelection, setMailSelection] = useState("inbox");
  const [filesSelection, setFilesSelection] = useState("browse");
  const [teamSelection, setTeamSelection] = useState("members");
  const [settingsSelection, setSettingsSelection] = useState("preferences");
  const split = variant === "split";
  // Full screen *is* the document root, near enough — so the framing that makes this fit
  // a preview pane is exactly what has to come off.
  const full = useIsFullscreen();

  return (
    // Demo-only framing. A real app renders this shell at the document root, where the
    // panel's `fixed` and `h-svh` mean what they say. Boxed into a preview pane they'd
    // escape to the viewport, so `contain: paint` makes this element the containing block
    // for the fixed panel — and the heights below are pulled back to the frame.
    <div
      className={
        full
          ? "relative h-dvh w-full overflow-hidden"
          : "relative h-[28rem] w-full overflow-hidden rounded-lg border border-border [contain:paint]"
      }
    >
      <SidebarProvider
        // The inspector is one page — persisting the rail state to a cookie would leak
        // between visits and fight the control panel.
        persist={false}
        className="min-h-full"
      >
        <Sidebar
          side={side}
          variant={variant}
          collapsible={split ? "none" : collapsible}
          defaultActivePanel={split ? "mail" : undefined}
          className="h-full"
          rail={
            split ? (
              <div className="flex h-full flex-col items-center gap-2">
                <SidebarRailButton
                  tooltip="Acme Inc"
                  aria-label="Acme Inc"
                  className="mt-1 mb-2 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  <span className="text-2xs font-semibold">4</span>
                </SidebarRailButton>
                <SidebarRailButton
                  tooltip="Dashboard"
                  value="dashboard"
                >
                  <LayoutDashboard />
                </SidebarRailButton>
                <SidebarRailButton
                  tooltip="Inbox"
                  value="mail"
                >
                  <Inbox />
                </SidebarRailButton>
                <SidebarRailButton
                  tooltip="Files"
                  value="files"
                >
                  <Files />
                </SidebarRailButton>
                <SidebarRailButton
                  tooltip="Team"
                  value="team"
                >
                  <Users />
                </SidebarRailButton>
                <SidebarRailButton tooltip="Settings" value="settings" className="mt-auto">
                  <Settings />
                </SidebarRailButton>
              </div>
            ) : undefined
          }
        >
          {split ? (
            <>
              <SidebarPanel value="dashboard">
                <SidebarHeader>
                  <span className="mt-1 flex h-8 items-center px-1 text-sm font-medium text-foreground">
                    Overview
                  </span>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Overview"
                            isActive={dashboardSelection === "overview"}
                            onClick={() => setDashboardSelection("overview")}
                          >
                            <LayoutDashboard />
                            <span>Overview</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Reports"
                            isActive={dashboardSelection === "reports"}
                            onClick={() => setDashboardSelection("reports")}
                          >
                            <Files />
                            <span>Reports</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="mail">
                <SidebarHeader>
                  <span className="mt-1 flex h-8 items-center px-1 text-sm font-medium text-foreground">
                    Emails
                  </span>
                  <SidebarHeaderButton
                    variant="primary"
                    aria-label="Compose"
                    className="mt-2"
                    onClick={() => setMailSelection("compose")}
                  >
                    <Plus />
                    <span>Compose</span>
                  </SidebarHeaderButton>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Views</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Inbox"
                            isActive={mailSelection === "inbox"}
                            onClick={() => setMailSelection("inbox")}
                          >
                            <Inbox />
                            <span>Inbox</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>99+</SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Sent"
                            isActive={mailSelection === "sent"}
                            onClick={() => setMailSelection("sent")}
                          >
                            <Files />
                            <span>Sent</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Drafts"
                            isActive={mailSelection === "drafts"}
                            onClick={() => setMailSelection("drafts")}
                          >
                            <Files />
                            <span>Drafts</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  <SidebarGroup>
                    <SidebarGroupLabel>Mail</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuCollapsible defaultOpen>
                          <SidebarMenuCollapsibleTrigger
                            tooltip="Folders"
                            isActive={mailSelection === "folders"}
                            onClick={() => setMailSelection("folders")}
                          >
                            <Inbox />
                            <span>Folders</span>
                            <ChevronDown className="ml-auto -rotate-90 transition-[rotate] duration-(--duration-fast) ease-out [[data-panel-open]_&]:rotate-0" />
                          </SidebarMenuCollapsibleTrigger>
                          <SidebarMenuCollapsibleContent>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  href="#"
                                  isActive={mailSelection === "all-mail"}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setMailSelection("all-mail");
                                  }}
                                >
                                  <span>All mail</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  href="#"
                                  isActive={mailSelection === "favorites"}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setMailSelection("favorites");
                                  }}
                                >
                                  <span>Favorites</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </SidebarMenuCollapsibleContent>
                        </SidebarMenuCollapsible>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="files">
                <SidebarHeader>
                  <span className="mt-1 flex h-8 items-center px-1 text-sm font-medium text-foreground">
                    Files
                  </span>
                  <SidebarInput
                    className="mt-2"
                    placeholder="Search files…"
                    aria-label="Search files"
                  />
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Places</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Browse"
                            isActive={filesSelection === "browse"}
                            onClick={() => setFilesSelection("browse")}
                          >
                            <Files />
                            <span>Browse</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Recent"
                            isActive={filesSelection === "recent"}
                            onClick={() => setFilesSelection("recent")}
                          >
                            <Search />
                            <span>Recent</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Shared"
                            isActive={filesSelection === "shared"}
                            onClick={() => setFilesSelection("shared")}
                          >
                            <Users />
                            <span>Shared with me</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="team">
                <SidebarHeader>
                  <span className="mt-1 flex h-8 items-center px-1 text-sm font-medium text-foreground">
                    Team
                  </span>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>People</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Members"
                            isActive={teamSelection === "members"}
                            onClick={() => setTeamSelection("members")}
                          >
                            <Users />
                            <span>Members</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Invitations"
                            isActive={teamSelection === "invitations"}
                            onClick={() => setTeamSelection("invitations")}
                          >
                            <Plus />
                            <span>Invitations</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="settings">
                <SidebarHeader>
                  <span className="mt-1 flex h-8 items-center px-1 text-sm font-medium text-foreground">
                    Settings
                  </span>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Preferences</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Preferences"
                            isActive={settingsSelection === "preferences"}
                            onClick={() => setSettingsSelection("preferences")}
                          >
                            <Settings />
                            <span>Preferences</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Account"
                            isActive={settingsSelection === "account"}
                            onClick={() => setSettingsSelection("account")}
                          >
                            <Users />
                            <span>Account</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>
            </>
          ) : (
            <>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-2xs font-semibold">4</span>
              </div>
              <span className="truncate text-sm font-medium text-foreground group-data-[collapsible=icon]:hidden">
                Acme Inc
              </span>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarInput placeholder="Search…" aria-label="Search" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading
                    ? [70, 55, 85, 60].map((width, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuSkeleton showIcon width={`${width}%`} />
                        </SidebarMenuItem>
                      ))
                    : NAV.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            tooltip={item.label}
                            isActive={active === item.id}
                            onClick={() => setActive(item.id)}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {"badge" in item && item.badge ? (
                            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                          ) : (
                            <SidebarMenuAction showOnHover aria-label={`More for ${item.label}`}>
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          )}
                        </SidebarMenuItem>
                      ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction aria-label="New project">
                <Plus />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuCollapsible defaultOpen>
                    <SidebarMenuCollapsibleTrigger tooltip="Projects">
                      <Search />
                      <span>Browse</span>
                      <ChevronDown
                        className="ml-auto -rotate-90 transition-[rotate] duration-(--duration-fast) ease-out [[data-panel-open]_&]:rotate-0"
                      />
                    </SidebarMenuCollapsibleTrigger>
                    <SidebarMenuCollapsibleContent>
                      <SidebarMenuSub>
                        {PROJECTS.map((project) => (
                          <SidebarMenuSubItem key={project}>
                            <SidebarMenuSubButton
                              href="#"
                              isActive={active === project}
                              onClick={(event) => {
                                event.preventDefault();
                                setActive(project);
                              }}
                            >
                              <span>{project}</span>
                            </SidebarMenuSubButton>
                            <SidebarMenuAction
                              nested
                              showOnHover
                              aria-label={`More for ${project}`}
                            >
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </SidebarMenuSubItem>
                        ))}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <button type="button">
                              <Plus />
                              <span>New project</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuCollapsibleContent>
                  </SidebarMenuCollapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" size="sm">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
            </>
          )}

          {!split && <SidebarRail />}
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
            {!split && <SidebarTrigger />}
            <span className="text-sm text-muted-foreground">
              {active[0]!.toUpperCase() + active.slice(1)}
            </span>
            <kbd className="ml-auto rounded-xs bg-muted px-1.5 py-0.5 font-mono text-2xs text-subtle-foreground">
              ⌘B
            </kbd>
          </header>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
