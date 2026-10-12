"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTableOfContentsTracking } from "@/registry/lib/table-of-contents-tracking";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/ui/popover/popover";
import type { TocItem } from "@/registry/ui/table-of-contents/table-of-contents";

/** Compact counterpart to the desktop TOC, using the same section tracking. */
export function MobileToc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const navigating = useRef(false);
  const { currentId, scrollTargetId, settledTargetId, scrollTo } =
    useTableOfContentsTracking({ items, settle: "pin" });
  const activeId = scrollTargetId ?? settledTargetId ?? currentId;
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const progress = (activeIndex + 1) / Math.max(items.length, 1);
  const minLevel = Math.min(...items.map((item) => item.level ?? 2));

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur-sm lg:top-0 xl:hidden">
      <Popover open={open} onOpenChange={(nextOpen) => {
        if (nextOpen) navigating.current = false;
        setOpen(nextOpen);
      }}>
        <PopoverTrigger
          aria-label="On this page"
          className="flex h-10 w-full items-center gap-2.5 px-5 text-left text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-10 lg:px-0"
        >
          <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} transform="rotate(-90 10 10)" />
          </svg>
          <span className="min-w-0 flex-1 truncate">{open ? "On this page" : items[activeIndex]?.title ?? "On this page"}</span>
          <ChevronDown aria-hidden="true" className={`size-3.5 shrink-0 transition-transform duration-(--duration-fast) ${open ? "rotate-180" : ""}`} />
        </PopoverTrigger>
        <PopoverContent
          aria-label="On this page"
          align="start"
          sideOffset={0}
          finalFocus={() => !navigating.current}
          className="w-(--anchor-width) max-w-none rounded-t-none p-3"
        >
          <nav aria-label="Page sections" className="code-scrollbar max-h-[50dvh] overflow-y-auto">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={item.id === activeId ? "location" : undefined}
                className="block rounded-sm py-2 pr-3 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-[current]:bg-muted aria-[current]:text-foreground"
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
          </nav>
        </PopoverContent>
      </Popover>
    </div>
  );
}
