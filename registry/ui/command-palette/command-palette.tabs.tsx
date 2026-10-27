"use client";

import { cn } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion, useReducedMotion } from "motion/react";
import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import type {
  CommandPanelTabListProps,
  CommandPanelTabPanelProps,
  CommandPanelTabProps,
  CommandPanelTabsProps,
} from "./command-palette.types";
import {
  commandPanelTabIndicatorVariants,
  commandPanelTabListVariants,
  commandPanelTabVariants,
} from "./command-palette.variants";

type Variant = NonNullable<CommandPanelTabListProps["variant"]>;

const TabVariantContext = createContext<Variant>("fill");

/**
 * Tabs for a custom panel, in a row directly under the panel's header.
 *
 * The root wraps everything below the header — the row, the body and the footer — so it
 * fills the panel's column the way the body would on its own. Behaviour is Base UI's:
 * roving focus, arrow keys, Home/End and the tab/panel wiring. Selection is controlled or
 * uncontrolled, as on any Base UI Tabs root.
 * Inside CommandPalette, Tab / Shift+Tab cycle enabled tabs with wraparound while keeping
 * focus where it is, including in the header's search field.
 *
 *   <CommandPanelTabs value={tab} onValueChange={setTab}>
 *     <CommandPanelTabList aria-label="Sections" variant="underline">
 *       <CommandPanelTab value="all">All</CommandPanelTab>
 *       <CommandPanelTab value="recent">Recent</CommandPanelTab>
 *     </CommandPanelTabList>
 *     <CommandPanelTabPanel value={tab}>
 *       <CommandPanelBody>…</CommandPanelBody>
 *     </CommandPanelTabPanel>
 *     <CommandPanelFooter />
 *   </CommandPanelTabs>
 */
export function CommandPanelTabs({ className, ...props }: CommandPanelTabsProps) {
  return <BaseTabs.Root className={cn("flex min-h-0 flex-1 flex-col", className)} {...props} />;
}

/**
 * The tab row, and the one indicator that travels across it to the selected tab.
 *
 * Measured and animated like Tabs' indicator: the selected tab's box in the row's own
 * coordinates, anchored at the start and moved by `x`. Layout projection would measure the
 * viewport box, and the palette scales in as it opens, so the indicator would play that
 * movement too. A panel can be the page the palette opens on (`initialItemId`), so the
 * first measurement is often taken mid-entrance: bounding rects are scaled by that
 * transform, and dividing by the row's rendered-to-layout ratio takes it back out.
 * The underline spans the label, not the tab's padding, as Tabs' does.
 */
export function CommandPanelTabList({
  variant = "fill",
  // On by default: a panel's tabs re-filter the one list under them, which is instant, so
  // the arrows show each section as they reach it rather than waiting for Enter.
  activateOnFocus = true,
  className,
  children,
  ref: forwardedRef,
  ...props
}: CommandPanelTabListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(listRef, forwardedRef);
  const [box, setBox] = useState<{ left: number; width: number; snap: boolean } | null>(null);
  const reduceMotion = useReducedMotion();

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
      const listRect = list.getBoundingClientRect();
      const tabRect = active.getBoundingClientRect();
      const scale = list.offsetWidth > 0 && Math.abs(listRect.width - list.offsetWidth) >= 1
        ? listRect.width / list.offsetWidth : 1;
      let left = (tabRect.left - listRect.left) / scale - list.clientLeft + list.scrollLeft;
      let width = tabRect.width / scale;
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
    // A selection flips `aria-selected`; a resize, or a font arriving, changes the widths.
    const mutation = new MutationObserver(measure);
    mutation.observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => resize?.observe(tab));
    return () => {
      mutation.disconnect();
      resize?.disconnect();
    };
  }, [variant]);

  return (
    <TabVariantContext.Provider value={variant}>
      <BaseTabs.List
        ref={mergedRef}
        data-slot="command-panel-tab-list"
        data-variant={variant}
        activateOnFocus={activateOnFocus}
        className={cn(commandPanelTabListVariants({ variant }), className)}
        {...props}
      >
        {box && (
          <motion.div
            aria-hidden
            data-slot="command-panel-tab-indicator"
            // Anchored at the row's start and moved by `x`, a transform. No fly-in on first
            // appearance: it mounts at its target.
            initial={false}
            animate={{ x: box.left, width: box.width }}
            className={commandPanelTabIndicatorVariants({ variant })}
            style={{ left: 0 }}
            // Tabs' tween: a click answered at full speed, decelerating into place, with
            // the width settling a step sooner than the travel.
            transition={reduceMotion || box.snap ? { duration: 0 } : {
              duration: duration.slower,
              ease: ease.out,
              width: { duration: duration.slow, ease: ease.out },
            }}
          />
        )}
        {children}
      </BaseTabs.List>
    </TabVariantContext.Provider>
  );
}

export function CommandPanelTab({ className, ...props }: CommandPanelTabProps) {
  const variant = useContext(TabVariantContext);
  return <BaseTabs.Tab className={cn(commandPanelTabVariants({ variant }), className)} {...props} />;
}

/**
 * What a tab shows: wrap the panel's body in it so the tab and its content are wired for
 * assistive technology. One panel whose `value` follows the selection is enough when the
 * tabs only filter one list.
 */
export function CommandPanelTabPanel({ className, ...props }: CommandPanelTabPanelProps) {
  return (
    <BaseTabs.Panel
      className={cn("flex min-h-0 flex-1 flex-col outline-none", className)}
      {...props}
    />
  );
}
