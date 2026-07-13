"use client";

import { useEffect, useState } from "react";
import { cn } from "@/registry/lib/cn";

type Theme = "light" | "dark";
type Motion = "normal" | "slow" | "reduced";

const MOTIONS: readonly Motion[] = ["normal", "slow", "reduced"];

/**
 * Theme and time. Both are written straight onto <html> as data attributes — the
 * same attributes the pre-paint script sets — so there's no provider, no context,
 * and no re-render of the tree just to change a colour.
 *
 * "slow" is the one that earns its keep: at 4x, a lazy ease and a considered one
 * stop looking alike, and you can see whether an exit animation is actually being
 * interrupted or just restarting.
 */
export function Toolbar() {
  // Null until mounted: the real values live on the DOM, written before React
  // ever ran, so the server has no way to know them.
  const [theme, setTheme] = useState<Theme | null>(null);
  const [motion, setMotion] = useState<Motion | null>(null);

  useEffect(() => {
    const el = document.documentElement;
    setTheme(el.dataset.theme === "dark" ? "dark" : "light");
    setMotion((el.dataset.motion as Motion) ?? "normal");
  }, []);

  function updateTheme(next: Theme) {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("4af-theme", next);
    setTheme(next);
  }

  function updateMotion(next: Motion) {
    document.documentElement.dataset.motion = next;
    localStorage.setItem("4af-motion", next);
    setMotion(next);
  }

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="Motion"
        className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
      >
        {MOTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => updateMotion(m)}
            aria-pressed={motion === m}
            /* rounded-md (7px) inside rounded-lg (10px) with 2px of padding —
               concentric, so the inner corners sit parallel to the outer ones. */
            className={cn(
              "rounded-md px-2 py-1 font-mono text-2xs uppercase",
              "transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-out",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              motion === m
                ? "bg-surface text-foreground shadow-border"
                : "text-subtle-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => updateTheme(theme === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className={cn(
          "grid size-8 place-items-center rounded-lg text-muted-foreground",
          "transition-[color,background-color] duration-(--duration-fast) ease-out",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="size-4"
          aria-hidden="true"
          /* One shape for both states: the mask circle slides in from the corner
             to bite a crescent out of the sun. Transform-only, so it composites
             on the GPU and never touches layout. */
        >
          <mask id="moon-mask">
            <rect x="0" y="0" width="16" height="16" fill="white" />
            <circle
              cx="16"
              cy="0"
              r="6"
              fill="black"
              className="origin-center transition-[translate] duration-(--duration-slow) ease-out [translate:0_0] dark:[translate:-6px_5px]"
            />
          </mask>
          <circle
            cx="8"
            cy="8"
            r="5.5"
            fill="currentColor"
            mask="url(#moon-mask)"
            className="origin-center transition-[scale] duration-(--duration-slow) ease-out [scale:1] dark:[scale:0.85]"
          />
          <g
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="origin-center transition-[opacity,scale,rotate] duration-(--duration-slow) ease-out dark:rotate-45 dark:scale-50 dark:opacity-0"
          >
            <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05" />
          </g>
        </svg>
      </button>
    </div>
  );
}
