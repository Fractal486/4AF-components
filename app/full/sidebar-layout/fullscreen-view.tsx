"use client";

import { useState } from "react";
import { Controls } from "@/inspector/controls";
import {
  resolveSidebarVariant,
  sidebarEntry,
  type SidebarSettings,
} from "@/inspector/entries/sidebar";
import { SidebarDemo } from "@/inspector/entries/sidebar-demo";
import { initialValues } from "@/inspector/schema";

export function SidebarLayoutFullscreen() {
  const [values, setValues] = useState<SidebarSettings>(() =>
    initialValues(sidebarEntry.controls),
  );
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <SidebarDemo
        key={`${values.layout}-${values.variant}-${values.collapsible}`}
        variant={resolveSidebarVariant(values.layout, values.variant)}
        collapsible={values.collapsible}
        loading={values.loading}
        customHeader={values.customHeader}
        fullscreen
      />

      <aside
        aria-label="Sidebar settings"
        className="fixed bottom-4 right-4 z-40 max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-surface p-4 shadow-overlay"
      >
        <Controls
          idPrefix="fullscreen-sidebar-layout"
          schema={sidebarEntry.controls}
          values={values}
          onChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }))
          }
        />
      </aside>
    </main>
  );
}
