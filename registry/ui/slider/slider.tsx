"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import {
  getSliderControlWidth,
  getSliderFillOffset,
  getSliderInlineDim,
  getSliderRangeFillInset,
  type SliderSpan,
} from "./slider-geometry";

/**
 * A slider.
 *
 * Behaviour is Base UI's: a real `<input type="range">` carries the pointer drag,
 * keyboard map (arrows, Home/End, PageUp/Down large-step), step snapping, ARIA, form
 * integration and RTL. None of that is hand-rolled.
 *
 * The feel is Motion's. Base UI's thumb is kept but hidden — it's the focus and
 * behaviour target — and a spring-driven thumb and fill are drawn over it. A spring, not
 * a fixed transition, is the point: it's velocity-aware, so the thumb follows a fast drag
 * tightly and still glides smoothly between snapped steps, where a fixed-duration ease
 * would trail the pointer. The thumb also stretches taller while held, so it reads as
 * something grabbed.
 */

// Critically damped glide for the thumb/fill — no overshoot, follows closely.
const SPRING_GLIDE = { stiffness: 700, damping: 50, mass: 0.5 } as const;
// Grab stretch — quick, and no overshoot (bounce 0), so it settles cleanly rather than
// wobbling.
const SPRING_GRAB = { type: "spring", visualDuration: 0.2, bounce: 0 } as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type SliderRange = readonly [number, number];
export type SliderValue = number | readonly number[];

function isSliderRange(value: unknown): value is SliderRange {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function normalizeSliderValue(
  value: SliderValue | readonly number[] | undefined,
  min: number,
  max: number,
): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  return clamp(
    typeof candidate === "number" && Number.isFinite(candidate) ? candidate : min,
    min,
    max,
  );
}

function normalizeSliderRange(
  value: SliderValue | readonly number[] | undefined,
  min: number,
  max: number,
): SliderRange {
  const source = isSliderRange(value)
    ? value
    : typeof value === "number"
      ? ([min, value] as const)
      : ([min, max] as const);
  const first = clamp(
    Number.isFinite(source[0]) ? source[0] : min,
    min,
    max,
  );
  const second = clamp(
    Number.isFinite(source[1]) ? source[1] : max,
    min,
    max,
  );

  return first <= second ? [first, second] : [second, first];
}

type ThumbValues = [number, number];
type ThumbFlags = [boolean, boolean];

export interface SliderProps
  extends Omit<
    ComponentProps<typeof BaseSlider.Root>,
    "className" | "render" | "value" | "defaultValue" | "onValueChange"
  > {
  value?: SliderValue;
  defaultValue?: SliderValue;
  onValueChange?: ((value: number) => void) | ((value: SliderRange) => void);
  className?: string;
  /** Render two independently draggable thumbs with the fill between them. */
  range?: boolean;
  /** A dot at each step. Hidden automatically past 50 steps, where they'd be noise. */
  showTicks?: boolean;
  /** The current value, shown above the track on the right. */
  showValue?: boolean;
  /** Show the live value in a tooltip above the thumb while it is hovered or focused. */
  showValueTooltip?: boolean;
  /** Text shown above the track on the left, opposite the value. */
  label?: ReactNode;
  /**
   * Move the label and the value *inside* the bar, one at each end, instead of above it.
   * The thumb dims as it passes under either, so the text stays readable.
   *
   * `bar` only, and ignored by the other thumbs: `circle` and `knob` ride a rail too thin to
   * hold a line of text, and the knob overhangs its rail rather than being contained by it.
   */
  inlineLabel?: boolean;
  /**
   * The thumb shape. `bar` is the thin vertical handle; `circle` is a round knob centered
   * in a thick, fully-rounded track; `knob` is that same round knob on a thin rail (about
   * half the knob's diameter), so it overhangs — the classic slider look.
   */
  thumb?: "bar" | "circle" | "knob";
  /** Overall scale. `sm` is a more compact rail — useful in dense panels. */
  size?: "sm" | "md";
}

