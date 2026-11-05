"use client";

import { useLayoutEffect, useState } from "react";
import { duration, ease } from "@/registry/lib/motion";

/**
 * Moving between open menus hands one popup over to the next instead of closing one and
 * opening another, after Animate UI's Base UI Menubar.
 *
 * The incoming menu's popup skips its entrance. It starts where the outgoing popup is, at its
 * size, and moves and resizes to its own place on a spring, so the box slides along the bar.
 * Both menus' rows hold still on screen while it does: a frozen, inert copy of the outgoing
 * rows slides 6px away and fades, and the incoming rows slide 6px in and fade up, with the
 * moving box clipping both. The outgoing popup is hidden the frame the handoff starts, and
 * Base UI closes it as usual.
 *
 * Layout properties are animated on purpose here: the box's width and height are what change
 * between two menus, and margins pay back the difference so Base UI places the popup once, at
 * its own size, and never re-measures mid-flight. Everything runs on Web Animations and is
 * cleared when it lands. Springs are converted to `linear()` curves, and every duration scales
 * with `--duration-slow`, so the motion controls and reduced motion (where it collapses to
 * 1ms) apply. Without Web Animations, or under reduced motion, the menus keep their short CSS
 * swap (`data-instant="group"`).
 */

/** How far the rows slide as one menu's content gives way to the next. */
const SHIFT_PX = 6;
/** The box's move and resize: critically damped, settled in about 200ms, no overshoot. */
const MOVE_SPRING = { stiffness: 1485, damping: 78 };
/** The incoming rows' slide, as damped, a little softer. */
const SLIDE_SPRING = { stiffness: 1012, damping: 64 };
/** `--duration-slow` in milliseconds at rest; the motion controls scale every timing by it. */
const SLOW_MS = duration.slow * 1000;
const UNIQUE_ATTRIBUTES = ["id", "data-testid", "tabindex", "autofocus"];
/** How long a closed popup's snapshot can still hand over to the next menu. */
const SNAPSHOT_MS = 300;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A popup's box by layout, not `getBoundingClientRect()`: that includes the CSS `scale` of an
 * entrance or exit still in progress, and a handoff that lands on a scaled size snaps wider
 * once it clears. Layout sizes ignore scale but include a resize in flight, and the position
 * adds any slide in flight, so a handoff that interrupts another starts from where it is.
 */
function boxOf(popup: HTMLElement): Box {
  const container = (popup.offsetParent as HTMLElement | null) ?? popup.parentElement;
  const origin = container?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const style = getComputedStyle(popup);
  const [x = "0", y = "0"] = (style.translate || "none").split(" ");
  const slide = (value: string) => (value === "none" ? 0 : Number.parseFloat(value) || 0);
  // The computed border-box size, unrounded: `offsetWidth` rounds, which would snap by a
  // fraction of a pixel on landing. The library's base styles make every box border-box.
  const size = (value: string, fallback: number) => {
    const parsed = Number.parseFloat(value);
    return style.boxSizing === "border-box" && Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    left: origin.left + (container?.clientLeft ?? 0) + popup.offsetLeft + slide(x),
    top: origin.top + (container?.clientTop ?? 0) + popup.offsetTop + slide(y),
    width: size(style.width, popup.offsetWidth),
    height: size(style.height, popup.offsetHeight),
  };
}

/** Where an outgoing popup was, and what it showed, for the next menu to take over from. */
interface Outgoing {
  /** The live popup to hide when the handoff starts, while it is still in the document. */
  popup: HTMLElement | null;
  rect: Box;
  border: readonly [number, number];
  copy: Copy;
}

export interface MenubarHandoffGroup {
  /**
   * Every popup in the bar: the order it last opened in, and whether it is open as far as the
   * bar knows. That lags Base UI's attributes by a microtask, which is the point: when the next
   * menu opens, the one it replaces has already lost `data-open` but still counts here.
   */
  popups: Map<HTMLElement, { openedAt: number; open: boolean }>;
  clock: number;
  /**
   * The last popup to close, captured as it closed. Base UI may close one menu before it opens
   * the next, and a popup without an exit transition leaves the document at once.
   */
  closed: (Outgoing & { at: number }) | null;
}

