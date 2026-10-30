import type { ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

type Paint = { fill?: string; fillOpacity?: number; stroke?: string; strokeOpacity?: number };

/**
 * The drawer's row icons: each a small drawing of the page's component itself — a switch's
 * track and knob, a sheet's panel at the right of a window — rather than a metaphor from a
 * general set. 16px, 1.25px strokes, two-tone: surfaces at 30%, secondary lines at 40%.
 */

/** A surface: filled faintly, outline kept. */
const FILLED: Paint = { fill: "currentColor", fillOpacity: 0.3 };
/** A surface with no outline. */
const TONE: Paint = { fill: "currentColor", fillOpacity: 0.3, stroke: "none" };
/** A solid mark: a knob, a dot, a filled button. */
const SOLID: Paint = { fill: "currentColor", stroke: "none" };
/** A secondary line: placeholder text, a track, a muted row. */
const FAINT: Paint = { strokeOpacity: 0.4 };

const ICONS: Record<string, ReactNode> = {
  // The overview, at "/".
  "": (
    <>
      <path d="M2.5 7 8 2.5 13.5 7v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1Z" {...FILLED} />
      <path d="M6.5 14v-3.5h3V14" />
    </>
  ),
  // Reference
  installation: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M4.5 6.5 6.5 8l-2 1.5M8.5 10h3" />
    </>
  ),
  components: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1.25" {...FILLED} />
      <rect x="9" y="2" width="5" height="5" rx="1.25" />
      <rect x="2" y="9" width="5" height="5" rx="1.25" />
      <rect x="9" y="9" width="5" height="5" rx="1.25" />
    </>
  ),
  design: (
    <>
      <circle cx="5.5" cy="6" r="3.5" />
      <circle cx="10.5" cy="6" r="3.5" {...FILLED} />
      <circle cx="8" cy="10.5" r="3.5" />
    </>
  ),
  engineering: (
    <>
      <path d="M5 4.5 1.5 8 5 11.5M11 4.5 14.5 8 11 11.5" />
      <path d="M9.25 3 6.75 13" {...FAINT} />
    </>
  ),
  // A skill is an add-on capability for an agent: a puzzle piece.
  "agent-skill": (
    <path d="M2.5 4.5h3a1.5 1.5 0 1 1 3 0h3v3a1.5 1.5 0 1 1 0 3v3h-9Z" {...FILLED} />
  ),

  // Actions
  button: (
    <>
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FILLED} />
      <path d="M5.5 8h5" />
    </>
  ),
  "button-group": (
    <>
      <path d="M6 4.5H3.5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2H6Z" {...TONE} />
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" />
      <path d="M6 4.5v7M10 4.5v7" />
    </>
  ),
  "action-button": (
    <>
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FILLED} />
      <path d="M6.25 8A1.75 1.75 0 1 1 4.5 6.25" />
      <path d="M8.5 8h3.5" />
    </>
  ),
  "copy-button": (
    <>
      <rect x="5.5" y="5.5" width="9" height="9" rx="2" {...FILLED} />
      <path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
    </>
  ),
  "delete-button": (
    <>
      <path d="M4 4.5 4.75 13.5h6.5L12 4.5" {...FILLED} />
      <path d="M2.5 4.5h11M6.5 4.5V3h3v1.5" />
    </>
  ),
  morph: (
    <>
      <circle cx="5" cy="8" r="3.5" {...FAINT} />
      <rect x="8.5" y="4.5" width="6" height="7" rx="1.5" {...FILLED} />
    </>
  ),
  toggle: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} />
      <path d="M6 5h2.25a1.5 1.5 0 0 1 0 3H6Zm0 3h2.75a1.5 1.5 0 0 1 0 3H6Z" />
    </>
  ),
  "action-toggle": (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} />
      <path d="M10.5 8A2.5 2.5 0 1 1 8 5.5" />
    </>
  ),

  // Fields and selection
  input: (
    <>
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" />
      <path d="M4.5 6.5v3" />
      <path d="M7 8h4.5" {...FAINT} />
    </>
  ),
  textarea: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M4 5.5h8M4 8h5" />
      <path d="M12.5 10.5 10.5 12.5" {...FAINT} />
    </>
  ),
  checkbox: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} />
      <path d="M5.5 8.25 7.25 10l3.25-3.75" />
    </>
  ),
  radio: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.25" {...SOLID} />
    </>
  ),
  switch: (
    <>
      <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" {...FILLED} />
      <circle cx="11" cy="8" r="2" {...SOLID} />
    </>
  ),
  slider: (
    <>
      <path d="M1.5 8h13" {...FAINT} />
      <path d="M1.5 8H8" />
      <circle cx="9.5" cy="8" r="2.25" {...SOLID} />
    </>
  ),
  select: (
    <>
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" />
      <path d="M4 8h4" />
      <path d="M10.75 7 12 5.75 13.25 7M10.75 9 12 10.25 13.25 9" />
    </>
  ),
  "select-aligned": (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
      <rect x="3" y="6.5" width="10" height="3" rx="1" {...TONE} />
      <path d="M4 8l.75.75 1.5-1.5" />
      <path d="M7.5 4h4.5M7.5 12h4.5" {...FAINT} />
      <path d="M7.5 8h4.5" />
    </>
  ),
  "select-search": (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
      <circle cx="4.75" cy="4.75" r="1.25" />
      <path d="m5.75 5.75.75.75M1.5 8h13" />
      <path d="M8 4.75h4M4 12.5h5" {...FAINT} />
      <path d="M4 10.5h8" />
    </>
  ),
  "date-picker": (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5" />
      <rect x="8.75" y="8.75" width="3" height="3" rx="0.75" {...SOLID} />
    </>
  ),
  "command-palette": (
    <>
      <rect x="1.5" y="2" width="13" height="12" rx="2" />
      <path d="M1.5 5.5h13" />
      <path d="M3.5 3.75h4M4 11.75h6" {...FAINT} />
      <rect x="3" y="7" width="10" height="2.5" rx="1" {...TONE} />
    </>
  ),

  // Feedback and status
  alert: (
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="2" />
      <circle cx="5" cy="8" r="1.5" {...SOLID} />
      <path d="M8 6.75h3.5M8 9.25h2.5" />
    </>
  ),
  badge: (
    <>
      <rect x="1.5" y="5" width="13" height="6" rx="3" {...FILLED} />
      <circle cx="4.75" cy="8" r="1" {...SOLID} />
      <path d="M7 8h4.5" />
    </>
  ),
  progress: (
    <>
      <rect x="1.5" y="6.5" width="13" height="3" rx="1.5" {...TONE} />
      <rect x="1.5" y="6.5" width="8" height="3" rx="1.5" {...SOLID} />
    </>
  ),
  skeleton: (
    <>
      <circle cx="4.5" cy="5" r="2.5" {...TONE} />
      <rect x="8.5" y="3" width="6" height="1.75" rx="0.875" {...TONE} />
      <rect x="8.5" y="5.75" width="4" height="1.75" rx="0.875" {...TONE} />
      <rect x="1.5" y="9.5" width="13" height="1.75" rx="0.875" {...TONE} />
      <rect x="1.5" y="12.25" width="9" height="1.75" rx="0.875" {...TONE} />
    </>
  ),
  empty: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" strokeDasharray="2 2" />
      <path d="M8 6.5v3M6.5 8h3" {...FAINT} />
    </>
  ),
  // A ring of bars fading behind the lit one, as the loader's 12 are drawn (8 here, for 16px).
  "classic-loader": (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <path
          key={index}
          d="M8 1.75v2.75"
          transform={`rotate(${index * 45} 8 8)`}
          strokeOpacity={[1, 0.25, 0.25, 0.25, 0.3, 0.45, 0.65, 0.85][index]}
        />
      ))}
    </>
  ),
  // A six-dot braille cell, one of the ASCII loader's frames (⠹).
  "ascii-loader": (
    <>
      {[
        [5.5, 3, 1], [10.5, 3, 1],
        [5.5, 8, 0.3], [10.5, 8, 1],
        [5.5, 13, 0.3], [10.5, 13, 1],
      ].map(([cx, cy, opacity]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" {...SOLID} fillOpacity={opacity} />
      ))}
    </>
  ),
  // The scan variant's 4×4 grid: one column lit, the ones it passed fading behind it.
  "matrix-loader": (
    <>
      {[2.75, 6.25, 9.75, 13.25].flatMap((cy) =>
        [2.75, 6.25, 9.75, 13.25].map((cx, column) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="1.1"
            {...SOLID}
            fillOpacity={[0.35, 0.6, 1, 0.15][column]}
          />
        )),
      )}
    </>
  ),

  // Text
  "text-shimmer": (
    <>
      <path d="M1.5 6h13M1.5 10h9" {...FAINT} />
      <path d="M6 6h4M3.5 10h3" />
    </>
  ),
  "scramble-text": (
    <>
      <path d="M1.5 6h3M10 6h4.5M5 10h4" />
      <path d="M6.5 6H8M1.5 10H3M11 10h1.5" {...FAINT} />
    </>
  ),
  "blur-text": (
    <>
      <path d="M1.5 4.5h9" />
      <path d="M1.5 8h9" strokeOpacity={0.5} strokeWidth={2} />
      <path d="M1.5 11.5h9" strokeOpacity={0.2} strokeWidth={3} />
    </>
  ),

  // Layout and navigation
  separator: (
    <>
      <path d="M1.5 8h13" />
      <path d="M4 4.5h8M4 11.5h8" {...FAINT} />
    </>
  ),
  "scroll-area": (
    <>
      <rect x="1.5" y="1.5" width="10" height="13" rx="2" />
      <path d="M4 5h5M4 8h5M4 11h3" {...FAINT} />
      <path d="M14 2v12" {...FAINT} />
      <path d="M14 3.5v4" />
    </>
  ),
  collapsible: (
    <>
      <path d="M2 3.5 4 5.5 6 3.5M8 4.5h6" />
      <path d="M4 9h10M4 12h7" {...FAINT} />
    </>
  ),
  tabs: (
    <>
      <rect x="1.5" y="4" width="13" height="8" rx="2" />
      <rect x="3" y="5.5" width="5" height="5" rx="1" {...TONE} />
      <path d="M10 8h2.5" {...FAINT} />
    </>
  ),
  breadcrumb: (
    <>
      <path d="M1.5 8h2M7 8h2" {...FAINT} />
      <path d="m4.75 6.5 1 1.5-1 1.5M10.25 6.5l1 1.5-1 1.5M12.75 8h1.75" />
    </>
  ),
  table: (
    <>
      <path d="M1.5 6V4.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V6Z" {...TONE} />
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M1.5 6h13M1.5 9.75h13M6 6v7.5" />
    </>
  ),
  "data-table": (
    <>
      <path d="M1.5 6V4.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V6Z" {...TONE} />
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M1.5 6h13M1.5 9.75h13M5.5 6v7.5" />
      <rect x="2.75" y="7.25" width="1.5" height="1.5" rx="0.4" {...SOLID} />
      <rect x="2.75" y="11" width="1.5" height="1.5" rx="0.4" strokeWidth={1} />
    </>
  ),
  "table-of-contents": (
    <>
      <path d="M2 3.5h9M4.5 11h6" {...FAINT} />
      <path d="M4.5 7.25h8" />
    </>
  ),
  // The rail's ruler: lines of different reach, the current one strong.
  "table-of-contents-lines": (
    <>
      <path d="M2 3h5M2 6h8M2 12h6" {...FAINT} />
      <path d="M2 9h11" />
    </>
  ),
  sidebar: (
    <>
      <path d="M6.5 2.5h-3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Z" {...TONE} />
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M6.5 2.5v11" />
    </>
  ),
  "sidebar-layout": (
    <>
      <path d="M6.5 2.5h-3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Z" {...TONE} />
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M6.5 2.5v11M6.5 6h8" />
      <rect x="8" y="7.5" width="5" height="4.5" rx="1" {...TONE} />
    </>
  ),

  // Overlays and menus
  tooltip: (
    <>
      <path
        d="M3.5 2.5h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9.5L8 12.5l-1.5-2h-3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"
        {...FILLED}
      />
      <path d="M5 6.5h6" />
    </>
  ),
  popover: (
    <>
      <rect x="1.5" y="1.5" width="13" height="8" rx="2" {...FILLED} />
      <rect x="5" y="11.5" width="6" height="3" rx="1.5" />
    </>
  ),
  "hover-card": (
    <>
      <rect x="1.5" y="1.5" width="13" height="9" rx="2" {...FILLED} />
      <circle cx="4.75" cy="4.75" r="1.5" {...SOLID} />
      <path d="M7.5 4.75h5" />
      <path d="M3.5 8h8" {...FAINT} />
      <path d="M5 13.5h6" />
    </>
  ),
  "dropdown-menu": (
    <>
      <rect x="1.5" y="1.5" width="7" height="3.5" rx="1.5" />
      <rect x="1.5" y="6.5" width="13" height="8" rx="2" {...FILLED} />
      <path d="M4 9h7" />
      <path d="M4 12h5" {...FAINT} />
    </>
  ),
  "selection-toolbar": (
    <>
      <rect x="3" y="1.5" width="10" height="4" rx="1.5" {...FILLED} />
      <path d="M6.5 2.5v2M9.5 2.5v2" />
      <path d="M1.5 10h3M11.5 10h3M1.5 13.5h8" {...FAINT} />
      <rect x="4.5" y="8.5" width="7" height="3" rx="0.5" {...TONE} />
      <path d="M4.5 10h7" />
    </>
  ),
  sheet: (
    <>
      <path d="M9.5 2.5h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3Z" {...TONE} />
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M9.5 2.5v11" />
    </>
  ),
  dialog: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FAINT} />
      <rect x="4" y="5" width="8" height="6" rx="1.5" {...FILLED} />
    </>
  ),
  "alert-dialog": (
    <>
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="M4.5 6h5" />
      <rect x="5.25" y="9" width="3" height="2" rx="0.75" strokeWidth={1} />
      <rect x="9" y="9" width="3" height="2" rx="0.75" {...SOLID} />
    </>
  ),
};

/** A page with no drawing of its own. */
const PAGE = (
  <>
    <path d="M4 1.5h5l3.5 3.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 13V3A1.5 1.5 0 0 1 4 1.5Z" />
    <path d="M5.5 8h5M5.5 11h3" {...FAINT} />
  </>
);

const keyOf = (href: string) => href.split("/").at(-1) ?? "";

/** Whether a page has a drawing of its own, rather than the plain page. */
export function hasNavIcon(href: string) {
  return keyOf(href) in ICONS;
}

/** The icon for a page, keyed by the last segment of its address: in its row, and by its title. */
export function NavIcon({ href, className = "size-4" }: { href: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {ICONS[keyOf(href)] ?? PAGE}
    </svg>
  );
}
