"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import {
  tabIndicatorVariants,
  tabsEdgeVariants,
  tabsListVariants,
  tabVariants,
  type TabsVariants,
} from "./tabs.variants";

/**
 * Tabs.
 *
 * Behaviour is Base UI's: roving tabindex, arrow keys, Home/End, and the
 * `aria-controls`/`aria-labelledby` wiring between each tab and its panel. None of it
 * is optional — a `role="tablist"` you can't drive with the arrow keys is a worse lie
 * than no ARIA at all, because it promises a screen reader behaviour that isn't there.
 *
 * The travelling indicator is a single measured element animated in the list's own
 * coordinates. Layout projection — one `layoutId` span per tab, or `layout` on this one —
 * looks right and animates wrong: it measures the viewport box on both axes, so when the
 * list itself moves between renders (a centred dialog changing height, a scrolled
 * container) the indicator plays that vertical delta and slides off the separator. Tabs
 * sit in a row; the indicator only ever moves sideways. Animating its measured `x` and
 * `width` relative to the list keeps it on the same vertical track wherever the list goes.
 */

type Variant = NonNullable<TabsVariants["variant"]>;
type Size = NonNullable<TabsVariants["size"]>;
export type TabsAppearance = NonNullable<TabsVariants["appearance"]>;

const TabsContext = createContext<{
  variant: Variant;
  appearance: TabsAppearance;
  size: Size;
} | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsList/TabsTab/TabsPanel must be used inside <Tabs>.");
  return context;
}

