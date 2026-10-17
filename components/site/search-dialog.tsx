"use client";

import { useMemo } from "react";
import { Moon, Sun, ScanEye } from "lucide-react";
import { setDemoRevealsEnabled, useDemoRevealsEnabled } from "@/lib/demo-reveal-preference";
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
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";

export default function SiteSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const revealsEnabled = useDemoRevealsEnabled();
  const search = useDocsSearch({ client: staticClient({ locale }) });
  const items = useMemo(() => {
    const words = search.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
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
    const revealLabel = `${revealsEnabled ? "Disable" : "Enable"} demo reveal animations`;
    const revealActions = words.every((word) => `${revealLabel} motion effects`.toLowerCase().includes(word))
      ? [{
        id: "toggle-demo-reveals",
        type: "action" as const,
        node: <span className="flex items-center gap-2"><ScanEye className="size-4" aria-hidden />{revealLabel}</span>,
        onSelect: () => setDemoRevealsEnabled(!revealsEnabled),
      }]
      : [];
    return [...actions, ...revealActions, ...(search.data?.items ?? [])];
  }, [search.search, search.data, resolvedTheme, setTheme, revealsEnabled]);

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
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={items} />
      </SearchDialogContent>
      <SearchDialogFooter />
    </SearchDialog>
  );
}
