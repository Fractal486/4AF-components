"use client";

import { lazy, type ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

const SiteSearchDialog = lazy(() => import("./search-dialog"));

export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{ storageKey: "4af-theme" }}
      search={{ SearchDialog: SiteSearchDialog }}
    >
      {children}
    </RootProvider>
  );
}