export interface TabsProps
  extends Omit<ComponentProps<typeof BaseTabs.Root>, "className" | "children"> {
  variant?: Variant;
  /**
   * The track and chip treatment, `segment`/`pill` only (`underline` ignores it).
   * `default` is a raised surface chip on a muted track; `solid` a borderless background
   * chip on a border track; `outline` a bordered, unfilled track with a muted fill under the selected
   * tab. Outlined pills keep their height; outlined segments are 2px taller. @default "default"
   */
  appearance?: TabsAppearance;
  /** @deprecated Use `appearance="solid"`. Ignored when `appearance` is set. */
  solid?: boolean;
  /**
   * `sm` uses smaller text and tighter spacing, with a 32px pill track. @default md
   */
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  variant = "segment",
  appearance: appearanceProp,
  solid = false,
  size = "md",
  className,
  children,
  ...props
}: TabsProps) {
  // Selection state stays entirely inside Base UI — controlled *and* uncontrolled are
  // its job. Mirroring the value here was a bug: Base UI registers its tabs in an
  // effect, so on the first render nothing matches the value yet and it emits an
  // `initial` fallback. A mirror accepts that fallback and lands on the wrong tab.
  const appearance = appearanceProp ?? (solid ? "solid" : "default");
  const context = useMemo(
    () => ({ variant, appearance, size }),
    [variant, appearance, size],
  );

  return (
    <TabsContext.Provider value={context}>
      <BaseTabs.Root className={cn("flex flex-col gap-4", className)} {...props}>
        {children}
      </BaseTabs.Root>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  maxWidth,
  style,
  onClick,
  onFocus,
  ref: forwardedRef,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.List>, "className"> & {
  className?: string;
  children?: ReactNode;
  /** Enable horizontal scrolling with edge fades. Numbers are pixels. */
  maxWidth?: CSSProperties["maxWidth"];
}) {
  const { variant, appearance, size } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number; snap: boolean } | null>(null);
  const reduceMotion = useReducedMotion();
  const mergedRef = useMergedRefs(listRef, forwardedRef);

  const revealTab = useCallback((tab: HTMLElement, center: boolean, instant = false) => {
    const list = listRef.current;
    if (!list || maxWidth === undefined || list.getAttribute("aria-orientation") === "vertical") return;
    const viewport = list.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const midpoint = viewport.left + list.clientWidth / 2;
    const tabCenter = rect.left + rect.width / 2;
    const rtl = getComputedStyle(list).direction === "rtl";
    const limit = Math.max(0, list.scrollWidth - list.clientWidth);
    const left = rtl ? limit + list.scrollLeft : list.scrollLeft;
    const hiddenLeft = left > 1;
    const hiddenRight = left < limit - 1;
    const obscured = (hiddenLeft && rect.left < viewport.left + 32) ||
      (hiddenRight && rect.right > viewport.left + list.clientWidth - 32);
    if (obscured || (center && ((tabCenter < midpoint && hiddenLeft) || (tabCenter > midpoint && hiddenRight)))) {
      const target = list.scrollLeft + tabCenter - midpoint;
      list.scrollTo({
        left: Math.max(rtl ? -limit : 0, Math.min(rtl ? 0 : limit, target)),
        behavior: instant || reduceMotion ? "instant" : "smooth",
      });
    }
  }, [maxWidth, reduceMotion]);

  // Track the selected tab's horizontal box, relative to the list. Base UI owns the
  // selection, so rather than duplicate its state we watch the attribute it sets and
  // measure — which also means the indicator can never disagree with what's selected.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    // The tab the indicator last measured. A new one is a selection, and slides; the same
    // one measured again has only changed size (a resizing sidebar or window), and the
    // indicator snaps to it rather than replaying the slide on every frame of the resize.
    let measured: HTMLElement | null = null;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!active) return;
      const snap = active === measured;
      measured = active;
      // getBoundingClientRect, not offsetLeft: offsetLeft rounds to whole pixels and
      // the indicator would jitter by 1px between tabs of fractional width.
      const listRect = list.getBoundingClientRect();
      const tabRect = active.getBoundingClientRect();
      // `clientLeft` is the list's left border: the rects are border-box, but the
      // indicator is positioned from inside the border. Without it, a bordered track
      // (`appearance="outline"`) shifts the fill 1px toward the end.
      // Rects are in screen pixels; under a scaled ancestor (a dialog's enter scale, a
      // zoomed canvas) divide them back into the list's own pixels. `offsetWidth` is
      // rounded, so a sub-pixel difference is rounding, not scale.
      const scale = list.offsetWidth > 0 && Math.abs(listRect.width - list.offsetWidth) >= 1
        ? listRect.width / list.offsetWidth : 1;
      let left = (tabRect.left - listRect.left) / scale - list.clientLeft + list.scrollLeft;
      let width = tabRect.width / scale;
      // The underline spans the label, not the whole tab: drop the tab's horizontal padding
      // from both ends. Computed padding is already in the list's own pixels, unscaled.
      if (variant === "underline") {
        const { paddingLeft, paddingRight } = getComputedStyle(active);
        const start = Number.parseFloat(paddingLeft) || 0;
        const end = Number.parseFloat(paddingRight) || 0;
        left += start;
        width = Math.max(width - start - end, 0);
      }
      setBox((previous) => previous?.left === left && previous.width === width
        ? previous : { left, width, snap });
    };

    measure();
    // Selection changes flip `aria-selected` on the tabs; a resize (or a font finally
    // loading) changes their widths. Both need a re-measure.
    const mo = new MutationObserver(measure);
    mo.observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => ro.observe(tab));
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [variant, size]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || maxWidth === undefined || list.getAttribute("aria-orientation") === "vertical") return;
    const updateEdges = () => {
      // Keep the decorative layers at the viewport edges as the list scrolls.
      list.style.setProperty("--tabs-scroll-offset", `${list.scrollLeft}px`);
      const limit = Math.max(0, list.scrollWidth - list.clientWidth);
      const left = getComputedStyle(list).direction === "rtl" ? limit + list.scrollLeft : list.scrollLeft;
      list.toggleAttribute("data-overflow-left", left > 1);
      list.toggleAttribute("data-overflow-right", left < limit - 1);
    };
    const revealSelected = () => {
      updateEdges();
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (active && active !== document.activeElement) revealTab(active, false, true);
    };
    const resize = new ResizeObserver(revealSelected);
    const observeTabs = () => {
      resize.disconnect();
      resize.observe(list);
      list.querySelectorAll('[role="tab"]').forEach((tab) => resize.observe(tab));
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
      resize.disconnect();
      mutation.disconnect();
      list.removeEventListener("scroll", updateEdges);
      list.removeAttribute("data-overflow-left");
      list.removeAttribute("data-overflow-right");
      list.style.removeProperty("--tabs-scroll-offset");
    };
  }, [maxWidth, variant, size, revealTab]);

  return (
    <BaseTabs.List
      className={cn(tabsListVariants({ variant, appearance, size, scrollable: maxWidth !== undefined }), className)}
      style={{ ...style, ...(maxWidth !== undefined ? { maxWidth: `min(100%, ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth})` } : {}) }}
      {...props}
      ref={mergedRef}
      onClick={(event) => {
        onClick?.(event);
        const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
        if (!event.defaultPrevented && tab && !tab.matches(':disabled, [aria-disabled="true"]')) revealTab(tab, true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
        if (!event.defaultPrevented && tab?.matches(":focus-visible")) revealTab(tab, false);
      }}
    >
      {box && (
        <motion.div
          aria-hidden
          // Anchored at the list's start and moved by `x`, a transform. `width` is a real
          // width rather than `scaleX`, which would distort the rounded pill's corners; the
          // indicator is absolutely positioned, so animating it relayouts nothing else.
          // `initial={false}`: no fly-in on first appearance, it mounts at its target.
          initial={false}
          animate={{ x: box.left, width: box.width }}
          // `cn`, so a compound's inset or radius replaces the variant's base one.
          className={cn(
            tabIndicatorVariants({ variant, appearance, size }),
            // A scrolling list clips to its padding box, which the separator sits just
            // outside of, so there the underline stays inside rather than being cut off.
            variant === "underline" && maxWidth !== undefined && "bottom-0",
          )}
          style={{ left: 0 }}
          // A tween on the expo ease-out, not a spring: a spring starts from rest, so it
          // eases in before it decelerates. A tab switch answers a click, so the indicator
          // leaves at full speed and decelerates into place. The width settles a step
          // sooner than the travel, so the chip has its new size before it arrives.
          transition={reduceMotion || box.snap ? { duration: 0 } : {
            duration: duration.slower,
            ease: ease.out,
            width: { duration: duration.slow, ease: ease.out },
          }}
        />
      )}
      {children}
      {maxWidth !== undefined && <>
        <span aria-hidden className={tabsEdgeVariants({ edge: "left" })} />
        <span aria-hidden className={tabsEdgeVariants({ edge: "right" })} />
      </>}
    </BaseTabs.List>
  );
}

