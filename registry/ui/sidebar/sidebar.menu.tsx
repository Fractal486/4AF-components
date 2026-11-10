"use client";

import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { Slot } from "@/registry/lib/slot";
import { Button } from "@/registry/ui/button/button";
import { BadgeCount } from "@/registry/ui/badge/badge";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useContext, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { SidebarContext, useSidebar } from "./sidebar.context";
import {
  sidebarMenuButtonVariants,
  sidebarMenuCollapsiblePanelVariants,
  sidebarMenuCollapsibleContentVariants,
  sidebarMenuBadgeVariants,
  sidebarMenuReplacementActionVariants,
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

  if (!tooltip) return button;

  return (
    <Tooltip
      content={tooltip}
      // Only when there's nothing else to read. Expanded, the label is right there, and a
      // tooltip repeating it is noise that follows the pointer around. Disabled rather than
      // left out, so collapsing doesn't change the tree: wrapping the row only once it
      // collapsed remounted it in its collapsed state, so its label never faded and an `sm`
      // row's height snapped to the rail's 32px instead of growing into it.
      disabled={state !== "collapsed" || isMobile}
      side="right"
      // The collapsed rail shares one warm provider; keep each row's tooltip animating
      // as the pointer runs down the icons instead of switching instantly.
      className="data-instant:transition-[opacity,scale,translate,filter]"
    >
      {button}
    </Tooltip>
  );
}

export interface SidebarMenuCollapsibleTriggerProps
  extends Omit<SidebarMenuButtonProps, "asChild"> {
  /** For a page-like row, pass its selection state. Inactive rows open without closing;
   * active rows toggle. Omit for a disclosure-only row that always toggles. */
  isActive?: boolean;
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
  isActive,
  onClick,
  ...props
}: SidebarMenuCollapsibleTriggerProps) {
  const separateChevron = chevron && isActive !== undefined;
  return (
    <>
    <BaseCollapsible.Trigger
      disabled={disabled}
      onClick={(event) => {
        // Read the selection from before the caller changes pages. An already-open
        // inactive page should stay open while the click selects it.
        const keepOpen = isActive === false && event.currentTarget.getAttribute("aria-expanded") === "true";
        onClick?.(event);
        if (keepOpen) event.preventBaseUIHandler();
      }}
      render={
        <SidebarMenuButton
          {...props}
          disabled={disabled}
          isActive={isActive}
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
                className="hidden w-7 shrink-0 group-data-[collapsible=icon]:hidden group-has-data-[slot=sidebar-menu-badge]/menu-collapsible:block pointer-fine:group-has-[>_[data-replaces-badge]]/menu-collapsible:hidden"
              />
              <span
                aria-hidden="true"
                data-slot="sidebar-menu-action-spacer"
                className="hidden w-7 shrink-0 group-data-[collapsible=icon]:hidden group-has-data-[slot=sidebar-menu-action]/menu-collapsible:block"
              />
              {separateChevron ? <span aria-hidden="true" className="order-last ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" /> : <ChevronDown
                aria-hidden="true"
                data-slot="sidebar-menu-chevron"
                className="order-last ml-auto shrink-0 -rotate-90 transition-[rotate] duration-(--duration-chevron) ease-out group-data-[collapsible=icon]:hidden [[data-panel-open]_&]:rotate-0"
              />}
            </>
          )}
        </SidebarMenuButton>
      }
    />
    {separateChevron && (
      <BaseCollapsible.Trigger
        disabled={disabled}
        aria-label="Toggle section"
        render={
          <Button
            variant="plain"
            size="icon-sm"
            pressScale={false}
            data-slot="sidebar-menu-chevron-button"
            className="absolute top-0 right-1 h-8 w-6 cursor-default rounded-[6px] p-0 text-muted-foreground hover:text-foreground peer-data-[size=sm]/menu-button:h-7 peer-data-[size=lg]/menu-button:h-12 group-data-[collapsible=icon]:hidden"
          >
            <ChevronDown aria-hidden="true" data-slot="sidebar-menu-chevron"
              className="size-4 -rotate-90 transition-[rotate] duration-(--duration-chevron) ease-out [[data-panel-open]_&]:rotate-0" />
          </Button>
        }
      />
    )}
    </>
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
  children,
  ...props
}: SidebarMenuCollapsibleContentProps) {
  return (
    <BaseCollapsible.Panel
      {...props}
      data-slot="sidebar-menu-collapsible-content"
      className={cn(sidebarMenuCollapsiblePanelVariants(), className)}
    >
      <div data-slot="sidebar-menu-collapsible-body" className={sidebarMenuCollapsibleContentVariants()}>
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

export interface SidebarMenuActionProps extends ComponentProps<"button"> {
  asChild?: boolean;
  showOnHover?: boolean;
  /** Shares the badge's slot on hover/focus; touch keeps both visible in separate slots. */
  replacesBadge?: boolean;
  /** Marks the action as belonging to a nested menu row. */
  nested?: boolean;
}

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  nested = false,
  replacesBadge = false,
  ...props
}: SidebarMenuActionProps) {
  return (
    <Button
      asChild={asChild}
      variant="plain"
      size="icon-sm"
      pressScale={false}
      data-slot={nested ? "sidebar-menu-sub-action" : "sidebar-menu-action"}
      data-replaces-badge={replacesBadge || undefined}
      data-nested={nested || undefined}
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
        showOnHover && !replacesBadge &&
          (nested
            ? "md:opacity-0 group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 group-has-data-[active=true]/menu-sub-item:opacity-100 data-[state=open]:opacity-100"
            : "md:opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 group-has-data-[active=true]/menu-item:opacity-100 data-[state=open]:opacity-100"),
        "[&>svg]:size-4 [&>svg]:shrink-0",
        sidebarMenuReplacementActionVariants(),
        className,
      )}
    />
  );
}

