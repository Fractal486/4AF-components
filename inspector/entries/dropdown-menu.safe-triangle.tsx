"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Draws the hover-safe area Base UI uses between a submenu row and its panel.
 *
 * Base UI computes the area inside its submenu hover handler (`floating-ui-react/
 * safePolygon.js`) and never renders it, so this rebuilds the same geometry from the DOM:
 * the point where the pointer leaves the row, the row's rect, the panel positioner's rect,
 * and the positioner's `data-side`.
 *
 * While the pointer is on the row, the area is previewed from the cursor: the shape Base UI
 * would build if the pointer left there. Once it leaves, the shape is fixed at the exit point
 * and turns solid while the pointer travels inside it, along with the straight "trough"
 * between row and panel. Leaving outside it is the case where Base UI closes the submenu,
 * so nothing is drawn; landing on the panel clears it too.
 *
 * Demo-only: a reading aid for the inspector, mirroring Base UI 1.9.0. If Base UI changes
 * its geometry, this drawing goes stale; the menu's behaviour does not depend on it.
 */
export function SafeTriangleOverlay() {
  const [shape, setShape] = useState<SafeShape | null>(null);

  useEffect(() => {
    let exit: { x: number; y: number; row: Element } | null = null;

    const onMove = (event: PointerEvent) => {
      const row = openSubmenuRow();
      const floating = row && panelFor(row);
      const side = floating?.getAttribute("data-side") as Side | null | undefined;
      if (!row || !floating || !side) {
        exit = null;
        setShape(null);
        return;
      }

      const { clientX: x, clientY: y } = event;
      const refRect = row.getBoundingClientRect();
      const rect = floating.getBoundingClientRect();
      if (contains(rect, x, y)) {
        // Landed on the panel: nothing is being bridged.
        exit = null;
        setShape(null);
        return;
      }

      if (contains(refRect, x, y)) {
        // On the row: preview the area a leave from this point would get.
        exit = null;
        setShape({ ...safeGeometry(side, x, y, refRect, rect), inside: false });
        return;
      }

      if (!exit || exit.row !== row) exit = { x, y, row };
      const geometry = safeGeometry(side, exit.x, exit.y, refRect, rect);
      const inside = insideQuad(x, y, geometry.polygon) || insideRect(x, y, geometry.trough);
      setShape(inside ? { ...geometry, inside } : null);
    };

    document.addEventListener("pointermove", onMove, true);
    return () => document.removeEventListener("pointermove", onMove, true);
  }, []);

  if (!shape) return null;

  return createPortal(
    <svg
      aria-hidden
      data-slot="safe-triangle-overlay"
      className="pointer-events-none fixed inset-0 z-[60] size-full overflow-visible"
    >
      <rect
        x={Math.min(shape.trough[0], shape.trough[2])}
        y={Math.min(shape.trough[1], shape.trough[3])}
        width={Math.abs(shape.trough[2] - shape.trough[0])}
        height={Math.abs(shape.trough[3] - shape.trough[1])}
        className="fill-ring/10 stroke-ring/40"
        strokeDasharray="3 3"
      />
      <polygon
        points={shape.polygon.map(([px, py]) => `${px},${py}`).join(" ")}
        className={shape.inside ? "fill-ring/25 stroke-ring" : "fill-ring/10 stroke-ring/60"}
        strokeWidth={1}
      />
    </svg>,
    document.body,
  );
}

type Side = "top" | "bottom" | "left" | "right";
type Point = [number, number];
type SafeShape = { polygon: Point[]; trough: [number, number, number, number]; inside: boolean };

/** The deepest submenu row whose panel is open; the root trigger is a button, not a menuitem. */
function openSubmenuRow() {
  const rows = document.querySelectorAll('[role^="menuitem"][aria-haspopup][data-popup-open]');
  return rows[rows.length - 1] ?? null;
}

