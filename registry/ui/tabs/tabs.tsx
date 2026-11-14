"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import {
  tabIndicatorVariants,
  tabsEdgeVariants,
  tabsListVariants,
  tabsRootVariants,
  tabVariants,
  type TabsVariants,
} from "./tabs.variants";

type Variant = NonNullable<TabsVariants["variant"]>;
type Size = NonNullable<TabsVariants["size"]>;
export type TabsAppearance = NonNullable<TabsVariants["appearance"]>;

const TabsContext = createContext<{
  variant: Variant;
  appearance: TabsAppearance;
  size: Size;
  orientation: "horizontal" | "vertical";
} | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsList/TabsTab/TabsPanel must be used inside <Tabs>.");
  return context;
}

export interface TabsProps extends Omit<ComponentProps<typeof BaseTabs.Root>, "children"> {
  variant?: Variant;
  /** Track and chip treatment for segment/pill; underline ignores it. @default "default" */
  appearance?: TabsAppearance;
  /** @deprecated Use appearance="solid". An explicit appearance wins. */
  solid?: boolean;
  /** Text, padding, icon, and indicator scale. @default "md" */
  size?: Size;
  children: ReactNode;
}

export function Tabs({
  variant = "segment", appearance: appearanceProp, solid = false, size = "md",
  orientation = "horizontal", className, children, ...props
}: TabsProps) {
  // Base UI owns selection in both modes; only presentation belongs in our context.
  const appearance = appearanceProp ?? (solid ? "solid" : "default");
  const context = useMemo(() => ({ variant, appearance, size, orientation }), [variant, appearance, size, orientation]);
  return (
    <TabsContext.Provider value={context}>
      <BaseTabs.Root {...props} orientation={orientation} data-slot="tabs" data-variant={variant} data-size={size}
        className={mergeStateClassName(tabsRootVariants({ orientation }), className)}>
        {children}
      </BaseTabs.Root>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends ComponentProps<typeof BaseTabs.List> {
  /** Optional additional width limit. Overflow scrolling is automatic. Numbers are pixels. */
  maxWidth?: CSSProperties["maxWidth"];
}

export function TabsList({
  className, children, maxWidth, style, onClick, onFocus, ref: forwardedRef, ...props
}: TabsListProps) {
  const { variant, appearance, size, orientation } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mergedRef = useMergedRefs(listRef, forwardedRef);
  const vertical = orientation === "vertical";

  const revealTab = useCallback((tab: HTMLElement, center: boolean, instant = false) => {
    const list = listRef.current;
    if (!list) return;
    const viewport = list.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const extent = vertical ? list.clientHeight : list.clientWidth;
    const limit = Math.max(0, (vertical ? list.scrollHeight : list.scrollWidth) - extent);
    if (limit <= 1) return;
    const rtl = !vertical && getComputedStyle(list).direction === "rtl";
    const offset = vertical ? list.scrollTop : list.scrollLeft;
    const start = rtl ? limit + offset : offset;
    const viewportStart = vertical ? viewport.top : viewport.left;
    // Rects use screen pixels, while scrolling uses CSS pixels.
    const cssExtent = vertical ? list.offsetHeight : list.offsetWidth;
    const drawnExtent = vertical ? viewport.height : viewport.width;
    const scale = cssExtent > 0 && drawnExtent > 0 ? drawnExtent / cssExtent : 1;
    const tabStart = ((vertical ? rect.top : rect.left) - viewportStart) / scale;
    const tabEnd = ((vertical ? rect.bottom : rect.right) - viewportStart) / scale;
    const midpoint = extent / 2;
    const tabCenter = (tabStart + tabEnd) / 2;
    const hiddenStart = start > 1;
    const hiddenEnd = start < limit - 1;
    const obscured = (hiddenStart && tabStart < 32) || (hiddenEnd && tabEnd > extent - 32);
    if (obscured || (center && ((tabCenter < midpoint && hiddenStart) || (tabCenter > midpoint && hiddenEnd)))) {
      const target = Math.max(rtl ? -limit : 0, Math.min(rtl ? 0 : limit, offset + tabCenter - midpoint));
      list.scrollTo({ [vertical ? "top" : "left"]: target, behavior: instant || reduceMotion ? "instant" : "smooth" });
    }
  }, [vertical, reduceMotion]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let firstFrame = 0;
    let secondFrame = 0;
    const snapIndicator = () => {
      // Base UI places the indicator before hydration. Enable transitions only after
      // that placement, and snap during geometry changes so resizing never leaves it behind.
      list.removeAttribute("data-indicator-ready");
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => list.setAttribute("data-indicator-ready", ""));
      });
    };
    const updateEdges = () => {
      const offset = vertical ? list.scrollTop : list.scrollLeft;
      list.style.setProperty("--tabs-scroll-offset", `${offset}px`);
      const limit = Math.max(0, vertical ? list.scrollHeight - list.clientHeight : list.scrollWidth - list.clientWidth);
      const start = !vertical && getComputedStyle(list).direction === "rtl" ? limit + offset : offset;
      list.toggleAttribute(vertical ? "data-overflow-top" : "data-overflow-left", start > 1);
      list.toggleAttribute(vertical ? "data-overflow-bottom" : "data-overflow-right", start < limit - 1);
    };
    const revealSelected = () => {
      updateEdges();
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (active && active !== document.activeElement) revealTab(active, false, true);
    };
    const resize = new ResizeObserver(() => { snapIndicator(); revealSelected(); });
    const observeTabs = () => {
      resize.disconnect();
      resize.observe(list);
      list.querySelectorAll('[role="tab"]').forEach((tab) => resize.observe(tab));
      snapIndicator();
      revealSelected();
    };
    const mutation = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList")) observeTabs();
      else revealSelected();
    });
    mutation.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-selected"] });
    list.addEventListener("scroll", updateEdges, { passive: true });
    observeTabs();
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      resize.disconnect();
      mutation.disconnect();
      list.removeEventListener("scroll", updateEdges);
      for (const attribute of ["data-overflow-left", "data-overflow-right", "data-overflow-top", "data-overflow-bottom", "data-indicator-ready"]) list.removeAttribute(attribute);
      list.style.removeProperty("--tabs-scroll-offset");
    };
  }, [vertical, variant, size, revealTab]);

  return (
    <BaseTabs.List {...props} ref={mergedRef} data-slot="tabs-list" data-variant={variant}
      className={mergeStateClassName(tabsListVariants({ variant, appearance, size, orientation }), className)}
      style={(state) => ({
        ...(typeof style === "function" ? style(state) : style),
        ...(maxWidth !== undefined ? { maxWidth: `min(100%,${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth})` } : {}),
      })}
      onClick={(event) => {
        onClick?.(event);
        const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
        if (!event.defaultPrevented && tab && !tab.matches(':disabled, [aria-disabled="true"]')) revealTab(tab, true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
        if (!event.defaultPrevented && tab?.matches(":focus-visible")) revealTab(tab, false);
      }}>
      {children}
      <BaseTabs.Indicator renderBeforeHydration aria-hidden data-slot="tabs-indicator"
        className={cn(tabIndicatorVariants({ variant, appearance, size, orientation }))} />
      <span aria-hidden className={tabsEdgeVariants({ edge: vertical ? "top" : "left" })} />
      <span aria-hidden className={tabsEdgeVariants({ edge: vertical ? "bottom" : "right" })} />
    </BaseTabs.List>
  );
}

