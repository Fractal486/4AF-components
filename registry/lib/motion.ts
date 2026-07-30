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
} as const;

/** Durations in seconds (Motion's unit), identical to the `--duration-*` properties. */
export const duration = {
  /** Hover, press, focus ring. Fast enough to feel like a direct response. */
  fast: 0.15,
  /** Default: dropdowns, tooltips, small enter/exit. */
  base: 0.2,
  /** Larger surfaces travelling further: dialogs, popovers. */
  slow: 0.3,
} as const;

/**
 * Spring presets. Prefer these over duration-based tweens for anything the user
 * can grab, fling or interrupt — a spring absorbs a new target mid-flight, a tween
 * has to restart. `visualDuration` sets the perceived settle time, so these stay
 * legible next to the duration tokens above.
 */
/**
 * How far a control shrinks when pressed.
 *
 * One constant, because Button and Toggle both use it and a control that gives
 * slightly differently to its neighbour is the kind of thing you feel without being
 * able to name.
 */
export const PRESS_SCALE = 0.95;

export const spring = {
  /**
   * Press feedback on buttons and other tappable surfaces.
   *
   * Stated as stiffness/damping/mass rather than a visual duration because what
   * matters here is the *physics*, not the timing: it accelerates into the press and
   * settles with a hint of overshoot on release. No cubic-bezier reproduces that. An
   * expo ease covers ~85% of its travel in the first fifth of the duration, so the
   * button snaps to depth on frame one and then crawls — and lengthening the duration
   * only stretches a tail nobody can see.
   */
  press: { type: "spring", stiffness: 500, damping: 30, mass: 0.6 },
  /**
   * No overshoot at all. The right default whenever what's animating is opacity or
   * blur: an overshoot on those has nowhere to go — you can't be less than
   * invisible — so it doesn't read as bounce, it reads as a stall at the end.
   *
   * Short, because this preset is for things that swap in place rather than travel.
   * A 0.3s icon swap doesn't read as smooth, it reads as laggy: nothing moved far
   * enough to earn that much time, and the delay lands between the click and the
   * confirmation, which is exactly where it gets noticed.
   */
  clean: { type: "spring", visualDuration: 0.18, bounce: 0 },
  /** Snappy, barely any overshoot. Toggles, checkboxes, small state flips. */
  snappy: { type: "spring", visualDuration: 0.2, bounce: 0.05 },
  /** The default surface spring. Dialogs, popovers, menus. */
  smooth: { type: "spring", visualDuration: 0.3, bounce: 0.1 },
} as const;
