"use client";

import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { PanelLeft } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/ui/sheet/sheet";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { Tooltip, TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import {
  sidebarMenuButtonVariants,
  sidebarMenuSubButtonVariants,
  sidebarRailButtonVariants,
  type SidebarMenuButtonVariants,
  type SidebarMenuSubButtonVariants,
} from "./sidebar.variants";

/**
 * An application sidebar: a collapsible nav rail with a mobile drawer.
 *
 * There's no Base UI "sidebar" — it's a composition, and the parts that *do* have
 * primitives use them. The mobile drawer is our Sheet (Base UI Dialog: focus trap,
 * scroll lock, dismiss), the collapsed labels are our Tooltip (Base UI Tooltip), and
 * the dividers are Base UI's Separator. What's left — a width, a breakpoint, and some
 * state — is genuinely just layout, and pretending otherwise would mean wrapping a
 * primitive around a `<div>`.
 *
 * **This component animates `width`, which the contract otherwise forbids.** It's a
 * considered exception, not an oversight. The whole point of collapsing a sidebar is
 * that the page beside it reflows, and no transform can move a sibling's layout — a
 * translated panel would slide while the content it makes room for snapped. So the
 * relayout is the feature. It's bounded: two elements, one user-initiated transition,
 * on click rather than on hover or scroll. The durations come from `--duration-slow`
 * like everything else, which also means reduced motion collapses it to 1ms for free.
 *
 * Row highlights are instant — no transition on the hover or active background. A
 * highlight that fades in trails the pointer as it runs down a list.
 */

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_WIDTH_SPLIT_RAIL = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const MOBILE_BREAKPOINT = 768;
const SIDEBAR_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

/* -- State ---------------------------------------------------------------------------- */

interface SidebarContextValue {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarSplitContextValue {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

const SidebarSplitContext = createContext<SidebarSplitContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("Sidebar parts must be used inside <SidebarProvider>.");
  return context;
}

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

/* -- Shell ---------------------------------------------------------------------------- */

export interface SidebarProps extends ComponentProps<"div"> {
  side?: "left" | "right";
  /** `split` adds a fixed icon rail beside the regular sidebar panel. */
  variant?:
    | "sidebar"
    | "floating"
    | "inset"
    | "split"
    | "split-floating"
    | "split-inset";
  /** `offcanvas` slides away entirely; `icon` leaves a rail; `none` never collapses. */
  collapsible?: "offcanvas" | "icon" | "none";
  /** Icon-only content for the fixed rail shown by the `split` variant. */
  rail?: ReactNode;
  /** The value of the wide panel currently selected by a split rail button. */
  activePanel?: string;
  /** The initially selected wide panel when `activePanel` is uncontrolled. */
  defaultActivePanel?: string;
  /** Called when a split rail button selects a different wide panel. */
  onActivePanelChange?: (panel: string) => void;
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  rail,
  activePanel,
  defaultActivePanel = "default",
  onActivePanelChange,
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const [uncontrolledActivePanel, setUncontrolledActivePanel] = useState(defaultActivePanel);
  const isActivePanelControlled = activePanel !== undefined;
  const currentActivePanel = isActivePanelControlled ? activePanel : uncontrolledActivePanel;
  const setActivePanel = useCallback(
    (panel: string) => {
      if (!isActivePanelControlled) setUncontrolledActivePanel(panel);
      onActivePanelChange?.(panel);
    },
    [isActivePanelControlled, onActivePanelChange],
  );
  const splitContextValue = useMemo<SidebarSplitContextValue>(
    () => ({ activePanel: currentActivePanel, setActivePanel }),
    [currentActivePanel, setActivePanel],
  );
  const isSplit =
    variant === "split" || variant === "split-floating" || variant === "split-inset";
  const splitFloating = variant === "split-floating";
  const splitInset = variant === "split-inset";
  const splitFramed = splitFloating || splitInset;
  const splitExpandedWidth = splitFramed
    ? "w-[calc(var(--sidebar-width)+var(--sidebar-width-icon)+(--spacing(4)))]"
    : "w-[calc(var(--sidebar-width)+var(--sidebar-width-icon))]";
  const splitCollapsedWidth = splitFramed
    ? "group-data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
    : "group-data-[state=collapsed]:w-(--sidebar-width-icon)";
  const splitCollapsed = isSplit && collapsible !== "none" && state === "collapsed";