export function TabsTab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  const { variant, appearance, size, orientation } = useTabsContext();
  return <BaseTabs.Tab {...props} data-slot="tabs-tab"
    className={mergeStateClassName(tabVariants({ variant, appearance, size, orientation }), className)} />;
}

/** The normal 6px tab gap plus this 2px margin preserves the original 8px count spacing. */
export function TabsCount({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} data-slot="tabs-count" className={cn("ms-0.5 font-normal text-subtle-foreground tabular-nums", className)} />;
}

export function TabsPanel({ className, render, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel keepMounted {...props} data-slot="tabs-panel"
      className={mergeStateClassName("min-w-0 flex-1 outline-none", className)}
      render={(panelProps, state) => <TabsPanelSurface {...panelProps} state={state} render={render} />} />
  );
}

/** Keep panel semantics, ref composition, and the existing content entrance when replacing its surface. */
function TabsPanelSurface({ children, render, state, ref, ...props }: ComponentProps<"div"> & {
  render?: ComponentProps<typeof BaseTabs.Panel>["render"];
  state: BaseTabs.Panel.State;
}) {
  const reduceMotion = useReducedMotion();
  return useRender({
    render, ref, state: { ...state },
    // Base UI already supplies the panel's public state attributes.
    stateAttributesMapping: { hidden: () => null, orientation: () => null, transitionStatus: () => null, tabActivationDirection: () => null },
    props: {
      ...props,
      children: <motion.div initial={false}
        animate={{ opacity: state.hidden ? 0 : 1, y: state.hidden && !reduceMotion ? 4 : 0 }}
        transition={{ duration: reduceMotion ? 0 : duration.fast, ease: ease.out }}>
        {children}
      </motion.div>,
    },
  });
}
