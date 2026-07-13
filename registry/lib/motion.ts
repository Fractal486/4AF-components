/**
 * Motion presets, mirroring the CSS custom properties in `app/globals.css`.
 *
 * CSS handles hover, press and simple enter/exit. These presets are for the cases
 * CSS genuinely can't do: spring physics, gestures, interruptible transitions and
 * layout animation. Keeping both sides in sync from one source of truth is what
 * stops a Motion-driven dialog from feeling different to a CSS-driven popover.
 */

/** Cubic-bezier curves, identical to the `--ease-*` custom properties. */
export const ease = {
  /** Default for anything entering or responding to input. Decelerates into place. */
  out: [0.16, 1, 0.3, 1],
  /** Exits only. Accelerates away — reads as "leaving", not "being pushed". */
  in: [0.7, 0, 0.84, 0],
  /** Movement that starts and ends on screen. */
  inOut: [0.65, 0, 0.35, 1],
} as const;

/** Durations in seconds (Motion's unit), identical to the `--duration-*` properties. */
export const duration = {
  /** Hover, press, focus ring. Fast enough to feel like a direct response. */
  fast: 0.15,
  /** Default: dropdowns, tooltips, small enter/exit. */
  base: 0.2,
  /** Larger surfaces travelling further: dialogs, popovers. */
  slow: 0.3,
  /** Full-height surfaces: sheets, drawers. */
  slower: 0.45,
} as const;

/**
 * Spring presets. Prefer these over duration-based tweens for anything the user
 * can grab, fling or interrupt — a spring absorbs a new target mid-flight, a tween
 * has to restart. `visualDuration` sets the perceived settle time, so these stay
 * legible next to the duration tokens above.
 */
export const spring = {
  /** Snappy, barely any overshoot. Toggles, checkboxes, small state flips. */
  snappy: { type: "spring", visualDuration: 0.2, bounce: 0.05 },
  /** The default surface spring. Dialogs, popovers, menus. */
  smooth: { type: "spring", visualDuration: 0.3, bounce: 0.1 },
  /** Playful overshoot. Use sparingly — on anything large it reads as sloppy. */
  bouncy: { type: "spring", visualDuration: 0.35, bounce: 0.3 },
  /** For dragged surfaces settling after release: sheets, drawers, cards. */
  gentle: { type: "spring", visualDuration: 0.5, bounce: 0.15 },
} as const;
