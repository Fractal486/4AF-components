"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import {
  collapsibleContentVariants,
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
 * Everything else stays on the compositor, and the height transition is *only* there to
 * move the following rows: the panel doesn't clip, so the content isn't wiped in from the
 * top as the space grows. It fades in out of a blur, in place, where it will end up. The
 * chevron rotates. Nothing translates.
 */

const CollapsibleContext = createContext<CollapsibleVariants["variant"]>("plain");

export interface CollapsibleProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Root>, "className">,
    CollapsibleVariants {
  className?: string;
}

export function Collapsible({ className, variant = "plain", ...props }: CollapsibleProps) {
  return (
    <CollapsibleContext.Provider value={variant}>
      <BaseCollapsible.Root
        data-slot="collapsible"
        data-variant={variant}
        className={cn(collapsibleVariants({ variant }), className)}
        {...props}
      />
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Trigger>, "className"> {
  className?: string;
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

  // `rotate` alone is named, and the group is the trigger itself — the chevron reads the
  // `data-panel-open` Base UI has already put on its parent rather than needing the open
  // state passed down to it.
  const glyph = chevron && (
    <ChevronRight
      aria-hidden="true"
      data-slot="collapsible-chevron"
      className={cn(
        "text-muted-foreground transition-[rotate] duration-(--duration-base) ease-out",
        "group-data-[panel-open]/collapsible-trigger:rotate-90",
      )}
    />
  );

  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={cn(collapsibleTriggerVariants({ variant }), className)}
      {...props}
    >
      {chevron === "start" && glyph}
      {/* `min-w-0` so a long label truncates inside the row instead of pushing the
          chevron off the end of it. */}
      <span className="min-w-0 flex-1">{children}</span>
      {chevron === "end" && glyph}
    </BaseCollapsible.Trigger>
  );
}

export interface CollapsibleContentProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Panel>, "className"> {
  className?: string;
  /** Classes for the height-animated panel itself, rather than the content box inside it. */
  panelClassName?: string;
}

export function CollapsibleContent({
  className,
  panelClassName,
  children,
  ...props
}: CollapsibleContentProps) {
  const variant = useContext(CollapsibleContext);

  // Two elements, not one: the outer panel animates its height and must stay padding-free
  // so it can reach a true zero, and the inner box holds the padding and the fade. Merging
  // them would also put the fade on the element whose height is moving, which is the one
  // combination that makes the content look like it's being dragged.
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      className={cn(collapsiblePanelVariants(), panelClassName)}
      {...props}
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
