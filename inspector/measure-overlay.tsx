"use client";

import { useEffect, type RefObject } from "react";

/**
 * Drag across a demo's empty canvas to x-ray what the selection covers: boxes become
 * blueprint blocks labelled with their size, padding and gaps are hatched and measured,
 * content boxes are dashed, and text turns into skeleton bars. The demo and any popup it has
 * open are measured afresh every frame, so an entrance animation reads out as it settles.
 * Letting go fades the layer away.
 *
 * Everything is painted onto one fixed canvas clipped to the selection, so the page itself is
 * never restyled. Open popups stay open: Base UI dismisses them on a mouse click, not a press,
 * and the click that ends a drag is swallowed.
 */
export function MeasureOverlay({
  canvasRef,
  contentRef,
}: {
  /** The demo canvas; a drag starts on its empty area. */
  canvasRef: RefObject<HTMLElement | null>;
  /** The element holding the demo, which a press inside of belongs to the demo instead. */
  contentRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const content = contentRef.current;
    if (!canvasEl || !content) return;

    let drag: Drag | null = null;
    let overlay: HTMLCanvasElement | null = null;
    let palette: Palette | null = null;
    let frame = 0;
    let removeTimer = 0;

    // The hover trigger the selection covers most, held open so its panel shows in the x-ray.
    let peeked: Element | null = null;
    const peek = (selection: Rect | null) => {
      let best: Element | null = null;
      let bestArea = 0;
      if (selection) {
        for (const trigger of content.querySelectorAll(HOVER_TRIGGER)) {
          const box = trigger.getBoundingClientRect();
          const overlap = intersection(selection, { x: box.left, y: box.top, w: box.width, h: box.height });
          const area = overlap ? overlap.w * overlap.h : 0;
          if (area > bestArea) {
            best = trigger;
            bestArea = area;
          }
        }
      }
      if (best === peeked) return;
      if (peeked) hover(peeked, "out", canvasEl);
      peeked = best;
      if (best) hover(best, "in", canvasEl);
    };

    const draw = () => {
      if (drag?.active) peek(normalize(drag));
      const ctx = overlay?.getContext("2d");
      if (!overlay || !ctx || !drag || !palette) return;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(window.innerWidth * dpr);
      const height = Math.round(window.innerHeight * dpr);
      if (overlay.width !== width || overlay.height !== height) {
        overlay.width = width;
        overlay.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = palette.font;
      const selection = normalize(drag);
      paint(ctx, measure(collectRoots(canvasEl, content)), selection, drag.bounds, palette);
    };

    const tick = () => {
      draw();
      frame = window.requestAnimationFrame(tick);
    };

    const show = () => {
      window.clearTimeout(removeTimer);
      if (!overlay) {
        overlay = document.createElement("canvas");
        overlay.setAttribute("aria-hidden", "true");
        overlay.dataset.slot = "measure-overlay";
        Object.assign(overlay.style, {
          position: "fixed",
          inset: "0",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: "2147483647",
          transition: "opacity var(--duration-fast) var(--ease-out)",
        });
        document.body.append(overlay);
      }
      overlay.style.opacity = "1";
      palette = readPalette();
      window.cancelAnimationFrame(frame);
      tick();
    };

    const hide = () => {
      window.cancelAnimationFrame(frame);
      peek(null);
      const el = overlay;
      if (!el) return;
      el.style.opacity = "0";
      const remove = () => {
        window.clearTimeout(removeTimer);
        if (overlay !== el || el.style.opacity !== "0") return;
        el.remove();
        overlay = null;
      };
      el.addEventListener("transitionend", remove, { once: true });
      // A fallback for when no transition runs, such as a hidden tab.
      removeTimer = window.setTimeout(remove, 500);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (replaying || drag || event.button !== 0 || event.pointerType === "touch") return;
      const target = event.target;
      const bounds = target instanceof Element ? pressBounds(target, event, canvasEl, content) : null;
      if (!bounds || !(target instanceof Element)) return;
      // Hold the press back until it's known to be a click: Select and Menu dismiss on the press
      // itself. Preventing it also keeps text selection and focus where they are.
      event.preventDefault();
      event.stopPropagation();
      drag = {
        pointerId: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        x: event.clientX,
        y: event.clientY,
        active: false,
        target,
        bounds,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      follow(drag, event);
      if (!drag.active && Math.hypot(drag.x - drag.x0, drag.y - drag.y0) >= DRAG_THRESHOLD) {
        drag.active = true;
        // Captured only once it's a drag: capture retargets the click, and a modal Dialog or
        // Sheet dismisses only when the click lands on its own backdrop.
        try {
          canvasEl.setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic pointers can't be captured; window listeners still track them.
        }
        show();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const wasActive = drag.active;
      follow(drag, event);
      if (wasActive) {
        draw();
        swallowNextClick();
      } else {
        replayPress(drag.target, event, canvasEl);
      }
      drag = null;
      if (wasActive) hide();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const wasActive = drag.active;
      drag = null;
      if (wasActive) hide();
    };

    // A held press must not start or collapse a text selection either: the Selection Toolbar
    // closes the moment its selection goes, before it could be measured.
    const onHeldPress = (event: Event) => {
      if (!drag || replaying) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !drag) return;
      const wasActive = drag.active;
      drag = null;
      if (!wasActive) return;
      // Escape ends the measurement, not the popup being measured.
      event.preventDefault();
      event.stopPropagation();
      swallowNextClick();
      hide();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("mousedown", onHeldPress, true);
    window.addEventListener("selectstart", onHeldPress, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("mousedown", onHeldPress, true);
      window.removeEventListener("selectstart", onHeldPress, true);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(removeTimer);
      peek(null);
      overlay?.remove();
    };
  }, [canvasRef, contentRef]);

  return null;
}

/* -- Pointer ------------------------------------------------------------------------- */

const DRAG_THRESHOLD = 4;

interface Drag {
  pointerId: number;
  x0: number;
  y0: number;
  x: number;
  y: number;
  active: boolean;
  /** Where the press landed, for replaying it if it turns out to be a click. */
  target: Element;
  /** The playground's visible canvas, which the selection stays inside. */
  bounds: Rect;
}

function follow(drag: Drag, event: PointerEvent) {
  const { bounds } = drag;
  drag.x = Math.min(Math.max(event.clientX, bounds.x), bounds.x + bounds.w);
  drag.y = Math.min(Math.max(event.clientY, bounds.y), bounds.y + bounds.h);
}

/** The canvas as far as it's in view: cut by every scrolling or clipping ancestor. */
function visibleBounds(canvasEl: HTMLElement): Rect {
  const box = canvasEl.getBoundingClientRect();
  let bounds: Rect = { x: box.left, y: box.top, w: box.width, h: box.height };
  for (let el = canvasEl.parentElement; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.overflowX === "visible" && style.overflowY === "visible") continue;
    // The root element scrolls the window, so its box is the viewport rather than the page.
    const rect = el === document.documentElement ? new DOMRect() : el.getBoundingClientRect();
    const viewport = { x: rect.left + el.clientLeft, y: rect.top + el.clientTop, w: el.clientWidth, h: el.clientHeight };
    bounds = intersection(bounds, viewport) ?? { x: bounds.x, y: bounds.y, w: 0, h: 0 };
  }
  return bounds;
}

/** Set while a held-back press is replayed, so the replay passes straight through. */
let replaying = false;

/** The backdrops of Dialog, Alert Dialog, and Sheet, which cover the whole page. */
const MODAL_BACKDROP = '[data-slot$="-backdrop"], [data-slot="sheet-overlay"]';
/** Those, and the invisible one a modal Select or Menu lays over the page while open. */
const BACKDROP = `${MODAL_BACKDROP}, [data-base-ui-inert]`;

/**
 * Where a press may draw a selection, or null when it belongs to something else. A press on the
 * canvas's empty area selects within the playground. With a dialog or sheet open its backdrop
 * covers the page, so a press anywhere on it selects across the window, where a sheet sits.
 */
function pressBounds(target: Element, event: PointerEvent, canvasEl: HTMLElement, content: HTMLElement): Rect | null {
  if (canvasEl.contains(target)) return isEmptySpace(target, content) ? visibleBounds(canvasEl) : null;
  if (!target.closest(BACKDROP)) return null;
  if (document.querySelector(MODAL_BACKDROP)) {
    return { x: 0, y: 0, w: document.documentElement.clientWidth, h: document.documentElement.clientHeight };
  }
  // A Select's backdrop: only where the canvas's empty space lies beneath it.
  const bounds = visibleBounds(canvasEl);
  const point: Point = [event.clientX, event.clientY];
  if (!contains(bounds, point)) return null;
  const under = document.elementsFromPoint?.(point[0], point[1]).find((el) => !el.closest(BACKDROP));
  if (under) return canvasEl.contains(under) && isEmptySpace(under, content) ? bounds : null;
  const demo = content.getBoundingClientRect();
  return contains({ x: demo.left, y: demo.top, w: demo.width, h: demo.height }, point) ? null : bounds;
}

const INTERACTIVE = "a[href], button, input, select, textarea, label, summary, [role], [tabindex], [contenteditable]";

/**
 * Whether a press lands on nothing visible: the canvas itself, or a demo's layout wrapper
 * around its component, such as the space around the app-shell demos' fitted window. Anything
 * painted, holding text, or interactive between the press and the canvas belongs to the demo.
 */
function isEmptySpace(target: Element, content: HTMLElement) {
  if (!content.contains(target)) return true;
  for (let el: Element | null = target; el && el !== content.parentElement; el = el.parentElement) {
    if (el.matches(INTERACTIVE) || hasPaint(getComputedStyle(el))) return false;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return false;
    }
  }
  return true;
}

