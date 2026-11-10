"use client";

import { pixels } from "@/registry/lib/numbers";
import { prefersReducedMotion } from "@/registry/lib/reduced-motion";
import { useCallback } from "react";

const blockExtras = (style: CSSStyleDeclaration) =>
  pixels(style.paddingTop) + pixels(style.paddingBottom) + pixels(style.borderTopWidth) + pixels(style.borderBottomWidth);

/** Natural body height, before its scroll viewport constrains it. */
function naturalScrollHeight(root: HTMLElement) {
  const content = root.querySelector<HTMLElement>('[data-slot="dialog-body-content"]');
  if (!content) return root.offsetHeight;
  const style = getComputedStyle(root);
  const natural = content.offsetHeight + blockExtras(style) + blockExtras(getComputedStyle(content.parentElement!));
  const max = Number.parseFloat(style.maxHeight);
  return Number.isFinite(max) ? Math.min(natural, max) : natural;
}

/** Measure natural content without sizing it from the animated frame (which would loop).
 * Layout height is intentional: a changing dialog grows around its centre. */
export function useDialogFrameHeight() {
  return useCallback((body: HTMLDivElement | null) => {
    const frame = body?.closest<HTMLElement>("[data-dialog-frame]");
    if (!body || !frame || typeof ResizeObserver === "undefined") return;
    const previousHeight = frame.style.height;
    let measuredHeight: string | undefined;
    const edgeAnimations: Animation[] = [];

    const measure = (entries?: ResizeObserverEntry[]) => {
      const style = getComputedStyle(frame);
      const border = pixels(style.borderTopWidth) + pixels(style.borderBottomWidth);
      const scrollBody = body.querySelector<HTMLElement>(':scope > [data-slot="dialog-body"]');
      let natural: number;
      if (scrollBody) {
        const layout = getComputedStyle(body);
        const children = Array.from(body.children).filter((child): child is HTMLElement =>
          child instanceof HTMLElement && getComputedStyle(child).display !== "none");
        natural = blockExtras(layout) + pixels(layout.rowGap) * Math.max(0, children.length - 1);
        for (const child of children) {
          const childStyle = getComputedStyle(child);
          natural += (child === scrollBody ? naturalScrollHeight(child) : child.offsetHeight)
            + pixels(childStyle.marginTop) + pixels(childStyle.marginBottom);
        }
        natural += border;
      } else {
        const entry = entries?.find((entry) => entry.target === body);
        natural = (entry?.borderBoxSize?.[0]?.blockSize ?? pixels(getComputedStyle(body).height)) + border;
      }
      if (!Number.isFinite(natural) || natural <= 0) return;
      const max = Number.parseFloat(style.maxHeight);
      const height = Number.isFinite(max) ? Math.min(natural, max) : natural;
      const next = `${height}px`;
      if (next === measuredHeight) return;
      const current = frame.style.height ? pixels(style.height) : undefined;
      measuredHeight = next;
      frame.style.height = next;
      for (const animation of edgeAnimations) animation.cancel();
      edgeAnimations.length = 0;
      // Flex layout pins a structured footer to the frame already. Legacy footers need
      // their offset animated because the natural-height body stays centred during resize.
      if (scrollBody || current === undefined || current === height || natural > height
        || prefersReducedMotion(frame.ownerDocument.defaultView)) return;
      const offset = (current - height) / 2;
      const timing = {
        duration: pixels(style.transitionDuration) * 1000,
        easing: style.getPropertyValue("--ease-out").trim() || "ease-out",
      };
      for (const edge of body.querySelectorAll('[data-dialog-edge="end"]')) {
        if (typeof edge.animate === "function") edgeAnimations.push(
          edge.animate([{ translate: `0 ${offset}px` }, { translate: "0 0" }], timing),
        );
      }
    };
    const observer = new ResizeObserver(measure);
    let watching = false;
    const watch = () => {
      if (watching) observer.disconnect();
      watching = true;
      for (const child of body.children) observer.observe(child);
      for (const content of body.querySelectorAll('[data-slot="dialog-body-content"]')) observer.observe(content);
      observer.observe(body);
    };
    watch();
    const mutation = new MutationObserver(() => { watch(); measure(); });
    mutation.observe(body, { childList: true, subtree: true });
    const resize = () => measure();
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", resize);
      if (frame.style.height === measuredHeight) frame.style.height = previousHeight;
      for (const animation of edgeAnimations) animation.cancel();
    };
  }, []);
}
