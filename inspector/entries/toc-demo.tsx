"use client";

import { useRef, type RefObject } from "react";
import {
  TableOfContents,
  type TableOfContentsProps,
  type TocItem,
} from "@/registry/ui/table-of-contents/table-of-contents";
import { TableOfContentsLines } from "@/registry/ui/table-of-contents-lines/table-of-contents-lines";

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
    body: "Levels drive the indent, so a nested heading sits under its parent. Use the span variant to show every visible heading, or single to keep the marker beside one current heading.",
  },
  {
    id: "toc-styling",
    title: "Styling",
    level: 3,
    body: "The rail and marker are aligned SVG strokes. Colour and spacing come from semantic tokens and utilities, so the whole thing re-themes with the rest of the library.",
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

function TocArticle({
  sections,
  scrollRef,
}: {
  sections: (TocItem & { body: string })[];
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      className="h-80 flex-1 overflow-y-auto pr-4 [scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]"
    >
      {sections.map((section) => (
        <section key={section.id} className="pb-8">
          <h3
            id={section.id}
            className="mb-2 scroll-mt-2 text-base font-medium text-foreground"
          >
            {section.title}
          </h3>
          <p className="text-sm text-pretty text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </div>
  );
}

const lineSections = () =>
  SECTIONS.map((section) => ({ ...section, id: `toc-lines-${section.id}` }));

export function TocDemo({
  variant,
  labels = "always",
}: {
  variant?: TableOfContentsProps["variant"];
  labels?: "always" | "hover";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex w-full max-w-2xl gap-8">
      <TocArticle sections={SECTIONS} scrollRef={scrollRef} />
      <TableOfContents
        aria-label="Table of contents rail"
        items={SECTIONS.map(({ id, title, level }) => ({ id, title, level }))}
        rootRef={scrollRef}
        variant={variant}
        labels={labels}
        className="sticky top-0 h-40 w-44 shrink-0 self-start"
      />
    </div>
  );
}

export function TocLinesDemo({ labels = "always" }: { labels?: "always" | "hover" }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sections = lineSections();

  return (
    <div className="flex w-full max-w-2xl gap-8">
      <TocArticle sections={sections} scrollRef={scrollRef} />
      <TableOfContentsLines
        labels={labels}
        aria-label="Table of contents lines"
        items={sections.map(({ id, title, level }) => ({ id, title, level }))}
        rootRef={scrollRef}
        className="sticky top-0 h-40 w-44 shrink-0 self-start"
      />
    </div>
  );
}
