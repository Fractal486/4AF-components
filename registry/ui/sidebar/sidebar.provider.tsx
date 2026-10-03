import { cn } from "@/registry/lib/cn";
import { TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { SidebarContext, type SidebarContextValue } from "./sidebar.context";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const SIDEBAR_WIDTH = "16rem";

const SIDEBAR_WIDTH_ICON = "3rem";

const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const MOBILE_BREAKPOINT = 768;

/**
 * Starts `false` rather than reading the viewport during render: the server has no
 * viewport, so a guess here would disagree with the first client render and hydration
 * would swap the whole sidebar for a Sheet mid-mount.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

export interface SidebarProviderProps extends ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Persist the open state to a cookie so the server can render it already correct. */
  persist?: boolean;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  persist = true,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolled;
  const previousOpen = useRef(open);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    const changed = previousOpen.current !== open;
    previousOpen.current = open;

    // A controlled owner may reject a toggle request. Persist only the state that was
    // actually rendered, never the requested state, so server and client stay aligned.
    if (persist && changed) {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }
  }, [open, persist]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  }, [isMobile, open, openMobile, setOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      {/* One provider for every collapsed-rail tooltip, so they share a hover timer:
          moving between rail icons shows the next one immediately instead of re-waiting. */}
      <TooltipProvider delay={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