export function createMenubarHandoffGroup(): MenubarHandoffGroup {
  return { popups: new Map(), clock: 0, closed: null };
}

function capture(popup: HTMLElement): Outgoing {
  return {
    popup,
    rect: boxOf(popup),
    border: [popup.clientLeft, popup.clientTop],
    copy: copyContent(popup),
  };
}

interface Timing {
  duration: number;
  easing: string;
}

const springCurves = new Map<string, { duration: number; easing: string }>();

/** A spring from rest to rest as a `linear()` curve, and how long it takes to settle. */
function springCurve({ stiffness, damping }: { stiffness: number; damping: number }) {
  const key = `${stiffness}/${damping}`;
  const cached = springCurves.get(key);
  if (cached) return cached;
  const step = 1 / 240;
  const samples = [0];
  let position = 0;
  let velocity = 0;
  let time = 0;
  while (time < 2) {
    const acceleration = -stiffness * (position - 1) - damping * velocity;
    velocity += acceleration * step;
    position += velocity * step;
    time += step;
    samples.push(position);
    if (Math.abs(1 - position) < 0.0005 && Math.abs(velocity) < 0.005) break;
  }
  samples[samples.length - 1] = 1;
  // Forty stops are plenty for a curve this smooth, and keep the easing string short.
  const stops = 40;
  const points = Array.from({ length: stops + 1 }, (_, index) =>
    samples[Math.round((index / stops) * (samples.length - 1))]!.toFixed(4),
  );
  const curve = { duration: time * 1000, easing: `linear(${points.join(", ")})` };
  springCurves.set(key, curve);
  return curve;
}