  if (collapsible === "none" && !isSplit) {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-surface text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    const mobileSidebar = (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          showClose={false}
          data-slot="sidebar"
          data-mobile="true"
          className={cn(
            isSplit
              ? "w-[calc(var(--sidebar-width)+var(--sidebar-width-icon))]"
              : "w-(--sidebar-width)",
            "bg-surface p-0",
          )}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...(isSplit
                ? { "--sidebar-width-icon": SIDEBAR_WIDTH_SPLIT_RAIL }
                : {}),
            } as CSSProperties
          }
        >
          {/* The drawer is a dialog and needs a name, but the nav is self-describing. */}
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Site navigation.</SheetDescription>
          </SheetHeader>
          {isSplit ? (
            <div className="flex h-full w-full">
              <div
                data-slot="sidebar-rail-column"
                className={cn(
                  "flex h-full w-(--sidebar-width-icon) shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface p-2",
                  SIDEBAR_SCROLLBAR,
                  "border-r border-border",
                )}
              >
                {rail}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">{children}</div>
          )}
        </SheetContent>
      </Sheet>
    );

    return isSplit ? (
      <SidebarSplitContext.Provider value={splitContextValue}>
        {mobileSidebar}
      </SidebarSplitContext.Provider>
    ) : (
      mobileSidebar
    );
  }

  if (isSplit) {
    const splitSidebar = (
      <div
        className="group peer hidden text-foreground md:block"
        style={{ "--sidebar-width-icon": SIDEBAR_WIDTH_SPLIT_RAIL } as CSSProperties}
        data-state={splitCollapsed ? "collapsed" : "expanded"}
        data-collapsible={splitCollapsed ? "icon" : ""}
        data-variant={variant}
        data-side={side}
        data-slot="sidebar"
      >
        <div
          data-slot="sidebar-gap"
          className={cn(
            "relative bg-transparent transition-[width] duration-(--duration-slow) ease-out",
            splitExpandedWidth,
            splitCollapsedWidth,
          )}
        />
        <div
          data-slot="sidebar-container"
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh md:flex border-border transition-[width,border-color] duration-(--duration-slow) ease-out",
            splitExpandedWidth,
            splitCollapsedWidth,
            splitFloating && "p-2",
            splitInset && "inset-y-2 h-auto! px-2",
            side === "left"
              ? splitInset
                ? "left-0 border-r-0 after:pointer-events-none after:absolute after:inset-y-3 after:right-0 after:w-px after:bg-border after:content-[''] after:transition-[background-color] after:duration-(--duration-fast) after:ease-out [&:has(>[data-slot=sidebar-rail]:hover)]:after:bg-border-strong"
                : "left-0 border-r [&:has(>[data-slot=sidebar-rail]:hover)]:border-r-border-strong"
              : splitInset
                ? "right-0 border-l-0 after:pointer-events-none after:absolute after:inset-y-3 after:left-0 after:w-px after:bg-border after:content-[''] after:transition-[background-color] after:duration-(--duration-fast) after:ease-out [&:has(>[data-slot=sidebar-rail]:hover)]:after:bg-border-strong"
                : "right-0 border-l [&:has(>[data-slot=sidebar-rail]:hover)]:border-l-border-strong",
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "flex h-full w-full min-w-0 overflow-hidden",
              splitFramed && "rounded-lg shadow-border",
            )}
          >
            <div
              data-slot="sidebar-rail-column"
              className={cn(
                "flex h-full w-(--sidebar-width-icon) shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface p-2",
                SIDEBAR_SCROLLBAR,
                "border-r border-border",
              )}
            >
              {rail}
            </div>
            <div
              className={cn(
                "flex h-full w-(--sidebar-width) shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-(--duration-slow) ease-out",
                "group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:invisible group-data-[state=collapsed]:w-0",
              )}
            >
              <div data-slot="sidebar-inner" className="flex h-full w-full flex-col text-foreground">
                {children}
              </div>
            </div>
          </div>
          <SidebarRail />
        </div>
      </div>
    );

    return (
      <SidebarSplitContext.Provider value={splitContextValue}>
        {splitSidebar}
      </SidebarSplitContext.Provider>
    );
  }

  return (
    <div
      className="group peer hidden text-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* The panel itself is `fixed`, so this spacer is what actually holds the space
          open in flow. Both animate the same width over the same duration — that pairing
          is the whole trick, and letting them drift is what makes a sidebar look broken
          mid-collapse. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent",
          "transition-[width] duration-(--duration-slow) ease-out",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex",
          "transition-[left,right,width] duration-(--duration-slow) ease-out",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? variant === "inset"
              ? cn(
                  "inset-y-2 h-auto! px-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]",
                  side === "left"
                    ? "border-r-0 after:pointer-events-none after:absolute after:inset-y-3 after:right-0 after:w-px after:bg-border after:content-[''] after:transition-[background-color] after:duration-(--duration-fast) after:ease-out [&:has([data-slot=sidebar-rail]:hover)]:after:bg-border-strong"
                    : "border-l-0 after:pointer-events-none after:absolute after:inset-y-3 after:left-0 after:w-px after:bg-border after:content-[''] after:transition-[background-color] after:duration-(--duration-fast) after:ease-out [&:has([data-slot=sidebar-rail]:hover)]:after:bg-border-strong",
                )
              : "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l border-border",
          className,
        )}
        {...props}
      >
        <div
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col bg-surface",
            // Floating and inset surfaces both need a bounded, rounded edge.
            "group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-border",
            "group-data-[variant=inset]:rounded-lg group-data-[variant=inset]:shadow-border",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle sidebar"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
}

