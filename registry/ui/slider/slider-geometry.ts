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
): number {
  const progress = isRtl ? 100 - position : position;
  return position <= 0 || position >= 100
    ? 0
    : thumbWidthPx * (0.5 - progress / 100);
}