// Every size-dependent value in one place, keyed by shape then size, so the rail height
// and rounding, the thumb, the pixel width the fill/tick maths needs, and the tick inset
// (half that width) never drift out of step. `rail` positions the track within the
// control — `inset-0` fills a thick circle rail; a fixed height centres a thin rail so
// the knob thumb overhangs.
const DIMS = {
  circle: {
    md: { control: "h-7", rail: "inset-0", thumb: "size-5 rounded-full", thumbPx: 20, fillCapRadiusPx: 14, tooltipSideOffset: 8, tickInset: "inset-x-3.5", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-6", rail: "inset-0", thumb: "size-4 rounded-full", thumbPx: 16, fillCapRadiusPx: 12, tooltipSideOffset: 8, tickInset: "inset-x-3", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  knob: {
    md: { control: "h-5", rail: "inset-x-0 top-1/2 h-2.5 -translate-y-1/2", thumb: "size-4 rounded-full", thumbPx: 16, fillCapRadiusPx: 0, tooltipSideOffset: 8, tickInset: "inset-x-2", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-4", rail: "inset-x-0 top-1/2 h-2 -translate-y-1/2", thumb: "size-3 rounded-full", thumbPx: 12, fillCapRadiusPx: 0, tooltipSideOffset: 8, tickInset: "inset-x-1.5", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  bar: {
    md: { control: "h-10", rail: "inset-0", thumb: "h-5 w-1.5 rounded-sm", thumbPx: 6, fillCapRadiusPx: 0, tooltipSideOffset: -2, tickInset: "inset-x-[3px]", tick: "h-2 rounded-none", tickCenterX: "", tickHairline: true },
    sm: { control: "h-8", rail: "inset-0", thumb: "h-4 w-1.5 rounded-sm", thumbPx: 6, fillCapRadiusPx: 0, tooltipSideOffset: 0, tickInset: "inset-x-[3px]", tick: "h-1.5 rounded-none", tickCenterX: "", tickHairline: true },
  },
} as const;

// Knobs rest one size step smaller, then grow to the former resting size while grabbed.
const KNOB_GRAB_SCALE = {
  md: 1.25,
  sm: 4 / 3,
} as const;

// What the thumb dims *to* while it sits under inline text: the dimmest ink the theme has.
// The handle stays a handle — a dimmed white in the dark theme, a dimmed black in the light
// one — rather than receding into the bar.
//
// Not a step towards the rail, which is the obvious way to dim and the wrong one. The rail is
// `muted` and the fill is the foreground at 15% over it, so the tones on that path are the
// fill's own neighbourhood and the handle arrives at the colour of the thing it is sitting on.
// `subtle-foreground` is neutral-500 in both themes, which lands clear of the fill in each —
// lighter than it in the dark theme, darker in the light one — and clear of the label text it
// passes under, which `muted-foreground` would have matched exactly in the dark theme.
//
// Opaque, and that is the point of the layer: dimming by opacity alone lets the rail's tick
// marks and the fill's edge show straight through the handle. The thumb is this floor with
// full-strength ink over it, so what animates is still only the ink's opacity while the floor
// stays solid at every point in the fade.
const INLINE_DIM_FLOOR = "bg-subtle-foreground";
const INLINE_GUTTER = { md: "px-3", sm: "px-2.5" } as const;
const NO_SPANS: readonly SliderSpan[] = [];

export function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showTicks = true,
  showValue = true,
  showValueTooltip = false,
  label,
  inlineLabel = false,
  thumb = "bar",
  size = "md",
  range = false,
  disabled,
  className,
  ...props
}: SliderProps) {
  const isBar = thumb === "bar";
  const isCircle = thumb === "circle";
  const inline = inlineLabel && isBar;
  const dims = DIMS[thumb][size];
  const roundThumbGrabScale = thumb === "knob" ? KNOB_GRAB_SCALE[size] : 1.12;
  const thumbTravelInsetPx = isCircle ? dims.fillCapRadiusPx : dims.thumbPx / 2;
  const reduceMotion = useReducedMotion();
  const direction = useDirection();
  const isRtl = direction === "rtl";
  const normalizedMin = Number.isFinite(min) ? min : 0;
  const normalizedMax = Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1;
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 1;
  const isRange = range || isSliderRange(value) || isSliderRange(defaultValue);
  const [internal, setInternal] = useState<SliderValue | undefined>(defaultValue);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [thumbHovered, setThumbHovered] = useState<ThumbFlags>([false, false]);
  const [thumbFocused, setThumbFocused] = useState<ThumbFlags>([false, false]);
  const controlRef = useRef<HTMLDivElement>(null);
  const inlineLabelRef = useRef<HTMLSpanElement>(null);
  const inlineValueRef = useRef<HTMLOutputElement>(null);
  const inlineSpansRef = useRef<readonly SliderSpan[]>(NO_SPANS);
  const thumb0Ref = useRef<HTMLDivElement>(null);
  const thumb1Ref = useRef<HTMLDivElement>(null);
  const thumbRefs = [thumb0Ref, thumb1Ref] as const;
  const pointerInteractionRef = useRef(false);
  const activeThumbIndexRef = useRef<number | null>(null);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [controlWidth, setControlWidth] = useState(0);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const normalizedValue = isRange
    ? normalizeSliderRange(current, normalizedMin, normalizedMax)
    : normalizeSliderValue(current, normalizedMin, normalizedMax);
  const normalizedThumbValues: ThumbValues = Array.isArray(normalizedValue)
    ? [normalizedValue[0], normalizedValue[1]]
    : [normalizedValue, normalizedValue];
  const visualPercent0 =
    isRtl
      ? 100 -
        ((normalizedThumbValues[0] - normalizedMin) /
          (normalizedMax - normalizedMin)) *
        100
      : ((normalizedThumbValues[0] - normalizedMin) /
          (normalizedMax - normalizedMin)) *
        100;
  const visualPercent1 =
    isRtl
      ? 100 -
        ((normalizedThumbValues[1] - normalizedMin) /
          (normalizedMax - normalizedMin)) *
        100
      : ((normalizedThumbValues[1] - normalizedMin) /
          (normalizedMax - normalizedMin)) *
        100;

  const thumbWidthPx = dims.thumbPx;

  // Spring-smoothed position drives transform-only visual layers.
  const target0 = useMotionValue(visualPercent0);
  const target1 = useMotionValue(visualPercent1);
  useEffect(() => {
    target0.set(visualPercent0);
    target1.set(visualPercent1);
  }, [target0, target1, visualPercent0, visualPercent1]);
  const smooth0 = useSpring(target0, SPRING_GLIDE);
  const smooth1 = useSpring(target1, SPRING_GLIDE);
  const pos0 = reduceMotion ? target0 : smooth0;
  const pos1 = reduceMotion ? target1 : smooth1;
  const [tooltipAlignOffsets, setTooltipAlignOffsets] = useState<ThumbValues>([0, 0]);
  const visualPercentsRef = useRef<ThumbValues>([visualPercent0, visualPercent1]);
  useLayoutEffect(() => {
    visualPercentsRef.current = [visualPercent0, visualPercent1];
  }, [visualPercent0, visualPercent1]);
  // Translate in pixels rather than changing `left` every animation frame. The control is
  // measured only when its size changes; the spring itself stays on the compositor.
  useLayoutEffect(() => {
    const control = controlRef.current;
    if (!control) return;
    const measure = () => {
      const nextWidth = getSliderControlWidth(control);
      setControlWidth(nextWidth);
      const travelWidth = Math.max(nextWidth - thumbTravelInsetPx * 2, 0);
      setTooltipAlignOffsets(
        visualPercentsRef.current.map(
          (percent) =>
            (percent / 100) * travelWidth + thumbTravelInsetPx - nextWidth / 2,
        ) as ThumbValues,
      );
      // Captured with the width because ticks are snapped to the *device* pixel grid, and
      // that ratio changes when the window moves to a monitor with different scaling.
      setPixelRatio(window.devicePixelRatio || 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(control);
    return () => observer.disconnect();
  }, [dims.thumbPx, thumbTravelInsetPx]);
  const thumbX0 = useTransform(
    pos0,
    (p) =>
      (p / 100) * Math.max(controlWidth - thumbTravelInsetPx * 2, 0) +
      thumbTravelInsetPx -
      dims.thumbPx / 2,
  );
  const thumbX1 = useTransform(
    pos1,
    (p) =>
      (p / 100) * Math.max(controlWidth - thumbTravelInsetPx * 2, 0) +
      thumbTravelInsetPx -
      dims.thumbPx / 2,
  );

  // How far each thumb has receded under the inline text, kept as a motion value so the fade
  // rides the same compositor frame as the thumb it belongs to. Reading the spans from a ref
  // rather than a dependency keeps this off React's render path entirely: at 0 it costs an
  // empty loop per frame, and nothing re-renders while a thumb slides under a label.
  const inlineDim0 = useMotionValue(0);
  const inlineDim1 = useMotionValue(0);
  const thumbInk0 = useTransform(inlineDim0, (dim) => 1 - dim);
  const thumbInk1 = useTransform(inlineDim1, (dim) => 1 - dim);
  useMotionValueEvent(thumbX0, "change", (latest) => {
    if (inline) {
      inlineDim0.set(getSliderInlineDim(latest, dims.thumbPx, inlineSpansRef.current));
    }
  });
  useMotionValueEvent(thumbX1, "change", (latest) => {
    if (inline) {
      inlineDim1.set(getSliderInlineDim(latest, dims.thumbPx, inlineSpansRef.current));
    }
  });

  // The text's own width is what the thumb is dimming against, and it changes under two
  // things the control's width doesn't cover: the value gains a digit, and the label is
  // swapped. Both elements are observed, so the spans follow either without polling.
  useLayoutEffect(() => {
    const control = controlRef.current;
    if (!control || !inline) {
      inlineSpansRef.current = NO_SPANS;
      inlineDim0.set(0);
      inlineDim1.set(0);
      return;
    }

    const measure = () => {
      const controlRect = control.getBoundingClientRect();
      const spans: SliderSpan[] = [];
      for (const element of [inlineLabelRef.current, inlineValueRef.current]) {
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0) continue;
        spans.push([rect.left - controlRect.left, rect.right - controlRect.left]);
      }
      inlineSpansRef.current = spans;
      // Re-settle both thumbs against the new text rather than waiting for the next move:
      // a value widening from 99 to 100 can reach a thumb that is standing still.
      inlineDim0.set(getSliderInlineDim(thumbX0.get(), dims.thumbPx, spans));
      inlineDim1.set(getSliderInlineDim(thumbX1.get(), dims.thumbPx, spans));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(control);
    if (inlineLabelRef.current) observer.observe(inlineLabelRef.current);
    if (inlineValueRef.current) observer.observe(inlineValueRef.current);
    return () => observer.disconnect();
  }, [dims.thumbPx, inline, inlineDim0, inlineDim1, label, showValue, thumbX0, thumbX1]);

  // Base UI's tooltip positioner listens for layout changes, but the slider thumb moves
  // through a transform-driven spring. Feed the positioner the thumb's current cross-axis
  // offset so the portalled popup follows every drag frame instead of only settling after
  // the value changes.
  useMotionValueEvent(thumbX0, "change", (latest) => {
    if (showValueTooltip) {
      setTooltipAlignOffsets((previous) => [
        latest + dims.thumbPx / 2 - controlWidth / 2,
        previous[1],
      ]);
    }
  });
  useMotionValueEvent(thumbX1, "change", (latest) => {
    if (showValueTooltip) {
      setTooltipAlignOffsets((previous) => [
        previous[0],
        latest + dims.thumbPx / 2 - controlWidth / 2,
      ]);
    }
  });

  // Each `pos` is a physical left-to-right position for a thumb. In RTL the single-thumb
  // fill still grows from the inline start (the right edge), so it needs the inverse progress.
  const fillProgress = useTransform(pos0, (position) => (isRtl ? 100 - position : position));
  // The fill ends at the thumb's *centre*. `pos%` alone would lag the (edge-aligned)
  // thumb on the left and overrun it on the right — off by up to half a thumb — so the
  // fill carries a correction of `thumbWidth·(0.5 − pos/100)`. Derive that correction
  // from the same spring-driven position as the thumb; using the raw target value or a
  // second spring lets the fill get ahead while the thumb is still settling.
  const valueRange = normalizedMax - normalizedMin;
  const stepCount = Math.floor(valueRange / normalizedStep);
  const firstFieldPercent = Math.min((normalizedStep / valueRange) * 100, 100);
  const remainder = valueRange - stepCount * normalizedStep;
  const lastFieldPercent =
    remainder > normalizedStep * 1e-9
      ? (remainder / valueRange) * 100
      : firstFieldPercent;
  const offset = useTransform(pos0, (position) => {
    return getSliderFillOffset(
      position,
      isRtl,
      thumbWidthPx,
      dims.fillCapRadiusPx,
      thumbTravelInsetPx,
      isCircle,
      firstFieldPercent,
      lastFieldPercent,
    );
  });
  const ltrFillClip = useMotionTemplate`inset(0 calc(100% - ${fillProgress}% - ${offset}px) 0 0)`;
  const rtlFillClip = useMotionTemplate`inset(0 0 0 calc(100% - ${fillProgress}% - ${offset}px))`;
  const ltrCircleFillClip = useMotionTemplate`inset(0 calc(100% - ${fillProgress}% - ${offset}px) 0 0 round ${dims.fillCapRadiusPx}px)`;
  const rtlCircleFillClip = useMotionTemplate`inset(0 0 0 calc(100% - ${fillProgress}% - ${offset}px) round ${dims.fillCapRadiusPx}px)`;
  const rangeStartPosition = isRtl ? pos1 : pos0;
  const rangeEndPosition = isRtl ? pos0 : pos1;
  const rangeBoundaryInset = isCircle ? dims.fillCapRadiusPx : 0;
  const rangeStartInset = useTransform(rangeStartPosition, (position) => {
    return getSliderRangeFillInset(
      position,
      true,
      controlWidth,
      thumbTravelInsetPx,
      rangeBoundaryInset,
      firstFieldPercent,
      lastFieldPercent,
    );
  });
  const rangeEndInset = useTransform(rangeEndPosition, (position) => {
    return getSliderRangeFillInset(
      position,
      false,
      controlWidth,
      thumbTravelInsetPx,
      rangeBoundaryInset,
      firstFieldPercent,
      lastFieldPercent,
    );
  });
  const rangeFillClip = useMotionTemplate`inset(0 calc(100% - ${rangeEndInset}px) 0 ${rangeStartInset}px${isCircle ? ` round ${dims.fillCapRadiusPx}px` : ""})`;
  const fillClip = isRange
    ? rangeFillClip
    : isCircle
      ? isRtl
        ? rtlCircleFillClip
        : ltrCircleFillClip
      : isRtl
        ? rtlFillClip
        : ltrFillClip;

  const ticks =
    showTicks && stepCount > 0 && stepCount <= 50
      ? Array.from(
          { length: stepCount + 1 },
          (_, i) => ((i * normalizedStep) / (normalizedMax - normalizedMin)) * 100,
        )
      : [];

  const handleValueChange = (next: number | readonly number[]) => {
    const nextValue = isRange
      ? normalizeSliderRange(next, normalizedMin, normalizedMax)
      : normalizeSliderValue(next, normalizedMin, normalizedMax);
    if (!controlled) setInternal(nextValue);
    if (isRange) {
      (onValueChange as ((value: SliderRange) => void) | undefined)?.(
        nextValue as SliderRange,
      );
    } else {
      (onValueChange as ((value: number) => void) | undefined)?.(
        nextValue as number,
      );
    }
  };

  const isPointerOverThumb = (
    index: number,
    event: { clientX: number; clientY: number },
  ) => {
    const thumb = thumbRefs[index]?.current;
    if (!thumb) return false;
    const rect = thumb.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  const handlePointerEnd = (event: { clientX: number; clientY: number }) => {
    pointerInteractionRef.current = false;
    activeThumbIndexRef.current = null;
    setDraggingIndex(null);
    setThumbFocused([false, false]);
    setThumbHovered([
      isPointerOverThumb(0, event),
      isRange && isPointerOverThumb(1, event),
    ]);
  };

  const handlePointerDown = (event: {
    clientX: number;
    clientY: number;
  }) => {
    if (disabled) return;
    pointerInteractionRef.current = true;
    setThumbFocused([false, false]);
    const activeThumbIndex =
      activeThumbIndexRef.current ?? getClosestThumbIndex(event);
    activeThumbIndexRef.current = activeThumbIndex;
    setDraggingIndex(activeThumbIndex);
  };

  const handleThumbPointerDown = (index: number) => {
    if (disabled) return;
    activeThumbIndexRef.current = index;
    pointerInteractionRef.current = true;
    setThumbFocused([false, false]);
    setDraggingIndex(index);
  };

  const setThumbHover = (index: number, hovered: boolean) => {
    setThumbHovered((previous) => {
      const next = [...previous] as ThumbFlags;
      next[index] = hovered;
      return next;
    });
  };

  const setThumbFocus = (index: number, focused: boolean) => {
    setThumbFocused((previous) => {
      const next = [...previous] as ThumbFlags;
      next[index] = focused;
      return next;
    });
  };

  const isTooltipOpen = (index: number) =>
    showValueTooltip &&
    (draggingIndex === index || thumbHovered[index] || thumbFocused[index]);

  const thumbIndices = isRange ? ([0, 1] as const) : ([0] as const);

  const getClosestThumbIndex = (event: { clientX: number; clientY: number }) => {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const index of thumbIndices) {
      const rect = thumbRefs[index]?.current?.getBoundingClientRect();
      if (!rect) continue;

      const distance = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    return closestIndex;
  };

  return (
    <BaseSlider.Root
      value={normalizedValue}
      onValueChange={handleValueChange as never}
      min={normalizedMin}
      max={normalizedMax}
      step={normalizedStep}
      disabled={disabled}
      data-range={isRange ? "true" : undefined}
      className={cn("relative w-full", className)}
      {...props}
    >
      {(showValue || label != null) && !inline && (
        <div
          className={cn(
            "mb-2 flex items-baseline gap-2 text-xs",
            label != null ? "justify-between" : "justify-end",
            disabled && "opacity-50",
          )}
        >
          {label != null && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            // `tabular` so the number doesn't reflow the row as its digits change. No
            // `font-mono` — it inherits Geist Sans from the body.
            <BaseSlider.Value className="tabular text-foreground" />
          )}
        </div>
      )}

      <BaseSlider.Control
        ref={controlRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        render={(renderProps, state) => {
          const activeThumbIndex =
            state.activeThumbIndex >= 0
              ? state.activeThumbIndex
              : (activeThumbIndexRef.current ?? -1);

          return (
            <div
              {...renderProps}
              data-dragging-index={
                state.dragging && activeThumbIndex >= 0
                  ? activeThumbIndex
                  : undefined
              }
            />
          );
        }}
        className={cn(
          "group relative flex w-full touch-none items-center select-none",
          // Circle uses a thick rounded rail; bar uses a thin vertical handle.
          dims.control,
          disabled
            ? "cursor-not-allowed opacity-50"
            : isBar
              ? "cursor-grab active:cursor-grabbing"
              : isRtl
                ? "cursor-w-resize"
                : "cursor-e-resize",
        )}
      >
        {/* The rail — clipped to its own shape so the fill rounds with it. The visual thumb
            sits above this clip, while the knob can still overhang its thin rail. */}
        <div
          className={cn(
            "absolute overflow-hidden bg-muted",
            dims.rail,
            isBar ? "rounded-lg" : "rounded-full",
          )}
        >
          {/* Fill — a circle gets a rounded cap centred on the thumb, so the fill
              encapsulates it; other variants end at the thumb's centre. */}
          <motion.div
            aria-hidden
            data-slot="slider-fill"
            className="absolute inset-0 bg-foreground/15"
            style={{ clipPath: fillClip }}
          />

          {/* Ticks inset by exactly half the thumb width, so each one lands where the
              (edge-aligned) thumb's centre lands at that value — otherwise the ticks and
              the thumb drift apart toward the ends.

              The shape follows the thumb: round thumbs get dots, and `bar` — whose thumb
              is a thin vertical handle — gets thin vertical lines, so the marks read as
              the same family of object as the thing sliding over them. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0",
              dims.tickInset,
            )}
          >
            {ticks.map((tp, i) => {
              const percent = isRtl ? 100 - tp : tp;
              // Snapped to whole pixels once the control has been measured. A hairline
              // placed at a percentage lands on a fractional device pixel and the browser
              // spreads it across two, so a run of identical ticks renders as a mix of
              // crisp 1px lines and blurred 2px ones. The width is already measured here
              // for the thumb, so rounding costs nothing. Only the *centring* translate
              // stays, and only on the axis the tick has no odd half-pixel on.
              const trackPx = Math.max(controlWidth - thumbTravelInsetPx * 2, 0);
              // Snapped to the device pixel grid, not the CSS one. On a display scaled to
              // 125% or 150% — the common Windows case — a whole CSS pixel still lands
              // mid-device-pixel, so the browser spreads a hairline across two and the run
              // of ticks comes out as a mix of crisp and blurred. Rounding in device
              // pixels puts every tick on the same boundary, so they all render alike.
              const snap = (px: number) => Math.round(px * pixelRatio) / pixelRatio;
              const left =
                trackPx > 0 ? `${snap((percent / 100) * trackPx)}px` : `${percent}%`;
              // The width has to sit on the grid too. `1px` is 1.25 device pixels at 125%
              // scaling, so even a perfectly placed line bleeds a quarter of a pixel into
              // its neighbour and reads as thicker than one that doesn't. Rounding to a
              // whole number of device pixels — never fewer than one — gives every tick
              // the same true hairline.
              const hairline = `${Math.max(1, Math.round(pixelRatio)) / pixelRatio}px`;

              return (
                <span
                  key={i}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 bg-foreground/25",
                    dims.tick,
                    dims.tickCenterX,
                  )}
                  style={{ left, ...(dims.tickHairline && { width: hairline }) }}
                />
              );
            })}
          </div>
        </div>

        {/* Base UI's thumb: the input lives here for focus, keyboard and ARIA. Hidden,
            because the visual thumb below is what's seen. When opted in, the same thumb
            is the tooltip anchor, so the value popup follows Base UI's real thumb position. */}
        {thumbIndices.map((index) => {
          const baseThumb = (
            <BaseSlider.Thumb
              key={`slider-thumb-${index}`}
              ref={thumbRefs[index]}
              index={index}
              className={cn("opacity-0", dims.thumb)}
              onPointerDown={() => handleThumbPointerDown(index)}
              onPointerEnter={() => setThumbHover(index, true)}
              onPointerLeave={() => setThumbHover(index, false)}
              onFocus={() =>
                setThumbFocus(index, !pointerInteractionRef.current)
              }
              onBlur={() => setThumbFocus(index, false)}
            />
          );

          return showValueTooltip ? (
            <Tooltip
              key={`slider-tooltip-${index}`}
              content={normalizedThumbValues[index]}
              open={isTooltipOpen(index)}
              side="top"
              sideOffset={dims.tooltipSideOffset}
              delay={0}
              closeOnClick={false}
              positionerProps={{
                anchor: controlRef,
                alignOffset: tooltipAlignOffsets[index] ?? 0,
              }}
            >
              {baseThumb}
            </Tooltip>
          ) : (
            baseThumb
          );
        })}

        {/* The visual thumb uses a positioning wrapper and a separate shape. Keeping the
            grab scale off the Motion-positioned element prevents a press from changing its
            pixel position. The focus ring lights up when the hidden input is focus-visible
            (`group-has`), so keyboard focus shows on the thing you can actually see. */}
        {thumbIndices.map((index) => (
          <motion.div
            key={`visual-slider-thumb-${index}`}
            aria-hidden
            data-slot="slider-thumb-positioner"
            className={cn(
              "pointer-events-none absolute top-1/2",
              dims.thumb,
            )}
            style={{
              left: 0,
              x: index === 0 ? thumbX0 : thumbX1,
              y: "-50%",
            }}
          >
            <motion.div
              data-slot="slider-thumb"
              className={cn(
                "absolute inset-0 origin-center shadow-sm",
                // Inline mode paints the dimmed floor here and the ink above it; everywhere
                // else the thumb is simply ink.
                inline ? INLINE_DIM_FLOOR : "bg-foreground",
                // A thin vertical handle, or a round knob the height of the rail.
                dims.thumb,
                "group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ring/40",
              )}
              // The bar grabs by stretching taller; a round knob can't stretch one axis
              // without going oval, so it grabs by growing evenly. Keep this on the inner
              // shape so the Motion position wrapper never moves during the resize.
              animate={
                reduceMotion
                  ? undefined
                  : isBar
                    ? { scaleY: draggingIndex === index ? 1.35 : 1 }
                    : {
                        scale:
                          draggingIndex === index ? roundThumbGrabScale : 1,
                      }
              }
              transition={SPRING_GRAB}
            >
              {/* Full-strength ink over the dimmed floor. Fading this out is what dims the
                  thumb, so the animated property stays `opacity` — but what shows through is
                  the floor beneath, never the rail. */}
              {inline && (
                <motion.span
                  aria-hidden
                  data-slot="slider-thumb-ink"
                  className="absolute inset-0 rounded-[inherit] bg-foreground"
                  style={{ opacity: index === 0 ? thumbInk0 : thumbInk1 }}
                />
              )}
            </motion.div>
          </motion.div>
        ))}

        {/* Inline label and value — last, so they paint over the thumb rather than under it.
            The thumb is what yields here: it fades as it arrives (see `inlineDim`), so the
            text never has to compete with a solid handle sliding beneath it. `inset-0`
            centres them against the same rail the thumb travels, and the gutter keeps both
            clear of its rounded ends. */}
        {inline && (showValue || label != null) && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center gap-2 text-xs",
              label != null ? "justify-between" : "justify-end",
              INLINE_GUTTER[size],
            )}
          >
            {label != null && (
              // Full ink, matching the value at the other end. The row above the track dims
              // its label to separate it from the number; inside the bar both sit on the rail,
              // the fill and the thumb, and a dimmed label is one thing too many to read
              // through.
              <span ref={inlineLabelRef} className="truncate text-foreground">
                {label}
              </span>
            )}
            {showValue && (
              <BaseSlider.Value
                ref={inlineValueRef}
                className="shrink-0 tabular text-foreground"
              />
            )}
          </div>
        )}
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
