/** Clamp a value to an already-normalized inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Read a computed CSS length; empty and nonnumeric values contribute no pixels. */
export const pixels = (value: string) => Number.parseFloat(value) || 0;
