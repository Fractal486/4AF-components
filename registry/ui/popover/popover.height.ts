"use client";

import { usePopupHeight } from "@/registry/lib/use-popup-height";

/** Shared sizing keeps Popover and Hover Card in sync without coupling their primitives. */
export function usePopoverHeight() {
  return usePopupHeight("[data-popover-frame]");
}
