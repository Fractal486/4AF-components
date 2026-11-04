"use client";

import { useCallback, useState, type ReactNode } from "react";

/* Wireframe pieces shared by the app-shell demos: outlines, with light bars for text. */

/**
 * The mobile window both app-shell demos use: a phone's 390x844 viewport, at full size when
 * the canvas has room and scaled to fit when it doesn't. Its parent must be a size container.
 */
export const PHONE_FRAME = "aspect-[390/844] h-[min(100cqh,calc(100cqw*844/390),52.75rem)]";

/** Shared desktop window, between the former wide and tall previews, fitted to the canvas. */
export const DESKTOP_FRAME = "aspect-[3/2] w-[min(100cqw,calc(100cqh*3/2),60rem)]";

// A modest reduction at the normal preview size; smaller canvases still fit the whole UI.
const DESKTOP_SCALE = 0.9;
const DESKTOP_WIDTH = 960 / DESKTOP_SCALE;
const DESKTOP_HEIGHT = 640 / DESKTOP_SCALE;

/** Scale the desktop UI down slightly without changing the preview window's size. */
export function DesktopPreview({ mobile, children }: { mobile: boolean; children: ReactNode }) {
  const [scale, setScale] = useState(DESKTOP_SCALE);
  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const update = (width: number) => {
      if (width > 0) setScale(Math.min(1, width / 960) * DESKTOP_SCALE);
    };
    update(node.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (mobile) return children;

  return (
    <div ref={measure} className={`relative shrink-0 ${DESKTOP_FRAME}`}>
      <div data-slot="desktop-demo-viewport" className="absolute top-0 left-0 origin-top-left" style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** A line of text, drawn as a light bar. */
export function Line({ width }: { width: number }) {
  return <span aria-hidden="true" className="inline-block h-2 shrink-0 rounded-full bg-foreground/10 align-middle" style={{ width }} />;
}

/** A page's outline: a heading, three cards, and a block that takes the remaining height. */
export function WireframePage() {
  return (
    <>
      <Line width={120} />
      <div className="grid shrink-0 grid-cols-3 gap-3">
        {[56, 72, 48].map((width) => (
          <div key={width} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <Line width={width} />
            <Line width={32} />
          </div>
        ))}
      </div>
      <div className="flex min-h-16 flex-1 flex-col gap-2 rounded-lg border border-border p-3">
        <Line width={96} />
        <Line width={160} />
        <Line width={128} />
      </div>
    </>
  );
}
