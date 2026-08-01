export function getSliderFillOffset(
  position: number,
  isRtl: boolean,
  thumbWidthPx: number,
): number {
  const progress = isRtl ? 100 - position : position;
  return position <= 0 || position >= 100
    ? 0
    : thumbWidthPx * (0.5 - progress / 100);
}
