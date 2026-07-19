"use client";

import { useRef } from "react";
import { TableOfContents, type TocItem } from "@/registry/ui/table-of-contents/table-of-contents";

const SECTIONS: (TocItem & { body: string })[] = [
  {
    id: "toc-introduction",
    title: "Introduction",
    level: 2,
    body: "A table of contents earns its place once a page is long enough that the reader loses their spot. It should answer two questions at a glance: what's here, and where am I.",
  },
  {
    id: "toc-installation",
    title: "Installation",
    level: 2,
    body: "Copy the component in, wire it to your headings, and give each heading a stable id. The list is data — an array of { id, title, level } — so it stays in sync with the page however you generate it.",
  },
  {
    id: "toc-usage",
    title: "Usage",
    level: 2,
    body: "Pass the headings and, when the article scrolls inside a container rather than the page, a ref to that container. The active entry tracks the reader as they scroll.",
  },
  {
    id: "toc-configuration",
    title: "Configuration",
    level: 3,
    body: "Levels drive the indent, so a nested heading sits under its parent. The active band sits near the top of the scroll area, which is where the eye expects the current section to be.",
  },
  {
    id: "toc-styling",
    title: "Styling",
    level: 3,
    body: "The rail is a plain left border; the marker is a single element that slides between entries. Colour, width and the indent step are all utilities, so the whole thing re-themes with the tokens.",
  },
  {
    id: "toc-accessibility",
    title: "Accessibility",
    level: 2,
    body: "The list is a labelled nav of anchors, and the current entry carries aria-current. Clicking scrolls the heading into view — instantly under reduced motion, where the marker snaps rather than slides.",
  },
  {
    id: "toc-faq",
    title: "FAQ",
    level: 2,
    body: "Long sections keep their entry active until the next heading reaches the band, so the highlight never falls between two sections while you read.",
  },
];

export function TocDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex w-full max-w-2xl gap-8">
      <div
        ref={scrollRef}
        className="h-80 flex-1 overflow-y-auto pr-4 [scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]"
      >
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-2 pb-8">
            <h3 className="mb-2 text-base font-medium text-foreground">{section.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <TableOfContents
        items={SECTIONS.map(({ id, title, level }) => ({ id, title, level }))}
        rootRef={scrollRef}
        className="sticky top-0 w-44 shrink-0 self-start"
      />
    </div>
  );
}
