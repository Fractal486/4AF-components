"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight } from "lucide-react";
import { createContext, useCallback, useContext, type ComponentProps } from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { Slot } from "@/registry/lib/slot";
import {
  collapsibleChevronVariants,
  collapsibleContentVariants,
  collapsibleIconVariants,
  collapsiblePanelVariants,
  collapsibleTriggerVariants,
  collapsibleVariants,
  type CollapsibleVariants,
} from "./collapsible.variants";

/**
 * A disclosure: one row that opens a panel underneath it.
 *
 * Base UI's Collapsible owns the whole of the behaviour — the open state (controlled or
 * uncontrolled), `aria-expanded`/`aria-controls` wiring between trigger and panel, Enter
 * and Space, and unmounting the panel when it's closed so nothing inside stays reachable
 * by Tab or by a screen reader.
 *
 * **Height animation is a documented exception to compositor-only motion, alongside Sidebar.**
 * A growing box relayouts
 * everything below it on every frame. But a disclosure's whole job *is* to change the
 * height of the page, and there is no transform that moves the rows underneath — clip a
 * panel and the space it occupies doesn't change; snap the space open and the next row
 * jumps a whole panel's worth in one frame, which is the single most visible flaw a
 * collapsible can have. So the height transitions, and the cost is accepted knowingly:
 * one panel, one short transition, a reflow confined to the column it sits in.
 *
 * A flex column's gap collapses alongside the panel's height so the final unmount doesn't move
 * neighboring content. Content stays clipped during motion, then overflow is restored for
 * focus rings and nested surfaces once open. The content keeps its fade/blur entrance.
 */

const CollapsibleContext = createContext<CollapsibleVariants["variant"]>("plain");

function getLayoutParent(panel: HTMLElement) {
  let parent = panel.parentElement;
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
  return parent;
}

function getCollapsedGap(panel: HTMLElement, parent: HTMLElement) {
  const style = getComputedStyle(parent);
  const column = style.display.endsWith("flex") && style.flexDirection.startsWith("column");
  // Grid tracks cannot become negative: compensating their gap with a negative
  // margin still jumps on unmount. Grid layouts should use inner content padding.
  const gap = column ? parseFloat(style.rowGap) || 0 : 0;
  if (!gap) return { start: 0, end: 0 };

  // display:contents wrappers don't create layout items; hidden/out-of-flow siblings
  // don't create a gap. Find the panel among the actual items in the column.
  const items: Element[] = [];
  const collect = (element: Element) => {
    const itemStyle = getComputedStyle(element);
    if (itemStyle.display === "contents") Array.from(element.children).forEach(collect);
    else if ((element === panel || itemStyle.display !== "none") && !["absolute", "fixed"].includes(itemStyle.position)) items.push(element);
  };
  Array.from(parent.children).forEach(collect);
  const index = items.indexOf(panel);
  if (index < 0 || items.length < 2) return { start: 0, end: 0 };
  const reversed = column && style.flexDirection === "column-reverse";
  const atStart = (index > 0) !== reversed;
  return atStart ? { start: gap, end: 0 } : { start: 0, end: gap };
}

function trackPanelLayout(panel: HTMLElement) {
  const parent = getLayoutParent(panel);
  const syncGap = () => {
    const { start, end } = parent ? getCollapsedGap(panel, parent) : { start: 0, end: 0 };
    const style = panel.style;
    if (style.getPropertyValue("--collapsible-gap-start") === `${start}px` &&
        style.getPropertyValue("--collapsible-gap-end") === `${end}px`) return;

    // Measuring a new gap must not itself animate the collapsed margin. Keep the
    // height transition intact if the parent changes its spacing mid-flight.
    const property = style.getPropertyValue("transition-property");
    const priority = style.getPropertyPriority("transition-property");
    style.setProperty("transition-property", "height", "important");
    style.setProperty("--collapsible-gap-start", `${start}px`);
    style.setProperty("--collapsible-gap-end", `${end}px`);
    void getComputedStyle(panel).marginBlockStart;
    if (property) style.setProperty("transition-property", property, priority);
    else style.removeProperty("transition-property");
  };
  const syncSettled = () => {
    const open = panel.hasAttribute("data-open") &&
      !panel.hasAttribute("data-starting-style") && !panel.hasAttribute("data-ending-style");
    const moving = panel.getAnimations?.().some((animation) =>
      "transitionProperty" in animation &&
      /^(height|margin(?:-.*)?)$/.test(String(animation.transitionProperty)) &&
      animation.playState !== "finished" && animation.playState !== "idle",
    );
    panel.toggleAttribute("data-settled", open && !moving);
  };
  const onTransition = (event: Event) => {
    if (event.target === panel) syncSettled();
  };

  syncGap();
  syncSettled();
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncGap);
  const layout = new MutationObserver(syncGap);
  if (parent) {
    resize?.observe(parent);
    layout.observe(parent, { childList: true, attributes: true, attributeFilter: ["class", "style"] });
  }
  const state = new MutationObserver(syncSettled);
  state.observe(panel, {
    attributes: true,
    attributeFilter: ["data-open", "data-closed", "data-starting-style", "data-ending-style", "style"],
  });
  const events = ["transitionrun", "transitionstart", "transitionend", "transitioncancel"];
  events.forEach((event) => panel.addEventListener(event, onTransition));
  return () => {
    resize?.disconnect();
    layout.disconnect();
    state.disconnect();
    events.forEach((event) => panel.removeEventListener(event, onTransition));
    panel.removeAttribute("data-settled");
    panel.style.removeProperty("--collapsible-gap-start");
    panel.style.removeProperty("--collapsible-gap-end");
  };
}

