"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, spring } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import {
  tabIndicatorVariants,
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
 * The travelling indicator is a single measured element that animates only its `left`
 * and `width`. The obvious approach — one `layoutId` span per tab, letting Motion FLIP
 * between them — looks right and animates wrong: the shared-element projection measures
 * both axes, and under the panel tree it picks up a spurious vertical delta, so the
 * indicator jumps down a frame and then slides in diagonally. Tabs sit in a row; the
 * indicator only ever moves sideways. Measuring the active tab and animating x/width
 * makes vertical movement structurally impossible rather than something to correct.
 */

type Variant = NonNullable<TabsVariants["variant"]>;

const TabsContext = createContext<{ variant: Variant; solid: boolean } | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsList/TabsTab/TabsPanel must be used inside <Tabs>.");
  return context;
}

export interface TabsProps
  extends Omit<ComponentProps<typeof BaseTabs.Root>, "className" | "children"> {
  variant?: Variant;
  /**
   * A dark, borderless pill on a brighter track instead of the raised surface chip.
   * `segment`/`pill` only — the `underline` variant ignores it.
   */
  solid?: boolean;
  className?: string;
  children: ReactNode;
}

export function Tabs({ variant = "segment", solid = false, className, children, ...props }: TabsProps) {
  // Selection state stays entirely inside Base UI — controlled *and* uncontrolled are
  // its job. Mirroring the value here was a bug: Base UI registers its tabs in an
  // effect, so on the first render nothing matches the value yet and it emits an
  // `initial` fallback. A mirror accepts that fallback and lands on the wrong tab.
  const context = useMemo(() => ({ variant, solid }), [variant, solid]);

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
  ref: forwardedRef,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.List>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  const { variant, solid } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const mergedRef = useMergedRefs(listRef, forwardedRef);

  // Track the selected tab's horizontal box, relative to the list. Base UI owns the
  // selection, so rather than duplicate its state we watch the attribute it sets and
  // measure — which also means the indicator can never disagree with what's selected.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!active) return;
      // getBoundingClientRect, not offsetLeft: offsetLeft rounds to whole pixels and
      // the indicator would jitter by 1px between tabs of fractional width.
      const listRect = list.getBoundingClientRect();
      const tabRect = active.getBoundingClientRect();
      setBox({ left: tabRect.left - listRect.left, width: tabRect.width });
    };

    measure();
    // Selection changes flip `aria-selected` on the tabs; a resize (or a font finally
    // loading) changes their widths. Both need a re-measure.
    const mo = new MutationObserver(measure);
    mo.observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [variant]);

  return (
    <BaseTabs.List
      className={cn(tabsListVariants({ variant, solid }), className)}
      {...props}
      ref={mergedRef}
    >
      {box && (
        <motion.div
          aria-hidden
          // `left`/`width` are static styles the browser lays out once; `layout` is what
          // moves the indicator. Motion measures the box before and after the change and
          // plays the delta as a transform (FLIP) — so travelling between tabs never
          // animates `left`/`width` frame by frame (both relayout). It also corrects the
          // corner distortion a raw `scaleX` would leave on the rounded pill. No fly-in on
          // first appearance: the element mounts at its target with no prior box to
          // animate from.
          layout
          className={tabIndicatorVariants({ variant, solid })}
          style={{ left: box.left, width: box.width }}
          transition={reduceMotion ? { duration: 0 } : spring.snappy}
        />
      )}
      {children}
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
  const { variant } = useTabsContext();
  return (
    <BaseTabs.Tab className={cn(tabVariants({ variant }), className)} {...props}>
      {children}
    </BaseTabs.Tab>
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
