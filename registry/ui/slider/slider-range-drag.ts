"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { Slider as BaseSlider } from "@base-ui/react/slider";

type Range = readonly [number, number];
type Gesture = {
  id: number;
  origin: number;
  values: Range;
  last: Range;
  scale: number;
  valueAt: (position: number) => number;
  moved: boolean;
};

function decimals(value: number) {
  const [coefficient, exponent = "0"] = String(value).split("e");
  return Math.max(0, (coefficient!.split(".")[1] ?? "").length - Number(exponent));
}

export function shiftSliderRange(values: Range, delta: number, min: number, max: number, step: number): Range {
  const shift = Math.min(max - values[1], Math.max(min - values[0], Math.round(delta / step) * step));
  const precision = Math.max(decimals(min), decimals(max), decimals(step), ...values.map(decimals));
  const round = (value: number) => precision <= 100 ? Number(value.toFixed(precision)) : value;
  return [round(values[0] + shift), round(values[1] + shift)];
}

function changeDetails(reason: "drag" | "track-press", event: PointerEvent, trigger: Element): BaseSlider.Root.ChangeEventDetails {
  return {
    reason, event, trigger, activeThumbIndex: -1, isCanceled: false, isPropagationAllowed: false,
    cancel() { this.isCanceled = true; },
    allowPropagation() { this.isPropagationAllowed = true; },
  };
}

export function useSliderRangeDrag({ enabled, controlRef, values, min, max, step, minStepsBetweenValues, vertical, rtl, inset,
  onChange, onCommit, onStart, onEnd,
}: {
  enabled: boolean;
  controlRef: RefObject<HTMLDivElement | null>;
  values: Range;
  min: number;
  max: number;
  step: number;
  minStepsBetweenValues: number;
  vertical: boolean;
  rtl: boolean;
  inset: number;
  onChange: (value: Range, details: BaseSlider.Root.ChangeEventDetails) => boolean;
  onCommit?: (value: Range, details: BaseSlider.Root.CommitEventDetails) => void;
  onStart: () => void;
  onEnd: (event: { clientX: number; clientY: number }) => void;
}) {
  const gesture = useRef<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const axis = (event: { clientX: number; clientY: number }) => vertical ? event.clientY : event.clientX;
  // Base UI resolves Field.Root's inherited disabled state on the control element.
  const isEnabled = () => enabled && !controlRef.current?.hasAttribute("data-disabled");

  useEffect(() => {
    const control = controlRef.current;
    if (!control) return;
    // Base UI also listens for native touch starts. A captured range gesture owns this press.
    const blockTouch = (event: TouchEvent) => {
      if (gesture.current) event.stopImmediatePropagation();
    };
    control.addEventListener("touchstart", blockTouch, { capture: true, passive: true });
    return () => {
      control.removeEventListener("touchstart", blockTouch, true);
      const active = gesture.current;
      gesture.current = null;
      if (active && control.hasPointerCapture?.(active.id)) control.releasePointerCapture(active.id);
    };
  }, [controlRef]);

  useEffect(() => {
    if (enabled || !gesture.current) return;
    const active = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (controlRef.current?.hasPointerCapture?.(active.id)) controlRef.current.releasePointerCapture(active.id);
  }, [enabled, controlRef]);

  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isEnabled() || event.button !== 0 || event.isPrimary === false || gesture.current || event.defaultPrevented) return;
    if (!(event.target instanceof Element) || event.target.closest("input, output, button, a, [contenteditable]")) return;
    const control = event.currentTarget;
    const thumbs = Array.from(control.querySelectorAll<HTMLElement>("[data-slot=slider-thumb-hit]"));
    if (thumbs.length !== 2) return;
    // The invisible hit targets extend into the selected interval. Inside that interval,
    // only the painted handle owns an individual drag; its extra hit padding must not
    // steal the range gesture. Keep the larger targets outside the selected interval.
    const painted = Array.from(control.querySelectorAll<HTMLElement>("[data-slot=slider-thumb]"));
    const rects = thumbs.map((thumb, index) => {
      const drawn = painted[index]?.getBoundingClientRect();
      return drawn && drawn.width > 0 && drawn.height > 0 ? drawn : thumb.getBoundingClientRect();
    });
    if (rects.some(rect => event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom)) return;
    const centers = rects.map(rect => vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2);
    const position = axis(event);
    if (position <= Math.min(...centers) || position >= Math.max(...centers)) return;
    const rect = control.getBoundingClientRect();
    const extent = vertical ? rect.height : rect.width;
    const layoutExtent = vertical ? control.offsetHeight : control.offsetWidth;
    const scaledInset = layoutExtent > 0 ? inset * extent / layoutExtent : inset;
    const length = extent - scaledInset * 2;
    if (length <= 0) return;
    const sign = vertical || rtl ? -1 : 1;
    const startEdge = vertical ? rect.bottom : rtl ? rect.right : rect.left;
    event.preventDefault();
    event.stopPropagation();
    onStart();
    const closest = Math.abs(position - centers[0]!) <= Math.abs(position - centers[1]!) ? 0 : 1;
    thumbs[closest]?.querySelector("input")?.focus({ preventScroll: true });
    gesture.current = {
      id: event.pointerId, origin: position, values, last: values, scale: (max - min) / length * sign, moved: false,
      valueAt: (at) => min + Math.min(1, Math.max(0, ((at - startEdge) * sign - scaledInset) / length)) * (max - min),
    };
    control.setPointerCapture?.(event.pointerId);
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    if (!isEnabled()) { end(event); return; }
    event.preventDefault();
    event.stopPropagation();
    const distance = axis(event) - active.origin;
    if (!active.moved && Math.abs(distance) < 3) return;
    active.moved = true;
    setDragging(true);
    const next = shiftSliderRange(active.values, distance * active.scale, min, max, step);
    if (next[0] === active.last[0] && next[1] === active.last[1]) return;
    if (onChange(next, changeDetails("drag", event.nativeEvent, event.currentTarget))) active.last = next;
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onEnd(event);
    if (event.type !== "pointerup" || !isEnabled()) return;
    if (active.moved) {
      if (active.last[0] !== active.values[0] || active.last[1] !== active.values[1]) {
        onCommit?.(active.last, { reason: "drag", event: event.nativeEvent });
      }
      return;
    }
    // A click without a drag keeps the normal track-press behavior.
    const raw = active.valueAt(axis(event));
    const index = Math.abs(raw - active.values[0]) <= Math.abs(raw - active.values[1]) ? 0 : 1;
    const gap = minStepsBetweenValues * step;
    const lower = index === 0 ? min : active.values[0] + gap;
    const upper = index === 0 ? active.values[1] - gap : max;
    const precision = Math.max(decimals(min), decimals(step));
    const next = [...active.values] as [number, number];
    const snapped = Math.min(upper, Math.max(lower, min + Math.round((raw - min) / step) * step));
    next[index] = precision <= 100 ? Number(snapped.toFixed(precision)) : snapped;
    if (next[index] !== active.values[index] && onChange(next, changeDetails("track-press", event.nativeEvent, event.currentTarget))) {
      onCommit?.(next, { reason: "track-press", event: event.nativeEvent });
    }
  };

  return { dragging, onPointerDownCapture: start, onPointerMoveCapture: move, onPointerUpCapture: end, onPointerCancelCapture: end, onLostPointerCapture: end };
}