/** Triggers whose panel opens on hover: Tooltip and Hover Card. */
const HOVER_TRIGGER = '[data-slot="tooltip-trigger"], [data-slot="hover-card-trigger"]';

/**
 * Hovers a trigger in or out with the events Base UI listens for: React's enter and leave come
 * from `pointerover` / `pointerout`, the delay timers from native `mouseenter` / `mouseleave`.
 * While a drag holds pointer capture no real hover reaches the trigger, so nothing undoes this.
 */
function hover(trigger: Element, direction: "in" | "out", outside: Element) {
  const box = trigger.getBoundingClientRect();
  const init = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, relatedTarget: outside };
  const Pointer = typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
  const pointer = { ...init, pointerId: 1, pointerType: "mouse", isPrimary: true };
  if (direction === "in") {
    trigger.dispatchEvent(new Pointer("pointerover", { ...pointer, bubbles: true }));
    trigger.dispatchEvent(new Pointer("pointerenter", pointer));
    trigger.dispatchEvent(new MouseEvent("mouseover", { ...init, bubbles: true }));
    trigger.dispatchEvent(new MouseEvent("mouseenter", init));
    trigger.dispatchEvent(new MouseEvent("mousemove", { ...init, bubbles: true }));
  } else {
    trigger.dispatchEvent(new Pointer("pointerout", { ...pointer, bubbles: true }));
    trigger.dispatchEvent(new Pointer("pointerleave", pointer));
    trigger.dispatchEvent(new MouseEvent("mouseout", { ...init, bubbles: true }));
    trigger.dispatchEvent(new MouseEvent("mouseleave", init));
  }
}

