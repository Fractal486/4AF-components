"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

export function clampRows(value: number | undefined, fallback: number) {
  return value != null && Number.isFinite(value) ? Math.min(100, Math.max(1, Math.floor(value))) : fallback;
}

/** Measure a hidden copy so shrinking never collapses the live field or moves its caret. */
export function useTextareaAutosize(
  ref: RefObject<HTMLTextAreaElement | null>, enabled: boolean, minRows: number, maxRows: number,
  form: string | undefined,
) {
  const measureRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!enabled || !field) return;
    const doc = field.ownerDocument;
    const win = doc.defaultView!;
    const mirror = doc.createElement("textarea");
    mirror.tabIndex = -1;
    mirror.setAttribute("aria-hidden", "true");
    mirror.disabled = true;
    mirror.style.cssText = "position:fixed;inset:0 auto auto 0;visibility:hidden;pointer-events:none;box-sizing:border-box;height:0;min-height:0;max-height:none;overflow:hidden;resize:none;transition:none;";
    doc.body.append(mirror);
    const originalHeight = field.style.height;
    const originalOverflow = field.style.overflowY;
    let frame = 0;
    let active = true;
    let lastWidth = 0;

    const borderBoxWidth = (style = win.getComputedStyle(field)) => {
      const width = parseFloat(style.width);
      if (!Number.isFinite(width)) return field.offsetWidth;
      if (style.boxSizing === "border-box") return width;
      return width + (["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"] as const)
        .reduce((extra, name) => extra + (parseFloat(style[name]) || 0), 0);
    };

    const measure = () => {
      if (!active || !field.isConnected || !field.getClientRects().length) return;
      const style = win.getComputedStyle(field);
      const width = borderBoxWidth(style);
      lastWidth = width;
      // The body-mounted mirror needs the layout width, without ancestor transforms.
      for (const name of ["font", "line-height", "letter-spacing", "text-transform", "text-indent", "tab-size", "word-break", "overflow-wrap", "white-space", "padding", "border-width", "border-style"]) {
        mirror.style.setProperty(name, style.getPropertyValue(name));
      }
      mirror.style.width = `${width}px`;
      mirror.wrap = field.wrap;
      mirror.value = field.value || field.placeholder;
      const number = (value: string) => parseFloat(value) || 0;
      const padding = number(style.paddingTop) + number(style.paddingBottom);
      const border = number(style.borderTopWidth) + number(style.borderBottomWidth);
      const line = number(style.lineHeight) || number(style.fontSize) * 1.5;
      const minimum = Math.max(minRows * line + padding + border, number(style.minHeight));
      const cssMax = parseFloat(style.maxHeight);
      const maximum = Math.max(minimum, Math.min(maxRows * line + padding + border, Number.isFinite(cssMax) ? cssMax : Infinity));
      const natural = mirror.scrollHeight + border;
      const height = Math.max(minimum, Math.min(maximum, natural));
      field.style.height = `${style.boxSizing === "border-box" ? height : height - padding - border}px`;
      field.style.overflowY = natural > maximum + 1 ? "auto" : "hidden";
    };
    const schedule = () => {
      win.cancelAnimationFrame(frame);
      frame = win.requestAnimationFrame(measure);
    };
    const reset = (event: Event) => queueMicrotask(() => { if (active && !event.defaultPrevented) schedule(); });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      if (borderBoxWidth() !== lastWidth) schedule();
    });
    measureRef.current = measure;
    measure();
    resize?.observe(field);
    field.addEventListener("input", schedule);
    const ownerForm = field.form;
    ownerForm?.addEventListener("reset", reset);
    doc.fonts?.addEventListener("loadingdone", schedule);
    void doc.fonts?.ready.then(() => { if (active) schedule(); });
    return () => {
      active = false;
      measureRef.current = null;
      win.cancelAnimationFrame(frame);
      resize?.disconnect();
      field.removeEventListener("input", schedule);
      ownerForm?.removeEventListener("reset", reset);
      doc.fonts?.removeEventListener("loadingdone", schedule);
      mirror.remove();
      field.style.height = originalHeight;
      field.style.overflowY = originalOverflow;
    };
  }, [ref, enabled, minRows, maxRows, form]);

  // Controlled value, placeholder, and typography changes can happen without an input event.
  useLayoutEffect(() => { measureRef.current?.(); });
}