export interface CollapsibleProps
  extends ComponentProps<typeof BaseCollapsible.Root>, CollapsibleVariants {}

export function Collapsible({ className, variant = "plain", ...props }: CollapsibleProps) {
  return (
    <CollapsibleContext.Provider value={variant}>
      <BaseCollapsible.Root
        data-slot="collapsible"
        data-variant={variant}
        className={mergeStateClassName(collapsibleVariants({ variant }), className)}
        {...props}
      />
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps
  extends ComponentProps<typeof BaseCollapsible.Trigger> {
  /**
   * Which end of the row the chevron sits at, or `false` for a row that supplies its own
   * indicator. `"end"` is the settings-section convention; `"start"` reads as a tree.
   */
  chevron?: "start" | "end" | false;
}

export function CollapsibleTrigger({
  className,
  children,
  chevron = "end",
  ...props
}: CollapsibleTriggerProps) {
  const variant = useContext(CollapsibleContext);

  const glyph = chevron && <CollapsibleTriggerIcon />;

  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={mergeStateClassName(collapsibleTriggerVariants({ variant }), className)}
      {...props}
    >
      {chevron === "start" && glyph}
      {/* `min-w-0` so a long label truncates inside the row instead of pushing the
          chevron off the end of it. */}
      {chevron ? <span className="min-w-0 flex-1">{children}</span> : children}
      {chevron === "end" && glyph}
    </BaseCollapsible.Trigger>
  );
}

export interface CollapsibleTriggerIconProps extends useRender.ComponentProps<"span"> {
  /** Apply the icon part's props to its single child. Takes precedence over render. */
  asChild?: boolean;
}

/** A decorative icon slot. Only its default chevron rotates automatically. */
export function CollapsibleTriggerIcon({
  className,
  children,
  render,
  ref,
  asChild = false,
  ...props
}: CollapsibleTriggerIconProps) {
  return useRender({
    defaultTagName: "span",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      "aria-hidden": true,
      ...props,
      "data-slot": "collapsible-trigger-icon",
      className: cn(collapsibleIconVariants(), className),
      children: children ?? (
        <ChevronRight aria-hidden data-slot="collapsible-chevron" className={collapsibleChevronVariants()} />
      ),
    },
  });
}

export interface CollapsibleContentProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Panel>, "className"> {
  className?: string;
  /** Classes for the height-animated panel itself, rather than the content box inside it. */
  panelClassName?: ComponentProps<typeof BaseCollapsible.Panel>["className"];
}

export function CollapsibleContent({
  className,
  panelClassName,
  children,
  ref,
  ...props
}: CollapsibleContentProps) {
  const variant = useContext(CollapsibleContext);
  const observePanel = useCallback(
    (panel: HTMLDivElement | null) => panel ? trackPanelLayout(panel) : undefined,
    [],
  );
  const mergedRef = useMergedRefs(observePanel, ref);

  // Two elements, not one: the outer panel animates its height and must stay padding-free
  // so it can reach a true zero, and the inner box holds the padding and the fade. Merging
  // them would also put the fade on the element whose height is moving, which is the one
  // combination that makes the content look like it's being dragged.
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      className={mergeStateClassName(collapsiblePanelVariants(), panelClassName)}
      {...props}
      ref={mergedRef}
    >
      <div
        data-slot="collapsible-content"
        className={cn(collapsibleContentVariants({ variant }), className)}
      >
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}