/**
 * Re-sends a held-back press that ended without a drag, just before its release, so the click
 * dismisses popups exactly as it would have: on the press, or on the click that follows.
 */
function replayPress(target: Element, at: PointerEvent, canvasEl: HTMLElement) {
  const init = { bubbles: true, cancelable: true, composed: true, clientX: at.clientX, clientY: at.clientY, button: 0, buttons: 1 };
  const Pointer = typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
  replaying = true;
  try {
    target.dispatchEvent(new Pointer("pointerdown", { ...init, pointerId: at.pointerId, pointerType: at.pointerType || "mouse", isPrimary: true }));
    const down = new MouseEvent("mousedown", init);
    target.dispatchEvent(down);
    // A synthetic press has no default action, so do the focus change a real one would:
    // focus what was pressed, or end a text edit when nothing focusable was hit.
    if (!down.defaultPrevented) pressFocus(target, canvasEl);
  } finally {
    replaying = false;
  }
}

const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], summary, [tabindex], [contenteditable=""], [contenteditable="true"]';

function pressFocus(target: Element, canvasEl: HTMLElement) {
  const focusable = target.closest<HTMLElement>(FOCUSABLE);
  if (focusable) {
    if (document.activeElement !== focusable) focusable.focus({ preventScroll: true });
    return;
  }
  // Only a text field in the canvas itself is blurred: a popup's focus sits behind its own
  // focus trap, which a blur would trip, so it would then ignore the click dismissing it.
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    canvasEl.contains(active) &&
    active.matches('input, textarea, [contenteditable=""], [contenteditable="true"]')
  ) {
    active.blur();
  }
}

/** The click that ends a drag would otherwise dismiss the popup being measured. */
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", swallow, true), 0);
}

function normalize(drag: Drag): Rect {
  return {
    x: Math.min(drag.x0, drag.x),
    y: Math.min(drag.y0, drag.y),
    w: Math.abs(drag.x - drag.x0),
    h: Math.abs(drag.y - drag.y0),
  };
}

