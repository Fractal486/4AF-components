"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
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
import { getSliderControlWidth, getSliderFillOffset } from "./slider-geometry";
import { cn } from "@/registry/lib/cn";

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

export interface SliderProps
  extends Omit<
    ComponentProps<typeof BaseSlider.Root>,
    "className" | "render" | "value" | "defaultValue" | "onValueChange"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  className?: string;
  /** A dot at each step. Hidden automatically past 50 steps, where they'd be noise. */
  showTicks?: boolean;
  /** The current value, shown above the track on the right. */
  showValue?: boolean;
  /** Text shown above the track on the left, opposite the value. */
  label?: ReactNode;
  /**
   * The thumb shape. `bar` is the thin vertical handle; `circle` is a round knob that
   * fills a fully-rounded track; `knob` is that same round knob on a thin rail (about half
   * the knob's diameter), so it overhangs — the classic slider look.
   */
  thumb?: "bar" | "circle" | "knob";
  /** Overall scale. `sm` is a more compact rail — useful in dense panels. */
  size?: "sm" | "md";
}

// Every size-dependent value in one place, keyed by shape then size, so the rail height
// and rounding, the thumb, the pixel width the fill/tick maths needs, and the tick inset
// (half that width) never drift out of step. `rail` positions the track within the
// control — `inset-0` fills it (thumb == rail height); a fixed height centres a thin rail
// the thumb overhangs.
const DIMS = {
  circle: {
    md: { control: "h-5", rail: "inset-0", thumb: "size-5 rounded-full", thumbPx: 20, tickInset: "inset-x-2.5", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-4", rail: "inset-0", thumb: "size-4 rounded-full", thumbPx: 16, tickInset: "inset-x-2", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  knob: {
    md: { control: "h-5", rail: "inset-x-0 top-1/2 h-2.5 -translate-y-1/2", thumb: "size-5 rounded-full", thumbPx: 20, tickInset: "inset-x-2.5", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-4", rail: "inset-x-0 top-1/2 h-2 -translate-y-1/2", thumb: "size-4 rounded-full", thumbPx: 16, tickInset: "inset-x-2", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  bar: {
    md: { control: "h-10", rail: "inset-0", thumb: "h-5 w-1.5 rounded-sm", thumbPx: 6, tickInset: "inset-x-[3px]", tick: "h-2 rounded-none", tickCenterX: "", tickHairline: true },
    sm: { control: "h-8", rail: "inset-0", thumb: "h-4 w-1.5 rounded-sm", thumbPx: 6, tickInset: "inset-x-[3px]", tick: "h-1.5 rounded-none", tickCenterX: "", tickHairline: true },
  },
} as const;

export function Slider({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showTicks = true,
  showValue = true,
  label,
  thumb = "bar",
  size = "md",
  disabled,
  className,
  ...props
}: SliderProps) {
  const isBar = thumb === "bar";
  const dims = DIMS[thumb][size];
  const reduceMotion = useReducedMotion();
  const direction = useDirection();
  const isRtl = direction === "rtl";
  const normalizedMin = Number.isFinite(min) ? min : 0;
  const normalizedMax = Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1;
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 1;
  const [internal, setInternal] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [controlWidth, setControlWidth] = useState(0);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const normalizedCurrent = clamp(
    Number.isFinite(current) ? current : normalizedMin,
    normalizedMin,
    normalizedMax,
  );
  const percent = ((normalizedCurrent - normalizedMin) / (normalizedMax - normalizedMin)) * 100;
  const visualPercent = isRtl ? 100 - percent : percent;

  const thumbWidthPx = dims.thumbPx;

  // Spring-smoothed position drives transform-only visual layers.
  const target = useMotionValue(visualPercent);
  useEffect(() => {
    target.set(visualPercent);
  }, [target, visualPercent]);
  const smooth = useSpring(target, SPRING_GLIDE);
  const pos = reduceMotion ? target : smooth;
  // Translate in pixels rather than changing `left` every animation frame. The control is
  // measured only when its size changes; the spring itself stays on the compositor.
  useLayoutEffect(() => {
    const control = controlRef.current;
    if (!control) return;
    const measure = () => {
      setControlWidth(getSliderControlWidth(control));
      // Captured with the width because ticks are snapped to the *device* pixel grid, and
      // that ratio changes when the window moves to a monitor with different scaling.
      setPixelRatio(window.devicePixelRatio || 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(control);
    return () => observer.disconnect();
  }, []);
  const thumbX = useTransform(
    pos,
    (p) => (p / 100) * Math.max(controlWidth - dims.thumbPx, 0),
  );

  // `pos` is a physical left-to-right position for the thumb. In RTL the fill still
  // grows from the inline start (the right edge), so it needs the inverse progress.
  const fillProgress = useTransform(pos, (position) => (isRtl ? 100 - position : position));
  // The fill ends at the thumb's *centre*. `pos%` alone would lag the (edge-aligned)
  // thumb on the left and overrun it on the right — off by up to half a thumb — so the
  // fill carries a correction of `thumbWidth·(0.5 − pos/100)`. Derive that correction
  // from the same spring-driven position as the thumb; using the raw target value or a
  // second spring lets the fill get ahead while the thumb is still settling.
  const offset = useTransform(pos, (position) => {
    return getSliderFillOffset(position, isRtl, thumbWidthPx);
  });
  const ltrFillClip = useMotionTemplate`inset(0 calc(100% - ${fillProgress}% - ${offset}px) 0 0)`;
  const rtlFillClip = useMotionTemplate`inset(0 0 0 calc(100% - ${fillProgress}% - ${offset}px))`;
  const fillClip = isRtl ? rtlFillClip : ltrFillClip;

  const stepCount = Math.floor((normalizedMax - normalizedMin) / normalizedStep);
  const ticks =
    showTicks && stepCount > 0 && stepCount <= 50
      ? Array.from(
          { length: stepCount + 1 },
          (_, i) => ((i * normalizedStep) / (normalizedMax - normalizedMin)) * 100,
        )
      : [];

  const handleValueChange = (next: number) => {
    const nextValue = clamp(next, normalizedMin, normalizedMax);
    if (!controlled) setInternal(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <BaseSlider.Root
      value={normalizedCurrent}
      onValueChange={handleValueChange as never}
      min={normalizedMin}
      max={normalizedMax}
      step={normalizedStep}
      disabled={disabled}
      className={cn("relative w-full", className)}
      {...props}
    >
      {(showValue || label != null) && (
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
        onPointerDown={() => !disabled && setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        className={cn(
          "group relative flex w-full touch-none items-center select-none",
          // The circle variant is half as thick; its round thumb is sized to the rail
          // height, so it matches the rail's rounded end-caps.
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
        {/* The rail — clipped to its own shape so the fill rounds with it. The thumb
            sits *outside* this clip, so a circle that fills the rail can grow past its
            edges when grabbed rather than being flattened against them. */}
        <div
          className={cn(
            "absolute overflow-hidden bg-muted",
            dims.rail,
            isBar ? "rounded-lg" : "rounded-full",
          )}
        >
          {/* Fill — inline start to the thumb's centre, easing to the rail edges at the ends. */}
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
              const trackPx = Math.max(controlWidth - dims.thumbPx, 0);
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
            because the visual thumb below is what's seen. */}
        <BaseSlider.Thumb className="opacity-0" />

        {/* The visual thumb — spring-positioned, grab-stretched. The focus ring lights up
            when the hidden input is focus-visible (`group-has`), so keyboard focus shows
            on the thing you can actually see. */}
        <motion.div
          aria-hidden
          data-slot="slider-thumb"
          className={cn(
            "pointer-events-none absolute top-1/2 bg-foreground shadow-sm",
            // A thin vertical handle, or a round knob the height of the rail.
            dims.thumb,
            "group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ring/40",
          )}
          style={{ left: 0, x: thumbX, y: "-50%" }}
          // The bar grabs by stretching taller; a round knob can't stretch one axis
          // without going oval, so it grabs by growing evenly.
          animate={
            reduceMotion
              ? undefined
              : isBar
                ? { scaleY: dragging ? 1.35 : 1 }
                : { scale: dragging ? 1.12 : 1 }
          }
          transition={SPRING_GRAB}
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
