"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import { registryComponents } from "@/lib/component-catalog";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { House, Image as ImageIcon, ImageOff, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  setBlueprintPreviewsEnabled,
  useBlueprintPreviewsEnabled,
} from "@/lib/blueprint-preview-preference";
import { useDocsSearch } from "fumadocs-core/search/client";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";

/** Pinned above the index's results, so a component's own page comes before its snippets. */
const PINNED_COMPONENTS = 5;

function matchingComponents(words: string[]) {
  if (words.length === 0) return [];
  const query = words.join(" ");
  return registryComponents
    .filter(({ name, title }) => words.every((word) => `${title} ${name}`.toLowerCase().includes(word)))
    // Names that start with the query first, then alphabetical.
    .sort((a, b) => Number(!a.title.toLowerCase().startsWith(query)) - Number(!b.title.toLowerCase().startsWith(query))
      || a.title.localeCompare(b.title))
    .slice(0, PINNED_COMPONENTS)
    .map(({ name, title }) => ({
      id: `component-${name}`,
      type: "page" as const,
      url: `/docs/${name}`,
      content: title as ReactNode,
    }));
}

/** Debounced keystrokes load for ~100ms each; only a load that lasts shows the header loader. */
function useLasting(active: boolean, delayMs = 150) {
  const [lasting, setLasting] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setLasting(true), delayMs);
    return () => {
      clearTimeout(timer);
      setLasting(false);
    };
  }, [active, delayMs]);
  return active && lasting;
}

export default function SiteSearchDialog(props: SharedProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const previewsEnabled = useBlueprintPreviewsEnabled();
  const search = useDocsSearch({ client: staticClient({ locale }) });
  const items = useMemo(() => {
    const words = search.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    // The overview isn't an MDX page, so the docs index never returns it, and the rail no
    // longer lists it. Offer it here as an action, alongside the others.
    const home = words.every((word) => "go home overview start introduction".includes(word))
      ? [{
        id: "go-home",
        type: "action" as const,
        node: <span className="flex items-center gap-2"><House className="size-4" aria-hidden />Go home</span>,
        // Fumadocs closes the dialog right after this returns. Navigating in the same tick
        // starts the route transition before the close, and when the transition commits it
        // briefly shows the dialog open again; let the close land first.
        onSelect: () => setTimeout(() => router.push("/")),
      }]
      : [];
    const actions = [
      { theme: "light", label: "Switch to light mode", Icon: Sun },
      { theme: "dark", label: "Switch to dark mode", Icon: Moon },
    ].filter(({ theme }) => theme !== resolvedTheme)
      .filter(({ label }) => words.every((word) => `${label} theme appearance`.toLowerCase().includes(word)))
      .map(({ theme, label, Icon }) => ({
        id: `theme-${theme}`,
        type: "action" as const,
        node: <span className="flex items-center gap-2"><Icon className="size-4" aria-hidden />{label}</span>,
        onSelect: () => setTheme(theme),
      }));
    const PreviewIcon = previewsEnabled ? ImageOff : ImageIcon;
    const previewLabel = `${previewsEnabled ? "Hide" : "Show"} component previews in the sidebar`;
    const previewActions = words.every((word) =>
      `${previewLabel} blueprint hover card`.toLowerCase().includes(word))
      ? [{
        id: "toggle-blueprint-previews",
        type: "action" as const,
        node: <span className="flex items-center gap-2"><PreviewIcon className="size-4" aria-hidden />{previewLabel}</span>,
        onSelect: () => setBlueprintPreviewsEnabled(!previewsEnabled),
      }]
      : [];
    const components = matchingComponents(words);
    const allActions = [...home, ...actions, ...previewActions];
    // Each pinned group opens with a label row; the index's results follow unlabelled.
    const sections = new Map([
      [components[0]?.id, "Components"],
      [allActions[0]?.id, "Actions"],
    ].filter((entry): entry is [string, string] => entry[0] !== undefined));
    return { sections, all: [...components, ...allActions, ...(search.data?.items ?? [])] };
  }, [search.search, search.data, resolvedTheme, setTheme, router, previewsEnabled]);
  // With rows on screen the header carries the loader; an empty panel carries it centred.
  const refreshing = useLasting(search.isLoading && items.all.length > 0);

  return (
    <SearchDialog {...search} {...props}>
      {/* Matched query text in results, which Fumadocs marks as the `fd-search` highlight. Its
          own utilities for this are excluded in globals.css, because Next's CSS parser rejects
          `::highlight()`; an inline style element never goes through that parser. React
          hoists it into the head once. */}
      <style href="fd-search-highlight" precedence="default">
        {"::highlight(fd-search){color:var(--color-fd-primary);text-decoration-line:underline}"}
      </style>
      <SearchDialogOverlay />
      {/* The library's glass panel material. `bg-(--surface-glass)` replaces Fumadocs'
          `bg-fd-popover` through its class merge, and the active row takes the glass hover
          tone, as the library's own glass panels do. */}
      <SearchDialogContent className="material-glass bg-(--surface-glass) [&_[aria-selected=true]]:bg-(--muted-glass)">
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          {refreshing ? <ClassicLoader size="sm" className="text-muted-foreground" /> : null}
          <SearchDialogClose />
        </SearchDialogHeader>
        {/* The library's scrollbar: Fumadocs' list grows to its full height inside, and this
            caps it at Fumadocs' 460px. The list's animated height still drives the panel's. */}
        <ScrollArea className="max-h-[460px]" viewportProps={{ tabIndex: -1 }}>
          <SearchDialogList
            items={items.all}
            Empty={() => search.isLoading ? (
              <div role="status" aria-label="Searching" className="flex justify-center py-12 text-muted-foreground">
                <ClassicLoader />
              </div>
            ) : (
              <div role="status" className="py-12 text-center text-sm text-fd-muted-foreground">No results found</div>
            )}
            Item={(itemProps) => items.sections.has(itemProps.item.id) ? (
              <Fragment>
                <div aria-hidden className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-fd-muted-foreground not-first:mt-1.5">
                  {items.sections.get(itemProps.item.id)}
                </div>
                <SearchDialogListItem {...itemProps} />
              </Fragment>
            ) : (
              <SearchDialogListItem {...itemProps} />
            )}
            className="[&>#fd-search-list]:max-h-none [&>#fd-search-list]:overflow-visible"
          />
        </ScrollArea>
      </SearchDialogContent>
      <SearchDialogFooter />
    </SearchDialog>
  );
}
