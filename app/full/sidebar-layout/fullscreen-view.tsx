"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controls } from "@/inspector/controls";
import {
  resolveSidebarVariant,
  sidebarEntry,
  type SidebarSettings,
} from "@/inspector/entries/sidebar";
import { SidebarDemo } from "@/inspector/entries/sidebar-demo";
import { initialValues } from "@/inspector/schema";
import { cn } from "@/registry/lib/cn";

type SidebarValues = SidebarSettings;

export function SidebarLayoutFullscreen() {
  const [values, setValues] = useState<SidebarValues>(() =>
    initialValues(sidebarEntry.controls),
  );
  const settingsSide = values.side === "right" ? "left-4" : "right-4";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <SidebarDemo
        key={`${values.side}-${values.layout}-${values.variant}-${values.collapsible}`}
        side={values.side}
        variant={resolveSidebarVariant(values.layout, values.variant)}
        collapsible={values.collapsible}
        loading={values.loading}
        fullscreen
      />

      <Link
        href="/docs/sidebar-layout"
        aria-label="Back to Sidebar Layout documentation"
        title="Back to Sidebar Layout documentation"
        className={cn(
          "fixed top-3 z-50 flex size-10 items-center justify-center rounded-md bg-surface text-muted-foreground shadow-border outline-none transition-[color,scale] duration-(--duration-fast) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]",
          settingsSide,
        )}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>

      <aside
        aria-label="Sidebar settings"
        className={cn(
          "fixed bottom-4 z-40 max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-surface p-4 shadow-overlay",
          settingsSide,
        )}
      >
        <Controls
          idPrefix="fullscreen-sidebar-layout"
          schema={sidebarEntry.controls}
          values={values}
          onChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }) as SidebarValues)
          }
        />
      </aside>
    </main>
  );
}
