"use client";

import { cn } from "@/registry/lib/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/ui/sheet/sheet";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { SidebarSplitContext, useSidebar, type SidebarSplitContextValue } from "./sidebar.context";
import { SidebarRail } from "./sidebar.controls";

// Keep the installable component's public API at this entry point.
export { useSidebar } from "./sidebar.context";
export {
  SidebarPanel,
  SidebarRail,
  SidebarRailButton,
  SidebarTrigger,
  type SidebarPanelProps,
  type SidebarRailButtonProps,
} from "./sidebar.controls";
export {
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
  type SidebarMenuButtonProps,
  type SidebarMenuCollapsibleContentProps,
  type SidebarMenuCollapsibleProps,
  type SidebarMenuCollapsibleTriggerProps,
  type SidebarMenuSkeletonProps,
  type SidebarMenuSubButtonProps,
} from "./sidebar.menu";
export { SidebarProvider, type SidebarProviderProps } from "./sidebar.provider";
export {
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
  SidebarInset,
  SidebarSeparator,
  type SidebarHeaderButtonProps,
} from "./sidebar.structure";
export {
  SidebarTabs,
  SidebarTabsList,
  SidebarTabsPanel,
  SidebarTabsTab,
  type SidebarTabsProps,
} from "./sidebar.tabs";

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

const SIDEBAR_WIDTH_MOBILE = "18rem";

const SIDEBAR_WIDTH_SPLIT_RAIL = "3rem";

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
  /**
   * Drops the automatic edge strip in split layouts. In non-split layouts, omit the
   * caller-rendered `SidebarRail` instead. For a panel an owner has pinned — a
   * controlled `open` it never changes — the strip is a control that does nothing, which
   * reads as breakage rather than as absence.
   */
  hideCollapseHandle?: boolean;
  /**
   * Classes for the mobile drawer. Collapsible and split layouts use this instead of
   * `className` below 768px. A non-split `collapsible="none"` sidebar remains inline and
   * continues to use `className` on mobile.
   */
  mobileClassName?: string;
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  rail,
  activePanel,
  defaultActivePanel = "default",
  onActivePanelChange,
  hideCollapseHandle = false,
  mobileClassName,
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
  // Framed sidebars spend 1rem on horizontal padding. Keep the wide panel's visible
  // surface the same width as the corresponding default sidebar surface instead of
  // making that padding expand the panel.
  const splitPanelWidth = splitFramed
    ? "w-[calc(var(--sidebar-width)-(--spacing(4)))]"
    : "w-(--sidebar-width)";
  const splitExpandedWidth = "w-[calc(var(--sidebar-width)+var(--sidebar-width-icon))]";
  const splitCollapsedWidth = splitFramed
    ? "group-data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
    : "group-data-[state=collapsed]:w-(--sidebar-width-icon)";
  const splitCollapsed = isSplit && collapsible !== "none" && state === "collapsed";
  const offcanvasCollapsed = !isMobile && !isSplit && collapsible === "offcanvas" && state === "collapsed";
  const offcanvasContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = offcanvasContentRef.current;
    const active = panel?.ownerDocument.activeElement;
    if (!offcanvasCollapsed || !panel || !(active instanceof HTMLElement) || !panel.contains(active)) return;
    if (active.dataset.slot === "sidebar-rail") return;

    // A keyboard shortcut can collapse navigation while focus is still inside it.
    // Return to this provider's external toggle, or its visible edge handle.
    const wrapper = panel.closest('[data-slot="sidebar-wrapper"]');
    const trigger = Array.from(wrapper?.querySelectorAll<HTMLElement>('[data-slot="sidebar-trigger"]:not([disabled])') ?? [])
      .find((node) => !panel.contains(node));
    const target = trigger ?? panel.querySelector<HTMLElement>('[data-slot="sidebar-rail"]');
    if (target) target.focus();
    else active.blur();
  }, [offcanvasCollapsed]);

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
            mobileClassName,
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
              <ScrollArea
                data-slot="sidebar-rail-column"
                className="h-full w-(--sidebar-width-icon) shrink-0 border-r border-border bg-surface"
                // `overflow-x-hidden` as on desktop: a wide rail item must not scroll sideways.
                viewportClassName="flex flex-col items-center gap-2 overflow-x-hidden! p-2"
              >
                {rail}
              </ScrollArea>
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
        // `offcanvas`, not `icon`. The split panel doesn't *become* a rail when it
        // collapses — the rail is a separate column that never leaves — so the panel just
        // closes. Reporting `icon` put every label, action and sub-menu inside it on
        // `display: none` the instant the toggle fired, which emptied the panel in one
        // frame and left a blank box to shrink. That's the "no animation": the content
        // was already gone before the width started moving.
        data-collapsible={splitCollapsed ? "offcanvas" : ""}
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
                ? "left-0 border-r-0"
                : "left-0 border-r"
              : splitInset
                ? "right-0 border-l-0"
                : "right-0 border-l",
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "flex h-full w-full min-w-0 overflow-hidden",
              splitFloating
                ? "rounded-lg shadow-border"
                : splitInset
                  ? "rounded-lg shadow-border"
                  : undefined,
            )}
          >
            <ScrollArea
              data-slot="sidebar-rail-column"
              className={cn(
                "h-full w-(--sidebar-width-icon) shrink-0 bg-surface",
                // Once the wide panel closes, this internal divider meets the
                // container's outer edge border; keep the outer line only.
                "border-r border-border group-data-[state=collapsed]:border-r-0",
              )}
              // The border leaves the padded rail one pixel narrower than its 32px controls;
              // never turn that intentional edge overlap into sideways scrolling. `!` because
              // Base UI sets the viewport's overflow inline.
              viewportClassName="flex flex-col items-center gap-2 overflow-x-hidden! p-2"
            >
              {rail}
            </ScrollArea>
            {/* `visibility` is in the transition list on purpose: it interpolates as a
                step that holds the *visible* end for the whole duration, so the panel
                stays on screen while it closes and is only hidden from AT and tab order
                once it's actually gone. Left out, it flips at frame one and the fade has
                nothing to fade. `pointer-events-none` isn't transitioned — a panel on its
                way out should stop taking clicks immediately. */}
            <div
              className={cn(
                "flex h-full shrink-0 flex-col overflow-hidden bg-surface",
                splitPanelWidth,
                "transition-[width,opacity,visibility] duration-(--duration-slow) ease-out",
                "group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:invisible",
                "group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0",
              )}
            >
              {/* Fixed at the panel's full width rather than `w-full`, so the closing
                  panel clips it instead of reflowing it. At `w-full` every row re-wraps
                  its text on the way down to zero, which is far louder than the slide. */}
              <div
                data-slot="sidebar-inner"
                className={cn("flex h-full flex-col text-foreground", splitPanelWidth)}
              >
                {children}
              </div>
            </div>
          </div>
          {!hideCollapseHandle && <SidebarRail />}
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
                    ? "border-r-0 after:pointer-events-none after:absolute after:inset-y-3 after:right-0 after:w-px after:bg-border after:content-['']"
                    : "border-l-0 after:pointer-events-none after:absolute after:inset-y-3 after:left-0 after:w-px after:bg-border after:content-['']",
                )
              : "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l border-border",
          className,
        )}
        {...props}
      >
        <div
          ref={offcanvasContentRef}
          data-slot="sidebar-inner"
          style={{ visibility: offcanvasCollapsed ? "hidden" : undefined }}
          className={cn(
            "flex h-full w-full flex-col bg-surface transition-[visibility] duration-(--duration-slow)",
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
