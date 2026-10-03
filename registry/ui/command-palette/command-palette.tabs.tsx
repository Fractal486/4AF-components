"use client";

import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
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
 * Measured like Tabs' indicator — the selected tab's box relative to the row, moved by a
 * Motion layout animation so the travel is a transform rather than `left`/`width` frames —
 * with one correction the palette needs. The palette scales in as it opens, and a panel
 * can be the page it opens on (`initialItemId`), so the first measurement is often taken
 * mid-entrance. Bounding rects are scaled by that transform; dividing by the row's own
 * rendered-to-layout ratio takes it back out, where a bare measurement would leave the
 * indicator a few pixels short of its tab until the next change.
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
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!active) return;
      const listRect = list.getBoundingClientRect();
      const tabRect = active.getBoundingClientRect();
      const scale = list.offsetWidth > 0 ? listRect.width / list.offsetWidth : 1;
      const left = (tabRect.left - listRect.left) / scale + list.scrollLeft;
      const width = tabRect.width / scale;
      setBox((previous) => previous?.left === left && previous.width === width
        ? previous : { left, width });
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
        data-variant={variant}
        activateOnFocus={activateOnFocus}
        className={cn(commandPanelTabListVariants({ variant }), className)}
        {...props}
      >
        {box && (
          <motion.div
            aria-hidden
            data-slot="command-panel-tab-indicator"
            // `left`/`width` are laid out once per change; `layout` plays the move as a
            // transform. No fly-in on first appearance: it mounts at its target.
            layout
            className={commandPanelTabIndicatorVariants({ variant })}
            style={{ left: box.left, width: box.width }}
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
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
