/**
 * Read the control's layout width rather than its transformed visual bounds.
 * Popover and dialog entry animations can scale the control while it mounts;
 * offsetWidth remains stable through that animation.
 */
export function getSliderControlWidth(control: HTMLElement): number {
  return control.offsetWidth;
}

export function getSliderFillOffset(
  position: number,
  isRtl: boolean,
  thumbWidthPx: number,
  fillCapRadiusPx = 0,
  thumbTravelInsetPx = thumbWidthPx / 2,
  keepStartCap = false,
): number {
  const progress = isRtl ? 100 - position : position;
  if (!keepStartCap && fillCapRadiusPx === 0) {
    return position <= 0 || position >= 100
      ? 0
      : thumbWidthPx * (0.5 - progress / 100);
  }
  if (progress >= 100) return 0;
  if (progress <= 0) {
    return keepStartCap ? thumbTravelInsetPx + fillCapRadiusPx : 0;
  }
  return thumbTravelInsetPx * (1 - 2 * progress / 100) + fillCapRadiusPx;
}
