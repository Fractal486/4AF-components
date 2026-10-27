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
    body: "Install with the 4AF CLI, then pass an array of { id, title, level } that matches the page headings. Give each heading a stable ID.",
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
    body: "Heading levels control indentation. Nested headings sit under their parent, and the active entry follows your scroll position.",
  },
  {
    id: "toc-styling",
    title: "Styling",
    level: 3,
    body: "Colors and spacing use the library’s theme tokens. Adjust them with utilities to match the surrounding page.",
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

/**
 * Off, the list takes its natural height and every entry shows. On, it is held short enough to
 * scroll, which is when the active entry is kept in view and the edges fade.
 */
const listHeight = (scrollable: boolean) => (scrollable ? "h-32" : "h-auto");

const lineSections = () =>
  SECTIONS.map((section) => ({ ...section, id: `toc-lines-${section.id}` }));

export function TocDemo({
  variant,
  labels = "always",
  scrollable = false,
}: {
  variant?: TableOfContentsProps["variant"];
  labels?: "always" | "hover";
  scrollable?: boolean;
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
        className={`sticky top-0 w-44 shrink-0 self-start ${listHeight(scrollable)}`}
      />
    </div>
  );
}

export function TocLinesDemo({
  labels = "always",
  scrollable = false,
}: {
  labels?: "always" | "hover";
  scrollable?: boolean;
}) {
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
        className={`sticky top-0 w-44 shrink-0 self-start ${listHeight(scrollable)}`}
      />
    </div>
  );
}
