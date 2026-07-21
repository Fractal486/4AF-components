import { FileText, Inbox } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/registry/ui/sidebar/sidebar";
import { SidebarLayout } from "@/registry/ui/sidebar-layout/sidebar-layout";
import { defineEntry } from "../schema";

export const sidebarLayoutEntry = defineEntry({
  slug: "sidebar-layout",
  name: "Sidebar Layout",
  controls: {},
  fullscreen: true,
  render() {
    return (
      <div className="h-64 w-full overflow-hidden rounded-lg shadow-border">
        <SidebarLayout
          title="Inbox"
          sidebar={
            <Sidebar>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive>
                          <Inbox />
                          Inbox
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <FileText />
                          Drafts
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          }
        >
          <div className="p-6 text-sm text-muted-foreground">Your messages appear here.</div>
        </SidebarLayout>
      </div>
    );
  },
});