export function TabsTab({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.Tab>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  const { variant, appearance, size } = useTabsContext();
  return (
    <BaseTabs.Tab className={cn(tabVariants({ variant, appearance, size }), className)} {...props}>
      {children}
    </BaseTabs.Tab>
  );
}

/**
 * A count after a tab's label, e.g. "Included 3". Stays dim whether or not its tab is
 * selected, so the label is what changes; tabular figures keep the tab from changing width
 * as the number does.
 */
export function TabsCount({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-count"
      className={cn("ms-2 font-normal text-subtle-foreground tabular-nums", className)}
      {...props}
    />
  );
}

export function TabsPanel({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.Panel>, "children" | "className" | "render"> & {
  className?: string;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    // keepMounted: inactive panels stay in the DOM (hidden), so their content is in
    // the server-rendered HTML and find-in-page still reaches it.
    <BaseTabs.Panel
      keepMounted
      className={cn("outline-none", className)}
      {...props}
      render={(panelProps, state) => (
        <div {...panelProps}>
          <motion.div
            // Inactive panels keep their content and state, but park the wrapper at
            // the enter pose. Revealing the panel animates from that pose every time.
            initial={false}
            animate={{
              opacity: state.hidden ? 0 : 1,
              y: state.hidden && !reduceMotion ? 4 : 0,
            }}
            transition={{ duration: reduceMotion ? 0 : duration.fast, ease: ease.out }}
          >
            {children}
          </motion.div>
        </div>
      )}
    />
  );
}
