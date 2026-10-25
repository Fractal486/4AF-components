import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
import { Button } from "@/registry/ui/button/button";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useSidebar } from "./sidebar.context";
import {
  sidebarMenuButtonVariants,
  sidebarMenuSubButtonVariants,
  type SidebarMenuButtonVariants,
  type SidebarMenuSubButtonVariants,
} from "./sidebar.variants";

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

export interface SidebarMenuCollapsibleTriggerProps
  extends Omit<SidebarMenuButtonProps, "asChild"> {
  /**
   * Whether to render the standard trailing chevron. Pass `false` when supplying a
   * custom indicator inside the trigger.
   * @default true
   */
  chevron?: boolean;
}

/** A SidebarMenuButton wired to its surrounding SidebarMenuCollapsible root. */
export function SidebarMenuCollapsibleTrigger({
  className,
  children,
  chevron = true,
  disabled,
  ...props
}: SidebarMenuCollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      disabled={disabled}
      render={
        <SidebarMenuButton
          {...props}
          disabled={disabled}
          className={cn(
            // Sibling badges and actions are positioned in slots immediately before the
            // chevron. Reset the generic action padding so the chevron can stay at the
            // true end of the trigger, then reserve those slots in the trigger's flow.
            "group-has-data-[slot=sidebar-menu-action]/menu-collapsible:pr-2!",
            className,
          )}
        >
          {children}
          {chevron && (
            <>
              <span
                aria-hidden="true"
                data-slot="sidebar-menu-badge-spacer"
                className="hidden w-7 shrink-0 group-data-[collapsible=icon]:hidden group-has-data-[slot=sidebar-menu-badge]/menu-collapsible:block"
              />
              <span
                aria-hidden="true"
                data-slot="sidebar-menu-action-spacer"
                className="hidden w-7 shrink-0 group-data-[collapsible=icon]:hidden group-has-data-[slot=sidebar-menu-action]/menu-collapsible:block"
              />
              <ChevronDown
                aria-hidden="true"
                data-slot="sidebar-menu-chevron"
                className="order-last ml-auto shrink-0 -rotate-90 transition-[rotate] duration-(--duration-chevron) ease-out group-data-[collapsible=icon]:hidden [[data-panel-open]_&]:rotate-0"
              />
            </>
          )}
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
        "absolute top-1.5 right-1.5 z-[1] size-5 cursor-default rounded-[6px] p-0",
        nested && "top-1 right-[7px]",
        "text-muted-foreground outline-none hover:bg-transparent hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        !nested &&
          "group-has-data-[slot=sidebar-menu-chevron]/menu-collapsible:right-8",
        // Hidden until the row is hovered or focused — but never on touch, where there's
        // no hover to reveal it and the action would be unreachable.
        showOnHover &&
          (nested
            ? "md:opacity-0 group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 group-has-data-[active=true]/menu-sub-item:opacity-100 data-[state=open]:opacity-100"
            : "md:opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 group-has-data-[active=true]/menu-item:opacity-100 data-[state=open]:opacity-100"),
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
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
        "group-has-data-[slot=sidebar-menu-chevron]/menu-collapsible:right-8",
        "group-has-data-[slot=sidebar-menu-action]/menu-collapsible:right-14!",
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
      {showIcon && <Skeleton className="size-4" />}
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