export interface SidebarMenuBadgeProps extends ComponentProps<"div"> {
  /** Zero and negative counts hide the badge. Legacy custom children still work without count. */
  count?: number;
  max?: number;
  label?: string;
  locales?: Intl.LocalesArgument;
  animated?: boolean;
  dot?: boolean;
  tone?: "default" | "success" | "warning" | "destructive";
}

/** A CSS duration token in milliseconds, so JS timing follows the motion controls. */
function durationToken(element: HTMLElement, name: string) {
  const token = getComputedStyle(element).getPropertyValue(name).trim();
  return (Number.parseFloat(token) || 0) * (token.endsWith("ms") ? 1 : 1000);
}

/**
 * Collapsing into the icon rail, a badge is pinned to its row's right edge, which travels the
 * whole width of the collapse, so a visible count would slide across with it. Instead the
 * count fades out over the collapse's first half (`--duration-fast`, half of
 * `--duration-slow`), held by `data-hold` because the rail's CSS would otherwise swap it for
 * the dot in the first frame; at the midpoint it becomes the dot, which fades in over the
 * second half. Expanding, the count comes back with the row's action: both are there from
 * the first frame, the count fading in over `--duration-fast`. Only rail changes: an
 * offcanvas sidebar slides away whole. Mount keeps the plain CSS state.
 */
function useSettleWithRail(ref: { current: HTMLElement | null }) {
  // Optional: a badge also renders on its own, outside any sidebar.
  const state = useContext(SidebarContext)?.state;
  const previous = useRef<{ state: typeof state; rail: boolean } | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const sidebar = element?.closest<HTMLElement>('[data-slot="sidebar"]');
    const rail = sidebar?.dataset.collapsible === "icon";
    const last = previous.current;
    previous.current = { state, rail: state === "collapsed" ? rail : last?.rail ?? false };
    if (!element || !last || last.state === state) return;
    // Collapsing reads the mode it is entering; expanding, the mode it is leaving.
    if (!(state === "collapsed" ? rail : last.rail)) return;
    const clear = () => {
      element.removeAttribute("data-hold");
      element.removeAttribute("data-settling");
    };
    element.setAttribute("data-settling", "");
    if (state === "collapsed") {
      element.setAttribute("data-hold", "count");
      const swap = setTimeout(clear, durationToken(element, "--duration-fast"));
      return () => {
        clearTimeout(swap);
        clear();
      };
    }
    // Expanding: faded for one painted frame, so the count fades in from the start.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(clear);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clear();
    };
  }, [ref, state]);
}

export function SidebarMenuBadge({
  className, count, max = 99, label, locales = "en-US", animated = false,
  dot = false, tone = "default", children, ref, ...props
}: SidebarMenuBadgeProps) {
  const value = count === undefined ? undefined : Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const badgeRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(badgeRef, ref);
  useSettleWithRail(badgeRef);
  if (value === 0) return null;

  return (
    <div
      ref={mergedRef}
      data-slot="sidebar-menu-badge"
      data-count={value}
      data-dot={dot || undefined}
      data-tone={tone}
      className={cn(sidebarMenuBadgeVariants(), className)}
      {...props}
    >
      {dot ? (
        <>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          <span className="sr-only">{value !== undefined ? `${new Intl.NumberFormat(locales).format(value)} ` : ""}{label}</span>
        </>
      ) : value !== undefined ? (
        <>
          {/* Which of the two shows is the badge's call (see its variants): the rail form
              waits on `data-hold` while the old one fades out. `inline-block` so it scales. */}
          <span data-part="count" className="inline-block">
            <BadgeCount value={value} max={max} locales={locales} animated={animated} />
            {label && <span className="sr-only"> {label}</span>}
          </span>
          <span aria-hidden="true" data-part="dot" className="hidden size-1.5 rounded-full bg-current" />
        </>
      ) : children}
    </div>
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
        "flex items-center gap-2 px-2",
        // The corners of the rows it stands in for: 6px nested (`sm`), 8px otherwise.
        nested ? "h-7 w-full min-w-0 -translate-x-px rounded-[6px]" : "h-8 rounded-[8px]",
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
