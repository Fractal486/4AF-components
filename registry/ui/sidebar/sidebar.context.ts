import { createContext, useContext } from "react";

/* -- State ---------------------------------------------------------------------------- */

export interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export interface SidebarSplitContextValue {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export const SidebarSplitContext = createContext<SidebarSplitContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("Sidebar parts must be used inside <SidebarProvider>.");
  return context;
}