/** The demo's own elements, and the popups and dialogs it has open, which portal out of the canvas. */
function collectRoots(canvasEl: HTMLElement, content: HTMLElement): Element[] {
  const roots = Array.from(content.children);
  const portals: Element[] = [];
  // Base UI marks every portal it renders, so a popup is found whether or not it carries slots.
  for (const portal of document.querySelectorAll('[data-base-ui-portal], [data-slot$="-portal"], [data-slot$="-positioner"]')) {
    // A positioner inside a portal already walked is part of it.
    if (canvasEl.contains(portal) || portals.some((outer) => outer.contains(portal))) continue;
    portals.push(portal);
    roots.push(...surfaces(portal));
  }
  return roots;
}

/**
 * A portal's painted surfaces. Backdrops are skipped; unpainted wrappers such as positioners and
 * a dialog's centring viewport are looked through, so each popup is measured as its own surface.
 */
function surfaces(el: Element): Element[] {
  return Array.from(el.children).flatMap((child) => {
    if (child.matches(BACKDROP)) return [];
    const style = getComputedStyle(child);
    if (style.display === "none") return [];
    return hasPaint(style) ? [child] : surfaces(child);
  });
}

/* -- Measuring ----------------------------------------------------------------------- */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** `clip` is the visible box of the nearest scrolling or clipping ancestors. */
type Op = (
  | { kind: "ground"; rect: Rect; radius: number }
  | { kind: "box"; rect: Rect; radius: number }
  | { kind: "hatch"; rect: Rect; radius: number; hole?: Rect }
  | { kind: "dash"; rect: Rect }
  | { kind: "bar"; rect: Rect }
) & { clip?: Rect };

type Point = [number, number];
/** A candidate centre for a label of the given size, or null where it doesn't apply. */
type Place = (w: number, h: number) => Point | null;

interface LabelRequest {
  text: string;
  tone: "size" | "space";
  places: Place[];
  ruler?: { from: Point; to: Point };
  clip?: Rect;
}

interface Scene {
  ops: Op[];
  labels: LabelRequest[];
}

/** Elements measured as a single block rather than walked into. */
const REPLACED = new Set(["svg", "img", "video", "canvas", "input", "textarea", "select", "iframe"]);
const FLOW = new Set(["block", "flow-root", "list-item"]);

