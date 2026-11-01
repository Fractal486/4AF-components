"use client";

/*
Adapted from HextaUI (https://github.com/preetsuthar17/hextaui).
MIT License

Copyright (c) 2026 Preet Suthar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


import { Collapsible } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useSyncExternalStore, type ComponentProps, type Ref } from "react";
import { tabbable } from "tabbable";
import { badgeSpringEase, badgeOutEase } from "./badge.motion";

const subscribe = () => () => {};

/** Base UI owns state/presence; this surface supplies HextaUI's width collapse and fade. */
export function BadgeSurface({ state, render, ref, panelRef, motionProps, onOpenChangeComplete, ...props }: Record<string, unknown> & {
  ref?: Ref<HTMLSpanElement>;
  panelRef?: Ref<HTMLSpanElement>;
  state: Collapsible.Panel.State;
  render?: useRender.RenderProp<{ open: boolean }>;
  motionProps: ComponentProps<typeof motion.span>;
  onOpenChangeComplete?: (open: boolean) => void;
}) {
  const localRef = useRef<HTMLSpanElement>(null);
  const callback = useRef(onOpenChangeComplete);
  const reduced = useReducedMotion();
  const hydrating = useSyncExternalStore(subscribe, () => false, () => true);
  const initialHydration = useRef(hydrating);
  const completed = useRef<boolean | null>(null);
  useLayoutEffect(() => { callback.current = onOpenChangeComplete; });
  useLayoutEffect(() => {
    const element = localRef.current;
    if (!element) return;
    const open = state.open;
    const skipEnter = open && initialHydration.current;
    initialHydration.current = false;
    const doc = element.ownerDocument;
    const hadFocus = element.contains(doc.activeElement);
    function finish() {
      if (!open && hadFocus && (element!.contains(doc.activeElement) || doc.activeElement === doc.body)) {
        const all = tabbable(doc.body).filter(node => !element!.contains(node));
        const siblings = all.filter(node => node.matches('[data-slot="badge-close"]') && node.closest('[data-slot="badge"]')?.parentElement === element!.parentElement);
        const candidates = siblings.length ? siblings : all;
        const next = candidates.find(node => element!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
        const previous = candidates.findLast(node => element!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
        const target = next ?? previous;
        if (target) target.focus({ preventScroll: true });
        else {
          const old = doc.body.getAttribute('tabindex');
          doc.body.tabIndex = -1;
          doc.body.focus({ preventScroll: true });
          if (old === null) doc.body.removeAttribute('tabindex'); else doc.body.setAttribute('tabindex', old);
        }
      }
      if (completed.current !== open) {
        completed.current = open;
        callback.current?.(open);
      }
    }
    if (skipEnter || reduced || typeof element.animate !== 'function') { finish(); return; }
    const animations: Animation[] = [];
    if (open) {
      animations.push(element.animate([{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], { duration: 200, easing: badgeOutEase }));
    } else {
      const parentStyle = element.parentElement && getComputedStyle(element.parentElement);
      const flowsInline = parentStyle && (parentStyle.display.includes('grid') || (parentStyle.display.includes('flex') && parentStyle.flexDirection.startsWith('row')));
      const gap = flowsInline ? parseFloat(parentStyle.columnGap) || 0 : 0;
      animations.push(element.animate([
        { width: `${element.offsetWidth}px`, height: `${element.offsetHeight}px`, minWidth: '0px' },
        { width: '0px', height: `${element.offsetHeight}px`, minWidth: '0px', paddingInline: '0px', borderInlineWidth: '0px', marginInlineEnd: `${-gap}px` },
      ], { duration: 260, easing: badgeSpringEase, fill: 'forwards' }));
      animations.push(element.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.9 }], { duration: 140, easing: badgeOutEase, fill: 'forwards' }));
    }
    let canceled = false;
    Promise.all(animations.map(animation => animation.finished)).then(() => { if (!canceled) finish(); }, () => {});
    return () => { canceled = true; animations.forEach(animation => animation.cancel()); };
  }, [state.open, reduced]);

  return useRender({
    defaultTagName: 'span', render: render ?? <motion.span {...motionProps} />,
    ref: [ref ?? null, panelRef ?? null, localRef], state: { open: state.open },
    props: { ...props, inert: !state.open || undefined, 'aria-hidden': !state.open || undefined },
  });
}
