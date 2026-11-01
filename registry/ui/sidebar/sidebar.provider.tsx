import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import {
  useCallback,
  useEffect,
  useId,
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

const SIDEBAR_KEYBOARD_SHORTCUT = "mod+b";

const shortcutOwners = new Map<string, { element: HTMLDivElement; shortcut: string }>();

function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const parts = shortcut.toLowerCase().split("+").map((part) => part.trim());
  const key = parts.pop();
  if (!key || parts.some((part) => !["mod", "ctrl", "meta", "alt", "shift"].includes(part))) return false;
  const apple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
  const ctrl = parts.includes("ctrl") || (parts.includes("mod") && !apple);
  const meta = parts.includes("meta") || (parts.includes("mod") && apple);
  return event.key.toLowerCase() === (key === "space" ? " " : key)
    && event.ctrlKey === ctrl && event.metaKey === meta
    && event.altKey === parts.includes("alt") && event.shiftKey === parts.includes("shift");
}

function isEditing(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const editable = target.closest("[contenteditable]")?.getAttribute("contenteditable");
  return target.isContentEditable || (editable !== undefined && editable !== null && editable !== "false")
    || Boolean(target.closest("input, textarea, select, [role=textbox]"));
}

function shortcutOwner(event: KeyboardEvent) {
  let scope = (document.activeElement instanceof Element ? document.activeElement : null)
    ?.closest<HTMLElement>("[data-sidebar-scope]");
  while (scope) {
    const id = scope.dataset.sidebarScope!;
    const owner = shortcutOwners.get(id);
    if (owner && matchesShortcut(event, owner.shortcut)) return id;
    scope = scope.parentElement?.closest<HTMLElement>("[data-sidebar-scope]") ?? null;
  }
  // DOM order, rather than effect registration order, also handles nested providers.
  return [...shortcutOwners.entries()]
    .filter(([, owner]) => matchesShortcut(event, owner.shortcut))
    .sort(([, a], [, b]) => a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1)[0]?.[0];
}

export function sidebarShortcutLabel(shortcut: string) {
  const labels: Record<string, string> = { mod: "Ctrl/⌘", ctrl: "Ctrl", meta: "⌘", alt: "Alt", shift: "Shift", space: "Space" };
  return shortcut.split("+").map((part) => labels[part.trim().toLowerCase()] ?? part.trim().toUpperCase()).join(" + ");
}

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
  /** A key combination such as `mod+b` or `ctrl+shift+s`; null disables it. */
  keyboardShortcut?: string | null;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  persist = true,
  keyboardShortcut = SIDEBAR_KEYBOARD_SHORTCUT,
  className,
  style,
  children,
  ref,
  ...props
}: SidebarProviderProps) {
  const shortcutScope = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useMergedRefs(wrapperRef, ref);
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
    const element = wrapperRef.current;
    if (!element || !keyboardShortcut) return;
    shortcutOwners.set(shortcutScope, { element, shortcut: keyboardShortcut });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || isEditing(event.target)
        || !matchesShortcut(event, keyboardShortcut) || shortcutOwner(event) !== shortcutScope) return;
      event.preventDefault();
      toggleSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      shortcutOwners.delete(shortcutScope);
    };
  }, [keyboardShortcut, shortcutScope, toggleSidebar]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      shortcutScope,
      keyboardShortcut,
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar, shortcutScope, keyboardShortcut],
  );

  return (
    <SidebarContext.Provider value={value}>
      {/* One provider for every collapsed-rail tooltip, so they share a hover timer:
          moving between rail icons shows the next one immediately instead of re-waiting. */}
      <TooltipProvider delay={0}>
        <div
          ref={wrapperRefs}
          data-sidebar-scope={shortcutScope}
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