function measure(roots: Element[]): Scene {
  const ops: Op[] = [];
  // Labels are placed in priority order; a later one that would overlap is dropped.
  const leafSizes: LabelRequest[] = [];
  const spaces: LabelRequest[] = [];
  const containerSizes: LabelRequest[] = [];
  // A wrapper exactly the size of what it holds would repeat the same pill over it.
  const sized = new Set<string>();
  const range = document.createRange();

  /** `labelled` is false inside a repeat of an earlier sibling: drawn, but measured once. */
  const visit = (el: Element, isRoot: boolean, clip: Rect | undefined, labelled: boolean): boolean => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    if (style.display === "contents") {
      let any = false;
      for (const child of el.children) any = visit(child, isRoot, clip, labelled) || any;
      return any;
    }
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return false;

    const rect: Rect = { x: box.left, y: box.top, w: box.width, h: box.height };
    // Scrolled out of view: draw nothing for it, though a child could still overflow into view.
    const visible = !clip || intersection(rect, clip) !== null;
    const html = el instanceof HTMLElement;
    const width = html && el.offsetWidth ? el.offsetWidth : box.width;
    const height = html && el.offsetHeight ? el.offsetHeight : box.height;
    // Layout sizes are reported; the drawing follows any transform, such as an entrance scale.
    const scale = width ? box.width / width : 1;
    const replaced = REPLACED.has(el.tagName.toLowerCase());
    const radius = cornerRadius(style.borderTopLeftRadius, rect, scale);
    const painted = replaced || hasPaint(style);

    const opStart = ops.length;
    const spaceStart = spaces.length;
    if (isRoot) ops.push({ kind: "ground", rect, radius });
    else if (painted && visible) ops.push({ kind: "box", rect, radius });

    if (!replaced && visible) {
      measurePadding(style, rect, radius, scale, ops, spaces);
      measureGaps(el, style, scale, ops, spaces);
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        range.selectNodeContents(node);
        for (const line of range.getClientRects()) {
          if (line.width < 1) continue;
          const h = Math.max(2, Math.min(line.height * 0.42, 8));
          ops.push({ kind: "bar", rect: { x: line.left, y: line.top + (line.height - h) / 2, w: line.width, h } });
        }
      }
    }

    if (!labelled) spaces.length = spaceStart;
    if (clip) {
      for (let i = opStart; i < ops.length; i++) ops[i]!.clip = clip;
      for (let i = spaceStart; i < spaces.length; i++) spaces[i]!.clip = clip;
    }

    // A scroller's children show only through its padding box, less any scrollbar.
    let childClip = clip;
    let childrenHidden = false;
    if (html && (style.overflowX !== "visible" || style.overflowY !== "visible")) {
      const viewport = { x: box.left + el.clientLeft * scale, y: box.top + el.clientTop * scale, w: el.clientWidth * scale, h: el.clientHeight * scale };
      const next = intersection(clip ?? viewport, viewport);
      if (next) childClip = next;
      else childrenHidden = true;
    }

    let hasChildren = false;
    if (!replaced && !childrenHidden) {
      // Rows, cells, days: siblings built the same way are measured on the first only.
      const seen = new Set<string>();
      for (const child of el.children) {
        const signature = `${child.tagName}|${child.getAttribute("class") ?? ""}`;
        const repeat = seen.has(signature);
        seen.add(signature);
        hasChildren = visit(child, false, childClip, labelled && !repeat) || hasChildren;
      }
    }

    const key = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.w)},${Math.round(rect.h)}`;
    if ((painted || isRoot) && visible && labelled && !sized.has(key)) {
      sized.add(key);
      const text = `${format(width)} × ${format(height)}`;
      if (hasChildren) containerSizes.push({ text, tone: "size", places: containerPlaces(rect), clip });
      else leafSizes.push({ text, tone: "size", places: leafPlaces(rect), clip });
    }
    return true;
  };

  for (const root of roots) visit(root, true, undefined, true);
  return { ops, labels: [...leafSizes, ...spaces, ...containerSizes] };
}

function measurePadding(style: CSSStyleDeclaration, rect: Rect, radius: number, scale: number, ops: Op[], spaces: LabelRequest[]) {
  const [pt, pr, pb, pl] = sides(style, "padding");
  if (Math.max(pt, pr, pb, pl) < 1) return;
  const [bt, br, bb, bl] = sides(style, "border");
  const outer = inset(rect, bt * scale, br * scale, bb * scale, bl * scale);
  const inner = inset(outer, pt * scale, pr * scale, pb * scale, pl * scale);
  if (inner.w <= 0 || inner.h <= 0) return;

  ops.push({ kind: "hatch", rect: outer, radius: Math.max(0, radius - bt * scale), hole: inner });
  ops.push({ kind: "dash", rect: inner });
  const cx = inner.x + inner.w / 2;
  const cy = inner.y + inner.h / 2;
  if (pl >= 1) spaces.push(spaceLabel(pl, [outer.x, cy], [inner.x, cy]));
  // Equal opposite sides read from one label.
  if (pr >= 1 && pr !== pl) spaces.push(spaceLabel(pr, [inner.x + inner.w, cy], [outer.x + outer.w, cy]));
  if (pt >= 1) spaces.push(spaceLabel(pt, [cx, outer.y], [cx, inner.y]));
  if (pb >= 1 && pb !== pt) spaces.push(spaceLabel(pb, [cx, inner.y + inner.h], [cx, outer.y + outer.h]));
}

/** Gaps between in-flow children: flex and block flow along their axis, grids both ways. */
function measureGaps(el: Element, style: CSSStyleDeclaration, scale: number, ops: Op[], spaces: LabelRequest[]) {
  const display = style.display;
  const flex = display.includes("flex");
  const grid = display.includes("grid");
  if (!flex && !grid && !FLOW.has(display)) return;
  const children = flowChildren(el, !flex && !grid);
  if (children.length < 2) return;

  // Every gap is hatched; each distinct value along an axis is labelled once.
  const shown = new Set<string>();
  const between = (a: Rect, b: Rect, axis: "x" | "y") => {
    const aEnd = axis === "x" ? a.x + a.w : a.y + a.h;
    const bStart = axis === "x" ? b.x : b.y;
    const gap = bStart - aEnd;
    if (gap < 0.5) return;
    const lo = axis === "x" ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
    const hi = axis === "x" ? Math.min(a.y + a.h, b.y + b.h) : Math.min(a.x + a.w, b.x + b.w);
    if (hi - lo < 1) return;
    const mid = (lo + hi) / 2;
    const value = gap / scale;
    const label = !shown.has(`${axis}${format(value)}`);
    shown.add(`${axis}${format(value)}`);
    if (axis === "x") {
      ops.push({ kind: "hatch", rect: { x: aEnd, y: lo, w: gap, h: hi - lo }, radius: 0 });
      if (label) spaces.push(spaceLabel(value, [aEnd, mid], [bStart, mid]));
    } else {
      ops.push({ kind: "hatch", rect: { x: lo, y: aEnd, w: hi - lo, h: gap }, radius: 0 });
      if (label) spaces.push(spaceLabel(value, [mid, aEnd], [mid, bStart]));
    }
  };

  if (grid) {
    // Each cell to its nearest neighbour on the right and below.
    for (const a of children) {
      let right: Rect | undefined;
      let below: Rect | undefined;
      for (const b of children) {
        if (b === a) continue;
        if (b.x >= a.x + a.w - 0.5 && overlaps(a.y, a.h, b.y, b.h) && (!right || b.x < right.x)) right = b;
        if (b.y >= a.y + a.h - 0.5 && overlaps(a.x, a.w, b.x, b.w) && (!below || b.y < below.y)) below = b;
      }
      if (right) between(a, right, "x");
      if (below) between(a, below, "y");
    }
    return;
  }

  const axis = flex && !style.flexDirection.startsWith("column") ? "x" : "y";
  const sorted = [...children].sort((a, b) => (axis === "x" ? a.x - b.x : a.y - b.y));
  sorted.forEach((a, i) => {
    const b = sorted[i + 1];
    if (b) between(a, b, axis);
  });
}

function flowChildren(el: Element, blockOnly: boolean): Rect[] {
  const out: Rect[] = [];
  for (const child of el.children) {
    const style = getComputedStyle(child);
    if (style.display === "none" || style.position === "absolute" || style.position === "fixed") continue;
    if (style.display === "contents") {
      out.push(...flowChildren(child, blockOnly));
      continue;
    }
    if (blockOnly && style.display.startsWith("inline")) continue;
    const box = child.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    out.push({ x: box.left, y: box.top, w: box.width, h: box.height });
  }
  return out;
}

function spaceLabel(value: number, from: Point, to: Point): LabelRequest {
  const mid: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const vertical = from[0] === to[0];
  const gap = 3;
  return {
    text: format(value),
    tone: "space",
    ruler: { from, to },
    places: vertical
      ? [
          (w) => [mid[0] + w / 2 + gap, mid[1]],
          (w) => [mid[0] - w / 2 - gap, mid[1]],
          () => mid,
        ]
      : [
          (_, h) => [mid[0], mid[1] + h / 2 + gap],
          (_, h) => [mid[0], mid[1] - h / 2 - gap],
          () => mid,
        ],
  };
}

/** A block's size sits inside it when there's room, otherwise just outside a corner or side. */
function leafPlaces(rect: Rect): Place[] {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return [
    (w, h) => (rect.w >= w + 4 && rect.h >= h + 2 ? [cx, cy] : null),
    (w, h) => [rect.x + w / 2, rect.y - h / 2 - 2],
    (w, h) => [rect.x + w / 2, rect.y + rect.h + h / 2 + 2],
    (w) => [rect.x + rect.w + w / 2 + 3, cy],
    (w) => [rect.x - w / 2 - 3, cy],
  ];
}

/** A container's size straddles its bottom edge, or its top edge when that's taken. */
function containerPlaces(rect: Rect): Place[] {
  const cx = rect.x + rect.w / 2;
  return [() => [cx, rect.y + rect.h], () => [cx, rect.y], (_, h) => [cx, rect.y + rect.h - h / 2 - 3]];
}

/* -- Style helpers ------------------------------------------------------------------- */

function sides(style: CSSStyleDeclaration, kind: "padding" | "border"): [number, number, number, number] {
  const read = (side: "Top" | "Right" | "Bottom" | "Left") =>
    kind === "padding"
      ? parseFloat(style[`padding${side}`]) || 0
      : style[`border${side}Style`] === "none"
        ? 0
        : parseFloat(style[`border${side}Width`]) || 0;
  return [read("Top"), read("Right"), read("Bottom"), read("Left")];
}

function inset(rect: Rect, top: number, right: number, bottom: number, left: number): Rect {
  return { x: rect.x + left, y: rect.y + top, w: rect.w - left - right, h: rect.h - top - bottom };
}

function cornerRadius(value: string, rect: Rect, scale: number) {
  const max = Math.min(rect.w, rect.h) / 2;
  const n = parseFloat(value) || 0;
  return Math.min(max, value.trim().endsWith("%") ? (Math.min(rect.w, rect.h) * n) / 100 : n * scale);
}

function hasPaint(style: CSSStyleDeclaration) {
  if (style.backgroundImage !== "none" || alphaOf(style.backgroundColor) > 0) return true;
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    if (style[`border${side}Style`] !== "none" && parseFloat(style[`border${side}Width`]) > 0 && alphaOf(style[`border${side}Color`]) > 0) {
      return true;
    }
  }
  // `shadow-border` paints the edge as a shadow; an unset Tailwind shadow is all-transparent.
  if (style.boxShadow && style.boxShadow !== "none") {
    const colors = style.boxShadow.match(/(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)/g) ?? [];
    return colors.some((color) => alphaOf(color) > 0);
  }
  return false;
}

function alphaOf(color: string) {
  if (!color || color === "transparent") return 0;
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slash?.[1]) return parseFloat(slash[1]) / (slash[2] ? 100 : 1);
  const legacy = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/);
  if (legacy?.[1]) return parseFloat(legacy[1]);
  return 1;
}

/** The shared area of two rects, or null when they don't overlap. */
function intersection(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

function contains(rect: Rect, [x, y]: Point) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function overlaps(a: number, aSize: number, b: number, bSize: number) {
  return Math.min(a + aSize, b + bSize) - Math.max(a, b) > 0.5;
}

function format(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return String(Number.isInteger(rounded) ? rounded : rounded.toFixed(1));
}

/* -- Painting ------------------------------------------------------------------------ */

interface Palette {
  dark: boolean;
  /** Rulers, hatching, and the selection. */
  line: string;
  /** Size pills. */
  pill: string;
  ground: string;
  ink: string;
  font: string;
}

const LABEL_H = 14;
const LABEL_PAD = 4;
/** The least space between two labels; closer ones drop the later label. */
const LABEL_GAP = 6;
const HATCH = 6;
const GRID = 8;

function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
  const dark = root.colorScheme.includes("dark");
  return {
    dark,
    line: token(dark ? "--color-accent-400" : "--color-accent-600", "dodgerblue"),
    pill: token("--color-accent-500", "dodgerblue"),
    ground: token("--background", dark ? "black" : "white"),
    ink: token("--foreground", dark ? "white" : "black"),
    font: `600 10px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`,
  };
}

function paint(ctx: CanvasRenderingContext2D, scene: Scene, selection: Rect, bounds: Rect, palette: Palette) {
  const { dark } = palette;
  ctx.save();
  ctx.beginPath();
  ctx.rect(selection.x, selection.y, selection.w, selection.h);
  ctx.clip();

  fill(ctx, palette.line, dark ? 0.14 : 0.08, () => ctx.rect(selection.x, selection.y, selection.w, selection.h));

  for (const op of scene.ops) {
    const { rect } = op;
    ctx.save();
    if (op.clip) {
      ctx.beginPath();
      ctx.rect(op.clip.x, op.clip.y, op.clip.w, op.clip.h);
      ctx.clip();
    }
    switch (op.kind) {
      case "ground": {
        const shape = () => ctx.roundRect(rect.x, rect.y, rect.w, rect.h, op.radius);
        fill(ctx, palette.ground, 1, shape);
        fill(ctx, palette.pill, dark ? 0.16 : 0.07, shape);
        ctx.save();
        ctx.beginPath();
        shape();
        ctx.clip();
        grid(ctx, rect, palette.line, dark ? 0.05 : 0.06);
        ctx.restore();
        stroke(ctx, palette.line, 0.55, shape);
        break;
      }
      case "box": {
        const shape = () => ctx.roundRect(rect.x, rect.y, rect.w, rect.h, op.radius);
        fill(ctx, palette.ink, dark ? 0.07 : 0.05, shape);
        stroke(ctx, palette.ink, dark ? 0.12 : 0.1, shape);
        break;
      }
      case "hatch":
        hatch(ctx, op, palette.line, dark ? 0.2 : 0.22);
        break;
      case "dash":
        ctx.setLineDash([3, 3]);
        stroke(ctx, palette.line, 0.4, () => ctx.rect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1));
        ctx.setLineDash([]);
        break;
      case "bar":
        fill(ctx, palette.ink, dark ? 0.1 : 0.09, () => ctx.roundRect(rect.x, rect.y, rect.w, rect.h, rect.h / 2));
        break;
    }
    ctx.restore();
  }

  const taken: Rect[] = [];
  for (const label of scene.labels) {
    const w = Math.ceil(ctx.measureText(label.text).width) + LABEL_PAD * 2;
    for (const place of label.places) {
      const centre = place(w, LABEL_H);
      // A label for something partly scrolled away must sit over the part still in view.
      if (!centre || (label.clip && !contains(label.clip, centre))) continue;
      const box = { x: Math.round(centre[0] - w / 2), y: Math.round(centre[1] - LABEL_H / 2), w, h: LABEL_H };
      if (taken.some((other) => intersects(other, box, LABEL_GAP))) continue;
      taken.push(box);
      if (label.ruler) {
        const { clip } = label;
        ctx.save();
        if (clip) {
          ctx.beginPath();
          ctx.rect(clip.x, clip.y, clip.w, clip.h);
          ctx.clip();
        }
        ruler(ctx, label.ruler.from, label.ruler.to, palette.line);
        ctx.restore();
      }
      pill(ctx, box, label.text, label.tone, palette);
      break;
    }
  }
  ctx.restore();

  // The selection and its size sit outside the clip.
  stroke(ctx, palette.line, 1, () => ctx.rect(selection.x + 0.5, selection.y + 0.5, selection.w - 1, selection.h - 1));
  const text = `${Math.round(selection.w)} × ${Math.round(selection.h)}`;
  const w = Math.ceil(ctx.measureText(text).width) + LABEL_PAD * 2;
  // Below the selection, or just inside its bottom edge where the playground ends first.
  const below = selection.y + selection.h + 6;
  const y = below + LABEL_H <= bounds.y + bounds.h ? below : selection.y + selection.h - 6 - LABEL_H;
  const x = Math.min(Math.max(selection.x + selection.w / 2 - w / 2, bounds.x + 4), bounds.x + bounds.w - w - 4);
  pill(ctx, { x: Math.round(x), y: Math.round(y), w, h: LABEL_H }, text, "size", palette);
}

function fill(ctx: CanvasRenderingContext2D, color: string, alpha: number, shape: () => void) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  shape();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function stroke(ctx: CanvasRenderingContext2D, color: string, alpha: number, shape: () => void) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  shape();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Diagonal hatching anchored to the viewport, so neighbouring regions line up. */
function hatch(ctx: CanvasRenderingContext2D, op: Extract<Op, { kind: "hatch" }>, color: string, alpha: number) {
  const { rect, hole } = op;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, op.radius);
  if (hole) ctx.rect(hole.x, hole.y, hole.w, hole.h);
  ctx.clip("evenodd");
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const top = rect.y;
  const bottom = rect.y + rect.h;
  for (let c = Math.floor((rect.x + top) / HATCH) * HATCH; c <= rect.x + rect.w + bottom; c += HATCH) {
    ctx.moveTo(c - top, top);
    ctx.lineTo(c - bottom, bottom);
  }
  ctx.stroke();
  ctx.restore();
}

function grid(ctx: CanvasRenderingContext2D, rect: Rect, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.ceil(rect.x / GRID) * GRID; x <= rect.x + rect.w; x += GRID) {
    ctx.moveTo(x + 0.5, rect.y);
    ctx.lineTo(x + 0.5, rect.y + rect.h);
  }
  for (let y = Math.ceil(rect.y / GRID) * GRID; y <= rect.y + rect.h; y += GRID) {
    ctx.moveTo(rect.x, y + 0.5);
    ctx.lineTo(rect.x + rect.w, y + 0.5);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** A measured span with a short perpendicular tick at each end. */
function ruler(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const vertical = from[0] === to[0];
  const tick = 3;
  const snap = (n: number) => Math.round(n) + 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (vertical) {
    const x = snap(from[0]);
    ctx.moveTo(x, from[1]);
    ctx.lineTo(x, to[1]);
    for (const y of [from[1], to[1]]) {
      ctx.moveTo(x - tick, snap(y));
      ctx.lineTo(x + tick, snap(y));
    }
  } else {
    const y = snap(from[1]);
    ctx.moveTo(from[0], y);
    ctx.lineTo(to[0], y);
    for (const x of [from[0], to[0]]) {
      ctx.moveTo(snap(x), y - tick);
      ctx.lineTo(snap(x), y + tick);
    }
  }
  ctx.stroke();
}

/** Sizes read white on the accent; spacing reads accent on the page ground. */
function pill(ctx: CanvasRenderingContext2D, box: Rect, text: string, tone: "size" | "space", palette: Palette) {
  const shape = () => ctx.roundRect(box.x, box.y, box.w, box.h, 3);
  if (tone === "size") {
    fill(ctx, palette.pill, 1, shape);
  } else {
    fill(ctx, palette.ground, 1, shape);
    stroke(ctx, palette.line, 0.35, () => ctx.roundRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, 2.5));
  }
  ctx.fillStyle = tone === "size" ? "white" : palette.line;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, box.x + box.w / 2, box.y + box.h / 2 + 0.5);
}

function intersects(a: Rect, b: Rect, margin: number) {
  return a.x < b.x + b.w + margin && b.x < a.x + a.w + margin && a.y < b.y + b.h + margin && b.y < a.y + a.h + margin;
}
