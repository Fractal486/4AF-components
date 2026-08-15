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
  SidebarHeaderRow,
  SidebarInput,
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
  SidebarRail,
  SidebarRailButton,
  useSidebar,
} from "@/registry/ui/sidebar/sidebar";
import { SidebarLayout } from "@/registry/ui/sidebar-layout/sidebar-layout";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: Inbox, badge: "12" },
  { id: "files", label: "Files", icon: Files },
  { id: "team", label: "Team", icon: Users },
] as const;

const PROJECTS = ["Aurora", "Basecamp", "Cartography"] as const;

const MENU_SKELETON_WIDTHS = [70, 55, 85, 60] as const;
const SUB_MENU_SKELETON_WIDTHS = [72, 56, 82, 64] as const;

function SidebarSkeletonItems({
  widths,
  nested = false,
  showIcon,
}: {
  widths: readonly number[];
  nested?: boolean;
  showIcon?: boolean;
}) {
  const icon = showIcon ?? !nested;

  return widths.map((width, index) =>
    nested ? (
      <SidebarMenuSubItem key={`skeleton-sub-${index}`}>
        <SidebarMenuSkeleton nested width={`${width}%`} showIcon={icon} />
      </SidebarMenuSubItem>
    ) : (
      <SidebarMenuItem key={`skeleton-menu-${index}`}>
        <SidebarMenuSkeleton width={`${width}%`} showIcon={icon} />
      </SidebarMenuItem>
    ),
  );
}

function SidebarBrandButton() {
  const { state } = useSidebar();

  return (
    <SidebarRailButton
      tooltip={state === "collapsed" ? "Acme Inc" : undefined}
      aria-label="Acme Inc"
      className="size-6 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground"
    >
      <span className="text-2xs font-semibold">4</span>
    </SidebarRailButton>
  );
}

