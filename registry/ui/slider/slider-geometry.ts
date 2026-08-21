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
  firstFieldPercent = 0,
  lastFieldPercent = 0,
): number {
  const progress = isRtl ? 100 - position : position;
  if (!keepStartCap && fillCapRadiusPx === 0) {
    const firstField = Math.min(Math.max(firstFieldPercent, 0), 100);
    const lastField = Math.min(Math.max(lastFieldPercent, 0), 100);
    if (firstField === 0 && lastField === 0) {
      return position <= 0 || position >= 100
        ? 0
        : thumbWidthPx * (0.5 - progress / 100);
    }
    if (progress <= 0 || progress >= 100) return 0;
    if (firstField > 0 && progress < firstField) {
      return thumbTravelInsetPx * progress * (1 / firstField - 2 / 100);
    }
    if (lastField > 0 && progress > 100 - lastField) {
      const amount = (progress - (100 - lastField)) / lastField;
      return (
        thumbTravelInsetPx *
        (1 - (2 * (100 - lastField)) / 100) *
        (1 - amount)
      );
    }
    return thumbTravelInsetPx * (1 - 2 * progress / 100);
  }
  if (progress >= 100) return 0;
  if (progress <= 0) {
    return keepStartCap ? thumbTravelInsetPx + fillCapRadiusPx : 0;
  }
  return thumbTravelInsetPx * (1 - 2 * progress / 100) + fillCapRadiusPx;
}

/**
 * Return the inset for one end of the fill between two thumbs.
 *
 * The boundary inset is included at every position, so the fill reaches the rail edge at
 * an endpoint through the same continuous calculation used while the thumb is moving. The
 * first and last fields can be wider in pixels than the interior fields so the edge gap is
 * absorbed by the adjacent tick interval rather than appearing as a snap.
 */
export function getSliderRangeFillInset(
  position: number,
  start: boolean,
  controlWidth: number,
  thumbTravelInsetPx: number,
  boundaryInsetPx = 0,
  firstFieldPercent = 100,
  lastFieldPercent = firstFieldPercent,
): number {
  const width = Math.max(controlWidth, 0);
  const progress = Math.min(Math.max(position, 0), 100);
  const trackWidth = Math.max(width - thumbTravelInsetPx * 2, 0);
  const boundaryAt = (percent: number) => {
    const center = (percent / 100) * trackWidth + thumbTravelInsetPx;
    return start
      ? Math.max(0, center - boundaryInsetPx)
      : Math.min(width, center + boundaryInsetPx);
  };

  if (start) {
    const field = Math.min(Math.max(firstFieldPercent, 0), 100);
    if (field > 0 && progress < field) {
      return (progress / field) * boundaryAt(field);
    }
    return boundaryAt(progress);
  }

  const field = Math.min(Math.max(lastFieldPercent, 0), 100);
  const fieldStart = 100 - field;
  if (field > 0 && progress > fieldStart) {
    const amount = (progress - fieldStart) / field;
    return boundaryAt(fieldStart) + amount * (width - boundaryAt(fieldStart));
  }
  return boundaryAt(progress);
}