const bezier = ([a, b, c, d]: readonly number[]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;

/** `--duration-slow` against its resting 300ms: 4x under the slow-motion control, ~0 reduced. */
function timeScale(element: HTMLElement) {
  const token = getComputedStyle(element).getPropertyValue("--duration-slow").trim();
  const value = Number.parseFloat(token);
  if (!Number.isFinite(value)) return 1;
  return (token.endsWith("ms") ? value : value * 1000) / SLOW_MS;
}

function canAnimate(element: HTMLElement) {
  return typeof element.animate === "function" &&
    !element.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

interface Copy {
  element: HTMLDivElement;
  scrolls: [HTMLElement, number, number][];
}

/** A frozen, inert copy of a popup's rows, sized to its padding box. */
function copyContent(popup: HTMLElement): Copy {
  const computed = getComputedStyle(popup);
  const element = popup.ownerDocument.createElement("div");
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("inert", "");
  element.setAttribute("data-slot", "menubar-handoff-copy");
  Object.assign(element.style, {
    position: "absolute",
    margin: "0px",
    boxSizing: "border-box",
    width: `${popup.clientWidth}px`,
    height: `${popup.clientHeight}px`,
    overflow: "hidden",
    pointerEvents: "none",
    display: "flex",
    flexDirection: computed.flexDirection,
  });
  const scrolls: Copy["scrolls"] = [];
  const keepScroll = (original: Element, copy: Element) => {
    if (original.scrollTop || original.scrollLeft) {
      scrolls.push([copy as HTMLElement, original.scrollTop, original.scrollLeft]);
    }
    for (let index = 0; index < original.children.length; index += 1) {
      const child = copy.children[index];
      if (child) keepScroll(original.children[index]!, child);
    }
  };
  for (const node of Array.from(popup.childNodes)) {
    if (node instanceof Element && node.getAttribute("data-slot") === "menubar-handoff-copy") continue;
    const copy = node.cloneNode(true);
    if (node instanceof Element && copy instanceof Element) {
      keepScroll(node, copy);
      for (const each of [copy, ...copy.querySelectorAll("*")]) {
        for (const name of UNIQUE_ATTRIBUTES) each.removeAttribute(name);
      }
    }
    element.appendChild(copy);
  }
  return { element, scrolls };
}

/**
 * What the bar is moving away from: the last opened popup that is still showing, or else the
 * one that closed just now.
 */
function sourceFor(group: MenubarHandoffGroup, popup: HTMLElement): Outgoing | null {
  let live: HTMLElement | null = null;
  let latest = -1;
  for (const [other, { openedAt, open }] of group.popups) {
    if (other === popup || !other.isConnected || other.style.visibility === "hidden") continue;
    if (!open && !other.hasAttribute("data-open") && !other.hasAttribute("data-ending-style")) continue;
    if (openedAt > latest) {
      latest = openedAt;
      live = other;
    }
  }
  if (live) return capture(live);
  const closed = group.closed;
  if (closed && closed.popup !== popup && performance.now() - closed.at < SNAPSHOT_MS) {
    return { ...closed, popup: closed.popup?.isConnected ? closed.popup : null };
  }
  return null;
}

/**
 * Start a handoff to `popup` if another menu's popup is showing. Returns a cancel function,
 * or null when the popup opens on its own.
 */
function beginHandoff(group: MenubarHandoffGroup, popup: HTMLElement): (() => void) | null {
  if (!canAnimate(popup)) return null;
  const scale = timeScale(popup);
  if (scale < 0.01) return null;
  const source = sourceFor(group, popup);
  if (!source) return null;
  group.closed = null;

  const { rect: from, border: sourceBorder, copy } = source;
  // No entrance, and nothing painted until the handoff can start from the outgoing box.
  popup.setAttribute("data-handoff", "");
  popup.style.opacity = "0";

  const animations: Animation[] = [];
  let madeRelative = false;
  let started = false;
  const finish = () => {
    for (const animation of animations) animation.cancel();
    animations.length = 0;
    copy.element.remove();
    popup.style.opacity = "";
    popup.removeAttribute("data-handoff");
    if (madeRelative) popup.style.position = "";
    madeRelative = false;
  };

  const start = () => {
    if (started) return;
    started = true;
    stopWaiting();
    popup.style.opacity = "";
    if (source.popup) source.popup.style.visibility = "hidden";
    if (!popup.isConnected) return finish();

    const animate = (element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = element.animate(keyframes, options);
      animations.push(animation);
      return animation;
    };
    const springTiming = (spring: typeof MOVE_SPRING): Timing => {
      const curve = springCurve(spring);
      return { duration: curve.duration * scale, easing: curve.easing };
    };
    const move = springTiming(MOVE_SPRING);
    const slideIn = springTiming(SLIDE_SPRING);
    const out: Timing = { duration: duration.fast * 1000 * scale, easing: bezier(ease.out) };
    const fadeIn: Timing = { duration: duration.base * 1000 * scale, easing: bezier(ease.in) };

    const to = boxOf(popup);
    const computed = getComputedStyle(popup);
    const rows = Array.from(popup.children);
    // Each part's final size, read before anything animates.
    const finalSizes = rows.map((row) => {
      const style = getComputedStyle(row);
      return { width: style.width, height: style.height };
    });
    const x = from.left - to.left;
    const y = from.top - to.top;
    const moves = Math.abs(x) >= 0.5 || Math.abs(y) >= 0.5;
    const horizontal = Math.abs(x) >= Math.abs(y);
    // +1 moving right or down: the incoming rows arrive from that side, the old ones leave
    // toward the other.
    const way = -Math.sign(horizontal ? x : y) || 1;
    const along = (distance: number) => (horizontal ? `${distance}px 0px` : `0px ${distance}px`);

    // The box: the outgoing size to its own, with margins paying the difference back so its
    // layout footprint is its final size throughout.
    const marginRight = Number.parseFloat(computed.marginRight) || 0;
    const marginBottom = Number.parseFloat(computed.marginBottom) || 0;
    const sizing = { boxSizing: "border-box", minWidth: "0px", maxWidth: "none", minHeight: "0px", maxHeight: "none" };
    animate(popup, [
      { ...sizing, width: `${from.width}px`, height: `${from.height}px`,
        marginRight: `${marginRight + to.width - from.width}px`, marginBottom: `${marginBottom + to.height - from.height}px` },
      { ...sizing, width: `${to.width}px`, height: `${to.height}px`,
        marginRight: `${marginRight}px`, marginBottom: `${marginBottom}px` },
    ], move);
    if (moves) {
      animate(popup, [{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }], { ...move, composite: "add" });
    }
    // Clip both menus' rows to the moving box.
    const settle = Math.max(move.duration, out.duration, fadeIn.duration);
    const clip = { overflow: "hidden" };
    animate(popup, [clip, clip], { duration: settle });

    // The incoming rows keep their final layout from the first frame: each part is held at its
    // final size, so nothing rewraps, and no scrollbar appears, while the box is smaller than
    // its content; it only clips them.
    rows.forEach((row, index) => {
      const held = { ...finalSizes[index], flexShrink: "0" };
      animate(row, [held, held], { duration: settle });
    });

    // The incoming rows: still on screen while the box moves over them, sliding in and fading up.
    for (const row of rows) {
      const rest = getComputedStyle(row).opacity;
      animate(row, [{ opacity: 0 }, { opacity: rest }], fadeIn);
      if (moves) {
        animate(row, [{ translate: `${-x}px ${-y}px` }, { translate: "0px 0px" }], { ...move, composite: "add" });
      }
      animate(row, [{ translate: along(way * SHIFT_PX) }, { translate: "0px 0px" }], { ...slideIn, composite: "add" });
    }

    // The outgoing rows: where they were on screen, sliding away and fading out.
    if (computed.position === "static") {
      popup.style.position = "relative";
      madeRelative = true;
    }
    copy.element.style.left = `${sourceBorder[0] - popup.clientLeft}px`;
    copy.element.style.top = `${sourceBorder[1] - popup.clientTop}px`;
    popup.appendChild(copy.element);
    for (const [element, top, left] of copy.scrolls) {
      element.scrollTop = top;
      element.scrollLeft = left;
    }
    if (moves) {
      animate(copy.element, [{ translate: "0px 0px" }, { translate: `${x}px ${y}px` }], { ...move, composite: "add", fill: "forwards" });
    }
    animate(copy.element, [{ translate: "0px 0px" }, { translate: along(-way * SHIFT_PX) }], { ...out, composite: "add", fill: "forwards" });
    animate(copy.element, [{ opacity: 1 }, { opacity: 0 }], { ...out, fill: "forwards" });

    Promise.all(animations.map((animation) => animation.finished)).then(finish, () => {});
  };

  // Start once the incoming popup is placed: its first resize, or the next frame.
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(start) : null;
  observer?.observe(popup);
  const frame = requestAnimationFrame(start);
  const stopWaiting = () => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
  };
  return () => {
    stopWaiting();
    finish();
  };
}

/** Track one popup's opening and closing for its bar, starting handoffs as it opens. */
function watchPopup(group: MenubarHandoffGroup, popup: HTMLElement) {
  let cancel: (() => void) | null = null;
  let open = false;
  // Captured as it closes, while it is still where it was: the next menu may open after it's
  // gone.
  const remember = () => {
    if (popup.isConnected && popup.style.visibility !== "hidden") {
      group.closed = { ...capture(popup), at: performance.now() };
    }
  };
  const sync = () => {
    const nowOpen = popup.hasAttribute("data-open");
    if (nowOpen === open) return;
    open = nowOpen;
    if (!open) {
      cancel?.();
      cancel = null;
      remember();
      const entry = group.popups.get(popup);
      if (entry) entry.open = false;
      return;
    }
    // A popup hidden by an earlier handoff away from it shows again when it reopens.
    popup.style.visibility = "";
    group.clock += 1;
    group.popups.set(popup, { openedAt: group.clock, open: true });
    cancel = beginHandoff(group, popup);
  };
  group.popups.set(popup, { openedAt: 0, open: false });
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(popup, { attributes: true, attributeFilter: ["data-open"] });
  return () => {
    observer.disconnect();
    cancel?.();
    // Unmounting while open (a popup without an exit transition) is a close too.
    if (open) remember();
    group.popups.delete(popup);
  };
}

/**
 * Register a menubar popup with its bar's handoff group. Returns the callback ref for the
 * popup element.
 */
export function useMenubarHandoff(group: MenubarHandoffGroup | null) {
  const [popup, setPopup] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => (group && popup ? watchPopup(group, popup) : undefined), [group, popup]);
  const ref: (node: HTMLElement | null) => void = setPopup;
  return ref;
}