/** The submenu's positioner: Base UI's floating element, and the one carrying `data-side`. */
function panelFor(row: Element) {
  const id = row.getAttribute("aria-controls");
  const popup = id ? document.getElementById(id) : null;
  return popup?.closest("[data-side]") ?? null;
}

function contains(rect: DOMRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function insideRect(x: number, y: number, [x1, y1, x2, y2]: SafeShape["trough"]) {
  return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
}

function insideQuad(x: number, y: number, points: Point[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;
    if (yi >= y !== yj >= y && x <= ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Base UI's constant: the half-pixel the cursor point is widened by.
const BUFFER = 0.5;

/** Base UI's quadrilateral and trough for each side, in the same terms as `safePolygon.js`. */
function safeGeometry(side: Side, x: number, y: number, refRect: DOMRect, rect: DOMRect) {
  const leaveRight = x > rect.right - rect.width / 2;
  const leaveBottom = y > rect.bottom - rect.height / 2;
  const wider = rect.width > refRect.width;
  const taller = rect.height > refRect.height;
  const left = (wider ? refRect : rect).left;
  const right = (wider ? refRect : rect).right;
  const top = (taller ? refRect : rect).top;
  const bottom = (taller ? refRect : rect).bottom;

  if (side === "top" || side === "bottom") {
    const offset = wider ? BUFFER / 2 : BUFFER * 4;
    const x1 = wider ? x + offset : leaveRight ? x + offset : x - offset;
    const x2 = wider ? x - offset : leaveRight ? x + offset : x - offset;
    if (side === "top") {
      const cy = y + BUFFER + 1;
      const yLeft = leaveRight ? rect.bottom - BUFFER : wider ? rect.bottom - BUFFER : rect.top;
      const yRight = leaveRight ? (wider ? rect.bottom - BUFFER : rect.top) : rect.bottom - BUFFER;
      return {
        polygon: [[x1, cy], [x2, cy], [rect.left, yLeft], [rect.right, yRight]] as Point[],
        trough: [left, refRect.top + 1, right, rect.bottom - 1] as SafeShape["trough"],
      };
    }
    const cy = y - BUFFER;
    const yLeft = leaveRight ? rect.top + BUFFER : wider ? rect.top + BUFFER : rect.bottom;
    const yRight = leaveRight ? (wider ? rect.top + BUFFER : rect.bottom) : rect.top + BUFFER;
    return {
      polygon: [[x1, cy], [x2, cy], [rect.left, yLeft], [rect.right, yRight]] as Point[],
      trough: [left, rect.top + 1, right, refRect.bottom - 1] as SafeShape["trough"],
    };
  }

  const offset = taller ? BUFFER / 2 : BUFFER * 4;
  const y1 = taller ? y + offset : leaveBottom ? y + offset : y - offset;
  const y2 = taller ? y - offset : leaveBottom ? y + offset : y - offset;
  if (side === "left") {
    const cx = x + BUFFER + 1;
    const xTop = leaveBottom ? rect.right - BUFFER : taller ? rect.right - BUFFER : rect.left;
    const xBottom = leaveBottom ? (taller ? rect.right - BUFFER : rect.left) : rect.right - BUFFER;
    return {
      polygon: [[xTop, rect.top], [xBottom, rect.bottom], [cx, y1], [cx, y2]] as Point[],
      trough: [rect.right - 1, bottom, refRect.left + 1, top] as SafeShape["trough"],
    };
  }
  const cx = x - BUFFER;
  const xTop = leaveBottom ? rect.left + BUFFER : taller ? rect.left + BUFFER : rect.right;
  const xBottom = leaveBottom ? (taller ? rect.left + BUFFER : rect.right) : rect.left + BUFFER;
  return {
    polygon: [[cx, y1], [cx, y2], [xTop, rect.top], [xBottom, rect.bottom]] as Point[],
    trough: [refRect.right - 1, bottom, rect.left + 1, top] as SafeShape["trough"],
  };
}
