"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion, MotionConfig, useReducedMotion, type Transition } from "motion/react";
import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, spring } from "@/registry/lib/motion";
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
 * The travelling indicator is Motion's, via a shared `layoutId`. This is one of the
 * few things CSS genuinely cannot do: the pill has to measure where it was and where
 * it's going across two different DOM nodes. That's FLIP, and it has no declarative
 * CSS equivalent.
 */

type Variant = NonNullable<TabsVariants["variant"]>;

interface TabsContextValue {
  variant: Variant;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsList/TabsTab/TabsPanel must be used inside <Tabs>.");
  return context;
}

export interface TabsProps
  extends Omit<ComponentProps<typeof BaseTabs.Root>, "className" | "children"> {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

export function Tabs({ variant = "segment", className, children, ...props }: TabsProps) {
  // Selection state stays entirely inside Base UI — controlled *and* uncontrolled are
  // its job. Mirroring the value here was a bug: Base UI registers its tabs in an
  // effect, so on the first render nothing matches the value yet and it emits an
  // `initial` fallback. A mirror accepts that fallback and lands on the wrong tab.
  // Each Tab reads its own selected state below instead.
  const layoutId = useId();
  const reduceMotion = useReducedMotion();

  const context = useMemo(() => ({ variant, layoutId }), [variant, layoutId]);

  return (
    <TabsContext.Provider value={context}>
      <MotionConfig
        transition={reduceMotion ? ({ duration: 0 } as Transition) : spring.snappy}
      >
        {/* layoutRoot scopes layout projection to this subtree. Without it the
            indicator measures in page coordinates, so inside a scrolled or fixed
            container it replays the scroll offset as movement and the pill lurches. */}
        <motion.div layoutRoot className={cn("flex flex-col gap-4", className)}>
          <BaseTabs.Root className="flex flex-col gap-4" {...props}>
            {children}
          </BaseTabs.Root>
        </motion.div>
      </MotionConfig>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.List>, "className"> & { className?: string }) {
  const { variant } = useTabsContext();
  return (
    <BaseTabs.List className={cn(tabsListVariants({ variant }), className)} {...props} />
  );
}

export function TabsTab({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseTabs.Tab>, "className" | "render"> & {
  className?: string;
}) {
  const { variant, layoutId } = useTabsContext();

  return (
    <BaseTabs.Tab
      className={cn(tabVariants({ variant }), className)}
      {...props}
      // `render` is how Base UI hands out the state it owns. Asking it whether this
      // tab is selected beats deducing it from a value we'd have to keep in sync.
      render={(tabProps, state) => (
        <button type="button" {...tabProps}>
          {/* The indicator exists only under the selected tab. Motion sees the same
              layoutId vanish here and appear there, and animates between the two —
              which is what makes it slide rather than cut. */}
          {state.active && (
            <motion.span
              layoutId={layoutId}
              className={tabIndicatorVariants({ variant })}
              // A style, not a class: the projection scales the box during the slide,
              // and a scaled border-radius smears. Motion only corrects for that when
              // it owns the value.
              style={{ borderRadius: variant === "pill" ? 9999 : undefined }}
            />
          )}
          {children}
        </button>
      )}
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
