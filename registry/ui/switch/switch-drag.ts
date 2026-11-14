"use client";

import { animate, useMotionValue } from "motion/react";
import { useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { spring } from "@/registry/lib/motion";

type Drag = { id: number; start: number; from: boolean; travel: number; direction: number; position: number; moved: boolean };

export function useSwitchDrag(rootRef: RefObject<HTMLElement | null>, thumbRef: RefObject<HTMLElement | null>, checked: boolean, blocked: boolean, reduced: boolean | null) {
  const x = useMotionValue(checked ? 16 : 0);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const target = useRef<number | null>(null);
  const initialized = useRef(false);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isBlocked = () => blocked || !!rootRef.current?.matches("[data-disabled],[data-readonly],[aria-busy=true]");
  const geometry = () => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    if (!root || !thumb) return { travel: 16, direction: 1 };
    const style = getComputedStyle(root);
    return {
      travel: Math.max(0, root.clientWidth - thumb.offsetWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0)),
      direction: style.direction === "rtl" ? -1 : 1,
    };
  };
  const settle = (instant = false) => {
    const { travel, direction } = geometry();
    const next = checked ? travel * direction : 0;
    if (!instant && target.current === next) return;
    target.current = next;
    animation.current?.stop();
    if (instant || reduced) x.set(next);
    else animation.current = animate(x, next, spring.snappy);
  };
  const releaseCapture = (state: Drag) => {
    const root = rootRef.current;
    if (root?.hasPointerCapture?.(state.id)) root.releasePointerCapture(state.id);
  };
  const cancel = () => {
    const state = drag.current;
    drag.current = null;
    if (state) releaseCapture(state);
    if (state?.moved) {
      setDragging(false);
      suppressClick.current = true;
      clearTimeout(suppressTimer.current);
      suppressTimer.current = setTimeout(() => { suppressClick.current = false; }, 400);
    }
    target.current = null;
    settle();
  };

  useLayoutEffect(() => {
    if (drag.current && (isBlocked() || drag.current.from !== checked)) cancel();
    if (!drag.current?.moved) settle(!initialized.current || Boolean(reduced));
    initialized.current = true;
  });
  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      const state = drag.current;
      drag.current = null;
      if (state && root?.hasPointerCapture?.(state.id)) root.releasePointerCapture(state.id);
      clearTimeout(suppressTimer.current);
      animation.current?.stop();
    };
  }, [rootRef]);

  const finish = (event: PointerEvent<HTMLElement>, canceled: boolean) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    const blockedNow = isBlocked();
    cancel();
    if (!state.moved) return;
    // A programmatic click below has detail=0; suppress the following pointer click only.
    if (!canceled && !blockedNow && (state.position > state.travel / 2) !== state.from) rootRef.current?.click();
  };

  return {
    x, dragging,
    onPointerDown(event: PointerEvent<HTMLElement>) {
      suppressClick.current = false;
      clearTimeout(suppressTimer.current);
      if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false || isBlocked()) return;
      const { travel, direction } = geometry();
      drag.current = { id: event.pointerId, start: event.clientX, from: checked, travel, direction, position: checked ? travel : 0, moved: false };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const state = drag.current;
      if (!state || event.pointerId !== state.id) return;
      // A press can leave the root before horizontal movement establishes capture.
      // Its release then happens elsewhere; a later hover must not revive the press.
      if (event.buttons === 0 || event.defaultPrevented || isBlocked()) { cancel(); return; }
      const delta = (event.clientX - state.start) * state.direction;
      if (!state.moved && Math.abs(delta) < 3) return;
      if (!state.moved) {
        state.moved = true;
        animation.current?.stop();
        rootRef.current?.setPointerCapture?.(state.id);
        rootRef.current?.focus();
        setDragging(true);
      }
      event.preventDefault();
      state.position = Math.max(0, Math.min(state.travel, (state.from ? state.travel : 0) + delta));
      target.current = null;
      x.set(state.position * state.direction);
    },
    onPointerUp(event: PointerEvent<HTMLElement>) { finish(event, event.defaultPrevented); },
    onPointerCancel(event: PointerEvent<HTMLElement>) { finish(event, true); },
    onLostPointerCapture(event: PointerEvent<HTMLElement>) { if (drag.current?.id === event.pointerId) finish(event, true); },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (suppressClick.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }
    },
  };
}