export interface SidebarRailButtonProps extends ComponentProps<"button"> {
  isActive?: boolean;
  /** The wide panel selected by this button when it is inside a split sidebar. */
  value?: string;
  /** Optional label shown in a tooltip beside the fixed rail. */
  tooltip?: ReactNode;
}

/** An icon-only navigation control for the `split` sidebar rail. */
export function SidebarRailButton({
  className,
  isActive = false,
  value,
  tooltip,
  children,
  "aria-label": ariaLabel,
  onClick,
  ...props
}: SidebarRailButtonProps) {
  const splitContext = useContext(SidebarSplitContext);
  const resolvedActive =
    value !== undefined && splitContext !== null
      ? splitContext.activePanel === value
      : isActive;

  const button = (
    <button
      type="button"
      data-slot="sidebar-rail-button"
      data-active={resolvedActive || undefined}
      aria-current={resolvedActive ? "page" : undefined}
      aria-label={ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined)}
      className={cn(sidebarRailButtonVariants(), className)}
      onClick={(event) => {
        if (value !== undefined && splitContext !== null) {
          splitContext.setActivePanel(value);
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip == null) return button;

  return (
    <Tooltip content={tooltip} side="right">
      {button}
    </Tooltip>
  );
}

export interface SidebarPanelProps extends ComponentProps<"div"> {
  /** The value selected by the matching `SidebarRailButton`. */
  value: string;
}

/**
 * One independent wide panel in a `split` sidebar. Only the panel whose value
 * matches the active rail button is mounted.
 */
export function SidebarPanel({ value, className, children, ...props }: SidebarPanelProps) {
  const splitContext = useContext(SidebarSplitContext);

  if (splitContext !== null && splitContext.activePanel !== value) return null;

  return (
    <div
      data-slot="sidebar-panel"
      data-panel={value}
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The hit strip along the sidebar's edge. `tabIndex={-1}` on purpose: it's a pointer
 * shortcut for the trigger, and a second tab stop that does the same thing is noise for
 * anyone navigating by keyboard.
 */
export function SidebarRail({ className, onClick, ...props }: ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      title="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 sm:flex",
        "transition-[background-color] duration-(--duration-fast) ease-out",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px hover:after:bg-border-strong",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize",
        "[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "hover:group-data-[collapsible=offcanvas]:bg-surface",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        "group-data-[variant=inset]:after:hidden group-data-[variant=split]:after:hidden group-data-[variant=split-floating]:after:hidden group-data-[variant=split-inset]:after:hidden",
        className,
      )}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleSidebar();
      }}
    />
  );
}

