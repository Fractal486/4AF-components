"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { HeroComponentPreview } from "./hero-component-preview";

/** Clearance kept around each piece of copy before the artwork starts, in px. */
const PAD = 48;
/** How softly the artwork comes back after that clearance (SVG blur deviation), in px. */
const SOFTNESS = 36;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The landing hero's artwork, kept clear of the copy laid over it.
 *
 * The hero's copy marks its pieces with `data-hero-copy` (`"text"` for a heading, measured line
 * by line). This measures where each one actually ends and masks the artwork out of a soft
 * shape around them, from the hero's left edge to each piece's own right edge. The artwork
 * fades in sooner beside a short title line, later beside the wide command boxes. Nothing is
 * painted over the artwork: the mask is an SVG image layered with the artwork's edge fades.
 */
export function HeroBackdrop({ className, artworkClassName }: { className?: string; artworkClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState<string>();

  useLayoutEffect(() => {
    const backdrop = ref.current;
    const hero = backdrop?.closest<HTMLElement>("[data-hero]");
    if (!backdrop || !hero) return;

    const measure = () => {
      const area = backdrop.getBoundingClientRect();
      if (area.width === 0 || area.height === 0) return;
      const boxes: Box[] = [];
      for (const piece of hero.querySelectorAll<HTMLElement>("[data-hero-copy]")) {
        const rects = piece.dataset.heroCopy === "text" ? lineRects(piece) : [piece.getBoundingClientRect()];
        for (const rect of rects) {
          boxes.push({
            left: 0,
            top: rect.top - area.top - PAD,
            right: rect.right - area.left + PAD,
            bottom: rect.bottom - area.top + PAD,
          });
        }
      }
      // One continuous shape for the whole copy: each box reaches down to the next one, so the
      // gaps between the title, buttons, commands and credit stay clear too, while each keeps
      // its own right edge.
      boxes.sort((a, b) => a.top - b.top);
      for (let index = 0; index < boxes.length - 1; index++) {
        boxes[index]!.bottom = Math.max(boxes[index]!.bottom, boxes[index + 1]!.top);
      }
      setMask(svgMask(area.width, area.height, boxes));
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(hero);
    // Fonts settle the title's line widths; the entrance moves the copy into place.
    void document.fonts?.ready.then(measure);
    const settle = window.setTimeout(measure, 1500);
    return () => {
      resize.disconnect();
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={mask ? ({ "--hero-copy-mask": mask } as CSSProperties) : undefined}
    >
      <HeroComponentPreview entrance className={artworkClassName} />
    </div>
  );
}

/**
 * One rect per rendered line of a piece of text, spanning that line's words. A BlurText heading
 * also holds a screen-reader copy of its text, kept on one unbroken line out of sight; only its
 * visible, `aria-hidden` letters are measured, or that copy reads as one long first line.
 */
function lineRects(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element.querySelector(":scope > [aria-hidden='true']") ?? element);
  const lines = new Map<number, Box>();
  for (const rect of range.getClientRects()) {
    if (rect.width === 0) continue;
    const key = Math.round(rect.bottom / 8);
    const line = lines.get(key);
    lines.set(key, line
      ? { left: Math.min(line.left, rect.left), top: Math.min(line.top, rect.top), right: Math.max(line.right, rect.right), bottom: Math.max(line.bottom, rect.bottom) }
      : { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  }
  return [...lines.values()];
}

/** An alpha mask: opaque everywhere except blurred cut-outs over the boxes. */
function svgMask(width: number, height: number, boxes: Box[]) {
  const cutouts = boxes
    .map((box) => `<rect x="${box.left - SOFTNESS * 3}" y="${box.top}" width="${box.right - box.left + SOFTNESS * 3}" height="${box.bottom - box.top}"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${SOFTNESS}"/></filter>` +
    `<mask id="m"><rect width="100%" height="100%" fill="white"/><g fill="black" filter="url(#s)">${cutouts}</g></mask></defs>` +
    `<rect width="100%" height="100%" fill="black" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
