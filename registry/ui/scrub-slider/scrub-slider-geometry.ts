/**
 * The scrub slider's maths, kept free of React so it can be tested on its own.
 *
 * The ruler is measured in ticks: tick `i` is the value `min + i * step`, and the view's
 * `offset` is the (fractional) tick at the ruler's inline-start edge. A tick's position is
 * `(i - offset) * spacing` pixels from that edge.
 */

/** How far the lens reaches either side of the indicator, in ticks. */
export const LENS_RADIUS_TICKS = 5;

/** The edge zone that scrolls the ruler: 40px, or 15% of a narrow ruler. */
const EDGE_ZONE_PX = 40;
const EDGE_ZONE_SHARE = 0.15;

/** Ticks per second at the very edge, before the dwell ramp. */
const EDGE_SPEED = 30;
/** The edge speeds up the longer the pointer stays in it: ×1.5 per second, up to ×8. */
const EDGE_RAMP_PER_SECOND = 1.5;
const EDGE_RAMP_MAX = 8;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Decimal precision, including numbers printed in exponent notation. */
export function decimalPlaces(value: number): number {
  const [coefficient, exponent = "0"] = String(value).split("e");
  return Math.max(0, (coefficient!.split(".")[1] ?? "").length - Number(exponent));
}

export interface ScrubScale {
  min: number;
  max: number;
  step: number;
}

/** The last tick: the highest step that still fits within `max`. */
export function lastTick({ min, max, step }: ScrubScale): number {
  return Math.max(0, Math.floor((max - min) / step + 1e-9));
}

/** The decimal places the scale's values can have: those of `min` and `step`. */
export function stepPrecision({ min, step }: ScrubScale): number {
  return Math.max(decimalPlaces(step), decimalPlaces(min));
}

/** The value a tick stands for, rounded to the precision of `min` and `step`. */
export function valueAtTick(tick: number, scale: ScrubScale): number {
  const precision = stepPrecision(scale);
  const index = clamp(Math.round(tick), 0, lastTick(scale));
  return Number((scale.min + index * scale.step).toFixed(precision));
}

/** The (fractional) tick a value falls on. */
export function tickOfValue(value: number, { min, step }: ScrubScale): number {
  return (value - min) / step;
}

/** Clamps a value to the range and snaps it to the step grid that starts at `min`. */
export function snapValue(value: number, scale: ScrubScale): number {
  if (!Number.isFinite(value)) return scale.min;
  return valueAtTick(tickOfValue(clamp(value, scale.min, scale.max), scale), scale);
}

/**
 * A tick's height class on the ruler: 2 on every tenth value step, 1 on every fifth, 0
 * otherwise. Counted from zero rather than from `min`, so a ruler starting at 3 still puts
 * its tall ticks on 10, 20, 30.
 */
export function tickLevel(tick: number, { min, step }: ScrubScale): 0 | 1 | 2 {
  const n = Math.round(min / step + tick);
  if (n % 10 === 0) return 2;
  if (n % 5 === 0) return 1;
  return 0;
}

/**
 * How much the lens lifts a tick, 0–1, by its distance in pixels from the indicator: a
 * raised cosine, so the ticks rise smoothly toward the centre and settle without a corner
 * at the lens's edge.
 */
export function lensAt(distancePx: number, spacingPx: number): number {
  const reach = LENS_RADIUS_TICKS * spacingPx;
  const t = Math.abs(distancePx) / reach;
  return t >= 1 ? 0 : 0.5 * (1 + Math.cos(Math.PI * t));
}

export function edgeZone(widthPx: number): number {
  return Math.min(EDGE_ZONE_PX, widthPx * EDGE_ZONE_SHARE);
}

/**
 * How fast the ruler scrolls with the pointer at `headPx`, in ticks per second: negative
 * toward the start, positive toward the end, zero outside the edge zones. The speed rises
 * with the square of how deep into the zone the pointer is, so its inner edge is a gentle
 * creep, and with how long it has dwelt there.
 */
export function edgeSpeed(headPx: number, widthPx: number, dwellSeconds: number): number {
  const zone = edgeZone(widthPx);
  if (zone <= 0) return 0;
  const startDepth = clamp((zone - headPx) / zone, 0, 1);
  const endDepth = clamp((headPx - (widthPx - zone)) / zone, 0, 1);
  const depth = endDepth - startDepth;
  if (depth === 0) return 0;
  const ramp = Math.min(1 + dwellSeconds * EDGE_RAMP_PER_SECOND, EDGE_RAMP_MAX);
  return Math.sign(depth) * depth * depth * EDGE_SPEED * ramp;
}

/**
 * The offset range that keeps `tick` on screen and clear of both edge zones, so a value
 * changed from the keyboard or from outside stays where it can be read.
 */
export function offsetKeepingInView(
  offset: number,
  tick: number,
  widthPx: number,
  spacingPx: number,
): number {
  const zone = edgeZone(widthPx);
  const lowest = tick - (widthPx - zone) / spacingPx;
  const highest = tick - zone / spacingPx;
  return lowest > highest ? tick - widthPx / spacingPx / 2 : clamp(offset, lowest, highest);
}

/**
 * How far the ruler may be scrolled: until an end of the scale sits one edge zone in from
 * its edge, so the blank space past it shows it is the end. A scale shorter than the ruler
 * is centred in it.
 */
export function offsetBounds(
  widthPx: number,
  spacingPx: number,
  scale: ScrubScale,
): [number, number] {
  const zone = edgeZone(widthPx);
  const lowest = -zone / spacingPx;
  const highest = lastTick(scale) - (widthPx - zone) / spacingPx;
  if (lowest <= highest) return [lowest, highest];
  const centred = (lastTick(scale) - widthPx / spacingPx) / 2;
  return [centred, centred];
}

export function clampOffset(
  offset: number,
  widthPx: number,
  spacingPx: number,
  scale: ScrubScale,
): number {
  const [lowest, highest] = offsetBounds(widthPx, spacingPx, scale);
  return clamp(offset, lowest, highest);
}

/**
 * How far the edge scroll may take the ruler with the pointer at `pointerPx`: until the
 * value under the pointer reaches `min` or `max` and that end has also scrolled to its
 * padded place, whichever is further. The value itself stops at the bound; the indicator
 * then holds on the end tick while the ruler finishes settling.
 */
export function clampOffsetAtPointer(
  offset: number,
  pointerPx: number,
  widthPx: number,
  spacingPx: number,
  scale: ScrubScale,
): number {
  const zone = edgeZone(widthPx);
  const lowest = -Math.max(pointerPx, zone) / spacingPx;
  const highest = lastTick(scale) - Math.min(pointerPx, widthPx - zone) / spacingPx;
  return lowest <= highest ? clamp(offset, lowest, highest) : offset;
}
