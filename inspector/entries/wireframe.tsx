"use client";

import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";

/* Wireframe pieces shared by the app-shell demos: outlines, with light bars for text. */

/**
 * The mobile window both app-shell demos use: a phone's 390x844 viewport, at full size when
 * the canvas has room and scaled to fit when it doesn't. Its parent must be a size container.
 */
export const PHONE_FRAME = "aspect-[390/844] h-[min(100cqh,calc(100cqw*844/390),52.75rem)]";
// On a phone-width screen the phone UI is laid out at this fraction of the frame and scaled up
// to fill it, so a phone squeezed onto a small screen keeps readable controls. On a desktop it
// is a true 390x844 window, shrinking only when the canvas is smaller.
const PHONE_LAYOUT = 0.7;
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
/** The sidebar's own mobile breakpoint. */
const PHONE_SCREEN = "(max-width: 767px)";

function subscribePhoneScreen(onChange: () => void) {
  const query = window.matchMedia?.(PHONE_SCREEN);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}
const isPhoneScreen = () => window.matchMedia?.(PHONE_SCREEN).matches === true;

/** Shared desktop window, between the former wide and tall previews, fitted to the canvas. */
export const DESKTOP_FRAME = "aspect-[3/2] w-[min(100cqw,calc(100cqh*3/2),60rem)]";

// A modest reduction at the normal preview size; smaller canvases still fit the whole UI.
const DESKTOP_SCALE = 0.9;
const DESKTOP_WIDTH = 960 / DESKTOP_SCALE;
const DESKTOP_HEIGHT = 640 / DESKTOP_SCALE;

/**
 * The app-shell window, laid out at a fixed size and scaled to fit the canvas: the desktop's
 * 960x640 (slightly reduced), or a phone's 390x844 (enlarged on a phone-width screen; see
 * `PHONE_LAYOUT`). Its UI shrinks with the window rather than keeping full-size controls in a
 * smaller one. `children` fills the window.
 */
export function DesktopPreview({ mobile, children }: { mobile: boolean; children: ReactNode }) {
  const phoneScreen = useSyncExternalStore(subscribePhoneScreen, isPhoneScreen, () => false);
  const layout = mobile && phoneScreen ? PHONE_LAYOUT : 1;
  const base = mobile ? PHONE_WIDTH : 960;
  const rest = mobile ? 1 / layout : DESKTOP_SCALE;
  const [scale, setScale] = useState(rest);
  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const update = (width: number) => {
      if (width > 0) setScale(Math.min(1, width / base) * rest);
    };
    update(node.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [base, rest]);

  return (
    <div ref={measure} className={`relative shrink-0 ${mobile ? PHONE_FRAME : DESKTOP_FRAME}`}>
      <div
        data-slot={mobile ? "mobile-demo-viewport" : "desktop-demo-viewport"}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: mobile ? PHONE_WIDTH * layout : DESKTOP_WIDTH,
          height: mobile ? PHONE_HEIGHT * layout : DESKTOP_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
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
