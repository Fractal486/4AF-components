"use client";

import {
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";
import {
  useCenterActiveTableOfContentsItem,
  useTableOfContentsEdgePadding,
} from "@/registry/lib/table-of-contents-scroll";
import { useTableOfContentsTracking } from "@/registry/lib/table-of-contents-tracking";
import {
  tableOfContentsLinesVariants,
  type TableOfContentsLinesVariants,
} from "./table-of-contents-lines.variants";

/** A heading rendered by the line-based table of contents. */
export interface TocLineItem {
  /** The `id` of the heading element this entry points at. */
  id: string;
  title: ReactNode;
  /** Heading depth (h2 = 2, h3 = 3, …). Drives the indent; defaults to 2. */
  level?: number;
}

export interface TableOfContentsLinesProps
  extends Omit<ComponentProps<"nav">, "children">,
    TableOfContentsLinesVariants {
  items: TocLineItem[];
  /** The scroll container, when the content scrolls inside an element rather than the page. */
  rootRef?: RefObject<HTMLElement | null>;
}

// The label is intentionally aligned with the first line in each three-line row. Its 14px
// line box is slightly taller than that first track, so leave the whole first row a little
// room before the scrollport edge instead of changing the label's alignment.
const FIRST_ROW_INSET_PX = 3;

export function TableOfContentsLines({
  items,
  rootRef,
  className,
  ...props
}: TableOfContentsLinesProps) {
  const navRef = useRef<HTMLElement>(null);
  const minLevel = useMemo(
    () => (items.length ? Math.min(...items.map((item) => item.level ?? 2)) : 2),
    [items],
  );
  const { currentId, scrollTargetId, settledTargetId, scrollTo } = useTableOfContentsTracking({
    items,
    rootRef,
    settle: "pin",
  });

  const activeId = scrollTargetId ?? settledTargetId ?? currentId;
  const edgePadding = useTableOfContentsEdgePadding(navRef, items);

  useCenterActiveTableOfContentsItem(navRef, activeId, items, edgePadding);

  return (
    <nav
      ref={navRef}
      aria-label="Table of contents"
      data-variant="lines"
      className={cn(tableOfContentsLinesVariants(), className)}
      {...props}
    >
      <ul
        style={{
          paddingBlockStart: edgePadding.start + FIRST_ROW_INSET_PX,
          paddingBlockEnd: edgePadding.end,
        }}
      >
        {items.map((item, itemIndex) => {
          const hasFollowingHeading = itemIndex < items.length - 1;
          const active = item.id === activeId;
          const indent = 0.75 + ((item.level ?? 2) - minLevel) * 0.75;
          const nextItem = items[itemIndex + 1];
          const nextIndent = nextItem
            ? 0.75 + ((nextItem.level ?? 2) - minLevel) * 0.75
            : indent;
          const secondaryOffset = nextIndent - indent;

          return (
            <li key={item.id} data-toc-id={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => scrollTo(event, item.id)}
                aria-current={active ? "location" : undefined}
                data-active={active ? "true" : "false"}
                style={{ paddingInlineStart: `${indent}rem` }}
                className={cn(
                  "group grid h-7 grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-3 items-center gap-x-2.5 text-sm leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "text-muted-foreground transition-[color,translate] duration-(--duration-slow) ease-out",
                  "hover:text-foreground focus-visible:text-foreground",
                  active && "text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="col-start-1 row-span-3 row-start-1 grid h-full w-6 grid-rows-3 items-center"
                >
                  <span
                    className={cn(
                      // Laid out at its full length and revealed by `clip-path`, rather
                      // than drawn short and scaled up. Scaling a 1px rule promotes it to
                      // its own layer, and the rasterized hairline then sits at fractional
                      // device pixels for the length of the transition — it antialiases
                      // across two rows and reads as *thicker* while it grows, then snaps
                      // crisp again at the end. Both endpoints looked right; only the
                      // middle was fat. `clip-path` is on the compositor list too, and it
                      // moves an edge instead of resampling the line.
                      "h-px w-[1.875rem] rounded-full bg-border-strong",
                      "[clip-path:inset(0_20%_0_0)]",
                      "transition-[clip-path,background-color] duration-(--duration-slow) ease-out",
                      "group-hover:[clip-path:inset(0_0_0_0)] group-hover:bg-foreground",
                      "group-focus-visible:[clip-path:inset(0_0_0_0)] group-focus-visible:bg-foreground",
                      active && "[clip-path:inset(0_0_0_0)] bg-foreground",
                    )}
                  />
                  {hasFollowingHeading && (
                    <>
                      <span
                        className="h-px w-4 rounded-full bg-border"
                        style={{ transform: `translateX(${secondaryOffset}rem)` }}
                      />
                      <span
                        className="h-px w-4 rounded-full bg-border"
                        style={{ transform: `translateX(${secondaryOffset}rem)` }}
                      />
                    </>
                  )}
                </span>
                <span
                  className={cn(
                    "col-start-2 row-start-1 min-w-0 self-center transition-[translate] duration-(--duration-slow) ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1",
                    active && "translate-x-1",
                  )}
                >
                  {item.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
