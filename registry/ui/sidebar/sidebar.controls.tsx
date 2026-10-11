import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Tooltip, TooltipProvider } from "@/registry/ui/tooltip/tooltip";
import { PanelLeft, PanelRight } from "lucide-react";
import { useContext, type ComponentProps, type ReactNode } from "react";
import { SidebarSplitContext, useSidebar } from "./sidebar.context";
import { sidebarRailButtonVariants } from "./sidebar.variants";

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { isMobile, openMobile, state, toggleSidebar } = useSidebar();
  const isOpen = isMobile ? openMobile : state === "expanded";

  return (
    <TooltipProvider delay={500}>
      <Tooltip
        content={
          <kbd>Ctrl/⌘ B</kbd>
        }
        delay={500}
      >
        <Button
          data-slot="sidebar-trigger"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle sidebar"
          className={className}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) toggleSidebar();
          }}
          {...props}
        >
          {isOpen ? <PanelLeft aria-hidden="true" /> : <PanelRight aria-hidden="true" />}
        </Button>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface SidebarRailButtonProps extends ComponentProps<"button"> {
  isActive?: boolean;
  /** The wide panel selected by this button when it is inside a split sidebar. */
  value?: string;
  /** Optional label beside the fixed rail. Its tooltip animates even when the group is warm. */
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
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (value !== undefined && splitContext !== null) {
          splitContext.setActivePanel(value);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip == null) return button;

  return (
    <Tooltip
      content={tooltip}
      side="right"
      disableHoverablePopup
      // Keep the rail's descriptions animated while the shared provider is warm.
      className="data-instant:transition-[opacity,scale,translate,filter]"
      // The popup is portalled, but the positioner itself still needs a stacking
      // level so an expanded contextual column cannot paint over the rail tooltip.
      positionerProps={{ className: "z-50" }}
    >
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
        "visible absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 sm:flex",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize",
        "[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
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
