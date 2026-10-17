"use client";

import { useEffect } from "react";
import "./reveal.css";

/**
 * Holds the landing page's entrance — the title's letters and every `.landing-reveal` — until
 * the page has hydrated and the window has loaded, then starts it all on the next frame.
 *
 * Started on first paint, the entrance overlapped hydration and the hero photo's download,
 * decode, and first paint, and the letters stuttered. Waiting leaves the animation the main
 * thread and raster work to itself.
 */
export function RevealGate() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const start = () => {
      frame = requestAnimationFrame(() => {
        root.dataset.landingReady = "";
      });
    };

    // `load` may already have fired before hydration.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      window.removeEventListener("load", start);
      cancelAnimationFrame(frame);
      delete root.dataset.landingReady;
    };
  }, []);

  return null;
}
