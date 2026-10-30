"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

/**
 * The site's navigation drawer: an 18rem panel that slides in from the left over a plain dim
 * backdrop, and slides back out. CSS transitions on Base UI's starting and ending styles, longer
 * in than out. No close button; the backdrop, Escape, and every link close it.
 */
export function SiteNavigationContent({ children }: { children: ReactNode }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-[opacity] duration-(--duration-slower) ease-in-out data-[ending-style]:opacity-0 data-[ending-style]:duration-(--duration-slow) data-[starting-style]:opacity-0" />
      <BaseDialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface-raised shadow-overlay-drop outline-none transition-[translate] duration-(--duration-slower) ease-in-out data-[ending-style]:-translate-x-full data-[ending-style]:duration-(--duration-slow) data-[starting-style]:-translate-x-full">
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
