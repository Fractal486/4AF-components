"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, spring } from "@/registry/lib/motion";
import { useTableOfContentsTracking } from "@/registry/lib/table-of-contents-tracking";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/ui/popover/popover";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import type { TocItem } from "@/registry/ui/table-of-contents/table-of-contents";

/** The site layout's slot under its top bar, and the width below which that bar shows. */
const HEADER_SLOT = "[data-slot=site-header-toc]";
const TOP_BAR = "(max-width: 1023px)";

function subscribeTopBar(onChange: () => void) {
  const query = window.matchMedia(TOP_BAR);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const headerSlot = () => window.matchMedia(TOP_BAR).matches ? document.querySelector<HTMLElement>(HEADER_SLOT) : null;

/**
 * Compact counterpart to the desktop TOC, using the same section tracking. Below `lg` it sits
 * inside the site's top bar, between the navigation button and the bar's far-end controls;
 * from `lg` to `xl`, where the navigation is a side rail, it is a sticky row of its own.
 */
export function MobileToc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const navigating = useRef(false);
  const { currentId, scrollTargetId, settledTargetId, scrollTo } =
    useTableOfContentsTracking({ items, settle: "pin" });
  const activeId = scrollTargetId ?? settledTargetId ?? currentId;
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const progress = (activeIndex + 1) / Math.max(items.length, 1);
  const minLevel = Math.min(...items.map((item) => item.level ?? 2));
  const reduceMotion = useReducedMotion();
  const current = open ? undefined : items[activeIndex];
  const label = current?.title ?? "On this page";
  const slot = useSyncExternalStore(subscribeTopBar, headerSlot, () => null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const bar = (
    <div className={slot ? "flex min-w-0 flex-1" : "sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm max-lg:hidden xl:hidden"}>
      <Popover open={open} onOpenChange={(nextOpen) => {
        if (nextOpen) navigating.current = false;
        setOpen(nextOpen);
      }}>
        <PopoverTrigger
          aria-label="On this page"
          // In the top bar, a ghost control the height of its neighbours; on its own (`lg` to
          // `xl`), a full-width row.
          className={slot
            ? "flex h-[30px] w-full min-w-0 items-center gap-2 rounded-[6px] px-2 text-left text-sm text-muted-foreground outline-none hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            : "flex h-10 w-full items-center gap-2.5 text-left text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"}
        >
          <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} transform="rotate(-90 10 10)" />
          </svg>
          {/* The section's name crossfades as it changes; both names share one grid cell. */}
          <span className="grid min-w-0 flex-1">
            <AnimatePresence initial={false}>
              <motion.span
                key={current?.id ?? "on-this-page"}
                className="truncate [grid-area:1/1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: duration.base, ease: "easeOut" }}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
          {/* The library's chevron: Select's spring flip. */}
          <motion.span
            aria-hidden="true"
            // `flex` so the glyph centres in the row instead of sitting on a text baseline.
            className="flex shrink-0"
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduceMotion ? { duration: 0 } : spring.chevron}
          >
            <ChevronDown className="size-3.5" />
          </motion.span>
        </PopoverTrigger>
        <PopoverContent
          aria-label="On this page"
          align="start"
          sideOffset={0}
          // Edge to edge under the bar: no collision inset, side borders, or corners.
          // In the top bar it hangs from the whole header, edge to edge, rather than the control.
          positionerProps={{ collisionPadding: 0, anchor: slot?.closest<HTMLElement>("[data-slot=site-header]") ?? undefined }}
          finalFocus={() => !navigating.current}
          // The list never changes height while open, so nothing needs to follow it.
          autoSize={false}
          // Unrolls from the bar downward instead of scaling from a corner, and fades out.
          className={[
            "w-(--anchor-width) max-w-none rounded-none border-x-0 border-t-0 bg-background/80 p-3 backdrop-blur-md",
            // `!` so these beat the popover's own four-property timing whatever order the classes land in.
            "transition-[opacity,clip-path]! [transition-duration:var(--duration-fast)]! data-[ending-style]:[transition-duration:var(--duration-base)]! [clip-path:inset(0)]",
            "data-[starting-style]:scale-100 data-[starting-style]:blur-none data-[starting-style]:[clip-path:inset(0_0_100%_0)]",
            "data-[ending-style]:scale-100 data-[ending-style]:blur-none",
            "motion-reduce:transition-[opacity]!",
          ].join(" ")}
        >
          <nav aria-label="Page sections">
            <ScrollArea className="max-h-[50dvh]">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={item.id === activeId ? "location" : undefined}
                  className="block cursor-default rounded-sm py-2 pr-3 text-sm text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-[current]:bg-foreground/8 aria-[current]:text-foreground"
                  style={{ paddingLeft: 12 + ((item.level ?? 2) - minLevel) * 12 }}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    navigating.current = true;
                    scrollTo(event, item.id);
                    setOpen(false);
                  }}
                >
                  {item.title}
                </a>
              ))}
            </ScrollArea>
          </nav>
        </PopoverContent>
      </Popover>
    </div>
  );

  return slot ? createPortal(bar, slot) : bar;
}