/** The main column beside the sidebar. `inset` floats it as a card. */
export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=split-inset]:m-2",
        "md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=split-inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=split-inset]:rounded-xl",
        "md:peer-data-[variant=inset]:shadow-border md:peer-data-[variant=split-inset]:shadow-border",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      className={cn("h-8 w-full bg-background", className)}
      {...props}
    />
  );
}

export type SidebarHeaderButtonProps = ButtonProps;

/** A full-width action that can occupy the same header slot as `SidebarInput`. */
export function SidebarHeaderButton({
  className,
  variant = "outline",
  size = "sm",
  ...props
}: SidebarHeaderButtonProps) {
  return (
    <Button
      data-slot="sidebar-header-button"
      variant={variant}
      size={size}
      className={cn("w-full justify-start", className)}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseSeparator>) {
  return (
    <BaseSeparator
      data-slot="sidebar-separator"
      className={cn("mx-2 h-px w-auto bg-border", className)}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        SIDEBAR_SCROLLBAR,
        // Collapsed, the labels are wider than the rail; clipping beats a scrollbar
        // appearing every time the sidebar closes.
        "group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

/* -- Groups --------------------------------------------------------------------------- */

export function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-subtle-foreground",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Collapsing pulls the label up into its own height and fades it, so the rows
        // close the gap rather than leaving a hole where the heading was.
        "transition-[margin,opacity] duration-(--duration-slow) ease-out",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      className={cn(
        // The 14px inset centers this 16px glyph on the same vertical line as a menu
        // row's trailing icon inside its 8px right padding.
        "absolute top-3.5 right-3.5 flex aspect-square w-5 cursor-pointer items-center justify-center rounded-md p-0",
        "text-muted-foreground outline-none hover:bg-transparent hover:text-white",
        "focus-visible:ring-2 focus-visible:ring-ring",
        // A 20px control is under the comfortable touch target, so the hit area is
        // widened on pointer-coarse devices without moving the glyph.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

/* -- Menu ----------------------------------------------------------------------------- */

export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      // No gap: rows sit flush so their hit areas and hover highlights touch, leaving no
      // dead strip between two rows where the pointer belongs to neither.
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

export type SidebarMenuCollapsibleProps = Omit<
  ComponentProps<typeof BaseCollapsible.Root>,
  "className" | "render"
> & {
  className?: string;
};

/**
 * A reusable expandable menu row. Base UI owns the open state, keyboard behavior,
 * and aria attributes; the root renders as a valid list item inside `SidebarMenu`.
 */
export function SidebarMenuCollapsible({
  className,
  children,
  ...props
}: SidebarMenuCollapsibleProps) {
  return (
    <BaseCollapsible.Root
      {...props}
      data-slot="sidebar-menu-collapsible"
      render={
        <li
          className={cn(
            "group/menu-item group/menu-collapsible relative",
            className,
          )}
        />
      }
    >
      {children}
    </BaseCollapsible.Root>
  );
}

export interface SidebarMenuButtonProps
  extends ComponentProps<"button">,
    SidebarMenuButtonVariants {
  asChild?: boolean;
  isActive?: boolean;
  /** Shown as a tooltip only while the rail is collapsed — the label is gone then. */
  tooltip?: ReactNode;
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant,
  size,
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-size={size ?? "default"}
      data-active={isActive || undefined}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  // Only when there's nothing else to read. Expanded, the label is right there, and a
  // tooltip repeating it is noise that follows the pointer around.
  if (!tooltip || state !== "collapsed" || isMobile) return button;

  return (
    <Tooltip content={tooltip} side="right">
      {button}
    </Tooltip>
  );
}

export type SidebarMenuCollapsibleTriggerProps = Omit<SidebarMenuButtonProps, "asChild">;

/** A SidebarMenuButton wired to its surrounding SidebarMenuCollapsible root. */
export function SidebarMenuCollapsibleTrigger({
  className,
  children,
  disabled,
  ...props
}: SidebarMenuCollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      disabled={disabled}
      render={
        <SidebarMenuButton {...props} disabled={disabled} className={className}>
          {children}
        </SidebarMenuButton>
      }
    />
  );
}

export type SidebarMenuCollapsibleContentProps = Omit<
  ComponentProps<typeof BaseCollapsible.Panel>,
  "className"
> & {
  className?: string;
};

/** The nested content controlled by SidebarMenuCollapsibleTrigger. */
export function SidebarMenuCollapsibleContent({
  className,
  ...props
}: SidebarMenuCollapsibleContentProps) {
  return (
    <BaseCollapsible.Panel
      {...props}
      data-slot="sidebar-menu-collapsible-content"
      className={cn("min-w-0", className)}
    />
  );
}

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  nested = false,
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
  /** Marks the action as belonging to a nested menu row. */
  nested?: boolean;
}) {
  return (
    <Button
      asChild={asChild}
      variant="plain"
      size="icon-sm"
      pressScale={false}
      data-slot={nested ? "sidebar-menu-sub-action" : "sidebar-menu-action"}
      {...props}
      className={cn(
        // Keep the Button's shared behavior, but preserve the compact action's
        // existing 20px visual box and row geometry.
        "absolute top-1.5 right-1.5 z-[1] size-5 cursor-pointer rounded-md p-0",
        nested && "top-1 right-[7px]",
        "text-muted-foreground outline-none hover:bg-transparent hover:text-primary-foreground dark:hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        // Hidden until the row is hovered or focused — but never on touch, where there's
        // no hover to reveal it and the action would be unreachable.
        showOnHover &&
          (nested
            ? "md:opacity-0 group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 group-has-data-[active=true]/menu-sub-item:opacity-100 data-[state=open]:opacity-100"
            : "md:opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 group-has-data-[active=true]/menu-item:opacity-100 data-[state=open]:opacity-100"),
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1",
        // Tabular figures so a counter ticking 9 → 10 doesn't shift the digits around.
        "text-xs font-medium tabular-nums text-muted-foreground select-none",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export interface SidebarMenuSkeletonProps extends ComponentProps<"div"> {
  showIcon?: boolean;
  /** Uses the shorter, indented geometry of a nested menu row. */
  nested?: boolean;
  /**
   * Width of the text bar, e.g. `"70%"`.
   *
   * Deliberately a prop rather than the random value the original picks during render:
   * a random width is a different string on the server than in the browser, which is a
   * hydration mismatch on every row. Vary it from the caller by index instead.
   */
  width?: string;
}

export function SidebarMenuSkeleton({
  className,
  nested = false,
  showIcon = false,
  width = "70%",
  ...props
}: SidebarMenuSkeletonProps) {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      className={cn(
        "flex items-center gap-2 rounded-md px-2",
        nested ? "h-7 w-full min-w-0 -translate-x-px" : "h-8",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" />}
      <Skeleton className="h-4 max-w-(--skeleton-width) flex-1" style={{ "--skeleton-width": width } as CSSProperties} />
    </div>
  );
}

/* -- Sub-menu ------------------------------------------------------------------------- */

export function SidebarMenuSub({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn(
        // Flush rows here too — no vertical padding, so the first sub-row touches the
        // parent row above it and the highlights stay contiguous across the nesting.
        "ml-3.5 mr-0 flex min-w-0 translate-x-px flex-col border-l border-border pl-2.5 pr-0",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

export interface SidebarMenuSubButtonProps
  extends ComponentProps<"a">,
    SidebarMenuSubButtonVariants {
  asChild?: boolean;
  isActive?: boolean;
}

export function SidebarMenuSubButton({
  asChild = false,
  size,
  isActive = false,
  className,
  ...props
}: SidebarMenuSubButtonProps) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-size={size ?? "md"}
      data-active={isActive || undefined}
      className={cn(sidebarMenuSubButtonVariants({ size }), className)}
      {...props}
    />
  );
}