export function SidebarDemo({
  variant,
  collapsible,
  loading,
  fullscreen = false,
}: {
  variant: "sidebar" | "floating" | "inset" | "split" | "split-floating" | "split-inset";
  collapsible: "offcanvas" | "icon" | "none";
  loading: boolean;
  fullscreen?: boolean;
}) {
  const [active, setActive] = useState<string>("dashboard");
  const [dashboardSelection, setDashboardSelection] = useState("overview");
  const [mailSelection, setMailSelection] = useState("inbox");
  const [filesSelection, setFilesSelection] = useState("browse");
  const [teamSelection, setTeamSelection] = useState("members");
  const [settingsSelection, setSettingsSelection] = useState("preferences");
  const split = variant === "split" || variant === "split-floating" || variant === "split-inset";

  return (
    // The docs preview needs a containing block because the sidebar panel is fixed; the
    // fullscreen route drops that frame so the shell can own the browser viewport instead.
    <div
      className={
        fullscreen
          ? "relative h-dvh w-full overflow-hidden"
          : "relative h-[28rem] w-full overflow-hidden rounded-lg border border-border [contain:paint]"
      }
    >
      <SidebarLayout
        sidebar={
          <Sidebar
            variant={variant}
            collapsible={collapsible}
            defaultActivePanel={split ? "mail" : undefined}
            className="h-full"
            rail={
              split ? (
                <div className="flex h-full flex-col items-center gap-2">
                <SidebarRailButton
                  tooltip="Acme Inc"
                  aria-label="Acme Inc"
                  className="mt-1 mb-2 size-6 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground"
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
                  <span className="mt-1 flex h-6 items-center px-1 text-sm font-medium text-foreground">
                    Overview
                  </span>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {loading ? (
                          <SidebarSkeletonItems
                            widths={MENU_SKELETON_WIDTHS.slice(0, 2)}
                            showIcon
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="mail">
                <SidebarHeader>
                  <span className="mt-1 flex h-6 items-center px-1 text-sm font-medium text-foreground">
                    Emails
                  </span>
                  <SidebarHeaderRow>
                    <SidebarHeaderButton
                      variant="primary"
                      aria-label="Compose"
                    >
                      <Plus />
                      <span>Compose</span>
                    </SidebarHeaderButton>
                    <SidebarHeaderButton
                      variant="outline"
                      aria-label="Search mail"
                    >
                      <Search />
                      <span>Search</span>
                    </SidebarHeaderButton>
                  </SidebarHeaderRow>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Views</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {loading ? (
                          <SidebarSkeletonItems
                            widths={MENU_SKELETON_WIDTHS.slice(0, 3)}
                            showIcon
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  <SidebarGroup>
                    <SidebarGroupLabel>Mail</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {loading ? (
                          <SidebarMenuItem>
                            <SidebarMenuSkeleton showIcon width="78%" />
                            <SidebarMenuSub>
                              <SidebarSkeletonItems
                                nested
                                widths={SUB_MENU_SKELETON_WIDTHS.slice(0, 2)}
                              />
                            </SidebarMenuSub>
                          </SidebarMenuItem>
                        ) : (
                          <SidebarMenuCollapsible defaultOpen>
                            <SidebarMenuCollapsibleTrigger
                              tooltip="Folders"
                              isActive={mailSelection === "folders"}
                              onClick={() => setMailSelection("folders")}
                            >
                              <Inbox />
                              <span>Folders</span>
                              <ChevronDown className="ml-auto -rotate-90 transition-[rotate] duration-(--duration-chevron) ease-out [[data-panel-open]_&]:rotate-0" />
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
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="files">
                <SidebarHeader>
                  <span className="mt-1 flex h-6 items-center px-1 text-sm font-medium text-foreground">
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
                        {loading ? (
                          <SidebarSkeletonItems
                            widths={MENU_SKELETON_WIDTHS.slice(0, 3)}
                            showIcon
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="team">
                <SidebarHeader>
                  <span className="mt-1 flex h-6 items-center px-1 text-sm font-medium text-foreground">
                    Team
                  </span>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>People</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {loading ? (
                          <SidebarSkeletonItems
                            widths={MENU_SKELETON_WIDTHS.slice(0, 2)}
                            showIcon
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarPanel>

              <SidebarPanel value="settings">
                <SidebarHeader>
                  <span className="mt-1 flex h-6 items-center px-1 text-sm font-medium text-foreground">
                    Settings
                  </span>
                  </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Preferences</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {loading ? (
                          <SidebarSkeletonItems
                            widths={MENU_SKELETON_WIDTHS.slice(0, 2)}
                            showIcon
                          />
                        ) : (
                          <>
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
                          </>
                        )}
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
              <SidebarBrandButton />
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
                    ? <SidebarSkeletonItems widths={MENU_SKELETON_WIDTHS} showIcon />
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
                  {loading ? (
                    <SidebarMenuItem>
                      <SidebarMenuSkeleton showIcon width="78%" />
                      <SidebarMenuSub>
                        <SidebarSkeletonItems
                          nested
                          widths={SUB_MENU_SKELETON_WIDTHS}
                        />
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuCollapsible defaultOpen>
                      <SidebarMenuCollapsibleTrigger tooltip="Projects">
                        <Search />
                        <span>Browse</span>
                        <ChevronDown
                          className="ml-auto -rotate-90 transition-[rotate] duration-(--duration-chevron) ease-out [[data-panel-open]_&]:rotate-0"
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
                  )}
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
        }
        title={active[0]!.toUpperCase() + active.slice(1)}
        headerActions={
          <kbd className="rounded-xs bg-foreground/8 px-1.5 py-0.5 font-mono text-2xs text-subtle-foreground">
            ⌘B
          </kbd>
        }
        // The demo is one page — persisting the rail state to a cookie would leak
        // between visits and fight the control panel.
        persist={false}
        className="h-full"
        contentClassName="gap-3 p-4"
      >
        <div className="h-24 rounded-lg bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </SidebarLayout>
    </div>
  );
}
