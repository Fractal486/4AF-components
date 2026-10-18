"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, spring } from "@/registry/lib/motion";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import {
  getSliderThumbCenter,
  getSliderControlWidth,
  getSliderFillOffset,
  getSliderRangeFillInset,
  getSliderThumbDodged,
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
 * behaviour target — and a thumb and fill are drawn over it. A thumb under the pointer
 * tracks it 1:1; movement the pointer isn't carrying (a track click's jump, keyboard steps,
 * a value set from outside) glides on a spring. The thumb also stretches taller while held,
 * so it reads as something grabbed.
 */

// The glide for moves the pointer isn't carrying — a track click, a keyboard step, a value
// set from outside. A soft spring with a hint of overshoot, so a move settles into place.
const SPRING_GLIDE = spring.smooth;
// Notch to notch under a held thumb on a coarse-step slider. The slide scales with the
// square root of the notch's share of the track — four times the distance, twice the time —
// from 0.05s for the finest coarse step to 0.25s for a half-track jump, so a small notch
// keeps up with the cursor and a large one still reads as travel. No bounce, and Motion
// carries the velocity into each retarget, so a run of notches flows instead of restarting.
function notchSpring(notchShare: number) {
  return { type: "spring", visualDuration: clamp(0.35 * Math.sqrt(notchShare), 0.05, 0.25), bounce: 0 } as const;
}
// At 50 or more steps a notch is at most 2% of the track, so 1:1 tracking reads as
// continuous. The same count past which ticks are hidden as noise.
const FINE_STEP_COUNT = 50;
// Grab stretch — quick, and no overshoot (bounce 0), so it settles cleanly rather than
// wobbling.
const SPRING_GRAB = { type: "spring", visualDuration: 0.2, bounce: 0 } as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Base UI's hidden thumb takes the press, but sits at the value while the drawn bar thumb
// rides up to 8px inside it (the fill's edge on the single bar, the inset travel in a range).
// At the drawn thumb's own 2px it missed every press on the drawn thumb, which Base UI then
// took as a track press at the pointer: the value dropped, the thumb jumped, and it trailed
// the cursor for the whole drag. 24px covers the drawn thumb wherever it sits.
const BAR_HIT_WIDTH = "w-6";

/** How much taller the bar thumb grows while held. */
const BAR_GRAB_STRETCH = 1.35;
/** How much wider it grows: 2px to 3px, enough to read as taken hold of. */
const BAR_GRAB_WIDEN = 1.5;

// The bar's ticks read like a ruler: short marks, a taller one every few steps, and the
// tallest at the midpoint. Heights per size, short to tall.
const BAR_TICK_HEIGHTS = {
  md: ["h-1.5", "h-2.5", "h-3.5"],
  sm: ["h-1", "h-2", "h-3"],
} as const;

/**
 * A tick's ruler level: 2 at the midpoint, 1 every fifth step (or at the quarters when there
 * are fewer than ten steps), 0 otherwise.
 */
function barTickLevel(index: number, stepCount: number): 0 | 1 | 2 {
  if (index * 2 === stepCount) return 2;
  if (stepCount >= 10 ? index % 5 === 0 : (index * 4) % stepCount === 0) return 1;
  return 0;
}

/**
 * The bar thumb, built from parts so it can grow without distorting: two round caps and a
 * middle. Held, the caps slide apart and only the middle stretches to bridge them, so the
 * ends stay round where a `scaleY` on one pill would squash them into ovals. It also widens:
 * the caps scale evenly, staying circles, and the middle widens to match. All three move
 * on the same spring, so they stay joined; the shadow is one drop-shadow on the group, so
 * the joins never show.
 */
function BarThumb({
  dodged,
  stretched,
  heightPx,
  widthPx,
  reduceMotion,
}: {
  dodged: boolean;
  stretched: boolean;
  heightPx: number;
  widthPx: number;
  reduceMotion: boolean;
}) {
  const capRadius = widthPx / 2;
  const reach = ((BAR_GRAB_STRETCH - 1) * heightPx) / 2;
  const middleScale = 1 + (2 * reach) / (heightPx - widthPx);
  const transition = reduceMotion ? { duration: 0 } : SPRING_GRAB;

  return (
    <motion.div
      data-slot="slider-thumb"
      data-dodged={dodged ? "" : undefined}
      className="absolute inset-0 rounded-full drop-shadow-sm group-has-[[type=range]:focus-visible]:ring-4 group-has-[[type=range]:focus-visible]:ring-ring/40"
      animate={{ opacity: dodged ? DODGE_OPACITY : 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: duration.fast, ease: "easeOut" }}
    >
      <motion.span
        className="absolute inset-x-0 top-0 aspect-square rounded-full bg-foreground"
        animate={{ y: stretched ? -reach : 0, scale: stretched ? BAR_GRAB_WIDEN : 1 }}
        transition={transition}
      />
      <motion.span
        className="absolute inset-x-0 bg-foreground"
        style={{ top: capRadius, bottom: capRadius }}
        animate={{
          scaleY: stretched ? middleScale : 1,
          scaleX: stretched ? BAR_GRAB_WIDEN : 1,
        }}
        transition={transition}
      />
      <motion.span
        className="absolute inset-x-0 bottom-0 aspect-square rounded-full bg-foreground"
        animate={{ y: stretched ? reach : 0, scale: stretched ? BAR_GRAB_WIDEN : 1 }}
        transition={transition}
      />
    </motion.div>
  );
}

// The fader fill's edge and a tick at the same spot would draw as a doubled line, so a tick is
// switched off — no fade — only while the edge sits within half a pixel of it, so it never
// vanishes ahead of the fill.
const EDGE_HIDE_PX = 0.5;

/**
 * A tick on the single bar. It follows the fill's drawn edge rather than the value, so the
 * mark the fill rests on disappears and the ones it glides across blink out as it passes.
 */
function FaderTick({
  percent,
  position,
  width,
  className,
  style,
}: {
  /** The tick's physical left-to-right position, 0–100. */
  percent: number;
  /** The fill edge's drawn position, on the same scale. */
  position: MotionValue<number>;
  width: number;
  className: string;
  style: CSSProperties;
}) {
  const opacity = useTransform(position, (edge) => {
    if (width <= 0) return Math.abs(edge - percent) < 0.001 ? 0 : 1;
    return (Math.abs(edge - percent) / 100) * width < EDGE_HIDE_PX ? 0 : 1;
  });
  return <motion.span className={className} style={{ ...style, opacity }} />;
}

/** A typed value clamped to the range and snapped to the nearest step, or null if unreadable. */
function parseTypedValue(text: string, min: number, max: number, step: number): number | null {
  const typed = Number(text.trim().replace(",", "."));
  if (text.trim() === "" || !Number.isFinite(typed)) return null;
  const snapped = Math.round((clamp(typed, min, max) - min) / step) * step + min;
  // Snapping in floating point leaves tails (0.30000000000000004); round them to the step's
  // own precision.
  const decimals = (String(step).split(".")[1] ?? "").length;
  return clamp(Number(snapped.toFixed(decimals)), min, max);
}

/**
 * The shown value, editable in place: a text cursor over the number itself, and a click
 * turns it into an input sized to its contents. Enter or leaving the field commits the
 * typed value, clamped and snapped to the step; Escape cancels. The hit area is the number's
 * own box, and a press on it is kept from the control, so it never starts a drag.
 */
function EditableValue({
  index = 0,
  value,
  min,
  max,
  step,
  label,
  onCommit,
  className,
}: {
  /** Which thumb's value this is; a range shows one editable value per thumb. */
  index?: number;
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  onCommit: (index: number, value: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Escape unmounts the input, and a blur fired on the way out must not commit the draft.
  const cancelledRef = useRef(false);

  const commit = () => {
    if (draft === null) return;
    if (!cancelledRef.current) {
      const next = parseTypedValue(draft, min, max, step);
      if (next !== null && next !== value) onCommit(index, next);
    }
    cancelledRef.current = false;
    setDraft(null);
  };

  if (draft !== null) {
    return (
      <input
        autoFocus
        aria-label={label}
        inputMode="decimal"
        value={draft}
        size={Math.max(draft.length, 1)}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={commit}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          // Kept from the slider, whose arrow keys would otherwise move the thumb as well.
          event.stopPropagation();
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            cancelledRef.current = true;
            setDraft(null);
          }
        }}
        // Sized to the text where `field-sizing` is supported; `size` covers the rest.
        style={{ fieldSizing: "content" } as CSSProperties}
        className={cn(
          "pointer-events-auto m-0 min-w-[1ch] border-0 bg-transparent p-0 text-right tabular text-foreground outline-none",
          className,
        )}
      />
    );
  }

  return (
    <BaseSlider.Value
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => setDraft(String(value))}
      className={cn("pointer-events-auto cursor-text tabular", className)}
    >
      {(formatted) => formatted[index]}
    </BaseSlider.Value>
  );
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
  /**
   * A dot at each step. Hidden automatically past 50 steps, where they'd be noise, and not
   * available on the `knob` thumb — its thin rail carries the fill alone.
   */
  showTicks?: boolean;
  /** The current value, shown above the track on the right. */
  showValue?: boolean;
  /** Show the live value in a tooltip above the thumb while it is hovered or focused. */
  showValueTooltip?: boolean;
  /** Text shown above the track on the left, opposite the value. */
  label?: ReactNode;
  /** Accessible names for the lower and upper range handles, overriding the shared label. */
  thumbLabels?: readonly [string, string];
  /**
   * Move the label and the value *inside* the bar, one at each end, instead of above it.
   * The thumb dims as it passes under either, so the text stays readable.
   *
   * `bar` only, and ignored by the other thumbs: the `knob` rail is a hairline with no room for
   * a line of text, and the `circle` track is a rounded pill its thumb rides inside rather than
   * a band text can sit along.
   */
  inlineLabel?: boolean;
  /**
   * The thumb shape. `bar` is the thin vertical handle; `circle` is a round knob centered in a
   * thick, fully-rounded track whose fill encapsulates it; `knob` is a small round dot on a thin
   * rail (4px for md, 2px for sm) which it overhangs entirely, and which carries the fill and
   * nothing else. The knob's control keeps its full height as the rail thins, so the pointer
   * target does not shrink with it.
   */
  thumb?: "bar" | "circle" | "knob";
  /** Overall scale. `sm` is a more compact rail — useful in dense panels. */
  size?: "sm" | "md";
}

// Every size-dependent value in one place, keyed by shape then size, so the rail height
// and rounding, the thumb, the pixel width the fill/tick maths needs, and the tick inset
// (the thumb's travel inset) never drift out of step. `fillCapRadiusPx` is how far the fill
// reaches past the thumb's centre — which is also the thumb's travel inset, so at either
// end the fill still holds it — and `fillRadiusPx` rounds the fill's leading end. `rail`
// positions the track within the control — `inset-0` fills a thick circle rail; a fixed height centres a thin rail so the
// round thumb overhangs. `knob` rides a thin rail (4px for md, 2px for sm), so its rail reads as
// a line the dot travels along rather than a track it sits in.
const DIMS = {
  circle: {
    md: { control: "h-7", rail: "inset-0", thumb: "size-5 rounded-full", thumbPx: 20, thumbHeightPx: 20, fillCapRadiusPx: 14, fillRadiusPx: 14, tooltipSideOffset: 8, tickInset: "inset-x-3.5", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-6", rail: "inset-0", thumb: "size-4 rounded-full", thumbPx: 16, thumbHeightPx: 16, fillCapRadiusPx: 12, fillRadiusPx: 12, tooltipSideOffset: 8, tickInset: "inset-x-3", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  knob: {
    md: { control: "h-5", rail: "inset-x-0 top-1/2 h-1 -translate-y-1/2", thumb: "size-2.5 rounded-full", thumbPx: 10, thumbHeightPx: 10, fillCapRadiusPx: 0, fillRadiusPx: 0, tooltipSideOffset: 8, tickInset: "inset-x-[5px]", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
    sm: { control: "h-4", rail: "inset-x-0 top-1/2 h-0.5 -translate-y-1/2", thumb: "size-2 rounded-full", thumbPx: 8, thumbHeightPx: 8, fillCapRadiusPx: 0, fillRadiusPx: 0, tooltipSideOffset: 8, tickInset: "inset-x-1", tick: "size-1 rounded-full", tickCenterX: "-translate-x-1/2", tickHairline: false },
  },
  bar: {
    md: { control: "h-10", rail: "inset-0", thumb: "h-4 w-0.5 rounded-full", thumbPx: 2, thumbHeightPx: 16, fillCapRadiusPx: 8, fillRadiusPx: 0, tooltipSideOffset: -2, tickInset: "inset-x-2", tick: "rounded-none", tickCenterX: "", tickHairline: true },
    sm: { control: "h-8", rail: "inset-0", thumb: "h-3 w-0.5 rounded-full", thumbPx: 2, thumbHeightPx: 12, fillCapRadiusPx: 8, fillRadiusPx: 0, tooltipSideOffset: 0, tickInset: "inset-x-2", tick: "rounded-none", tickCenterX: "", tickHairline: true },
  },
} as const;

// The knob is a small dot on a hairline, so it grabs by a quarter rather than the 12% the
// larger round thumb uses: the same proportion on a 10px dot is barely over a pixel, and a
// press that cannot be seen is a press that did not happen.
const KNOB_GRAB_SCALE = {
  md: 1.25,
  sm: 4 / 3,
} as const;

// Inline mode: once the thumb comes within this many px of the label or value it *dodges* —
// fades to a ghost and drops any grab stretch, back to its resting height — so the text it
// passes under stays readable. A switch with its own springs rather than a ramp tied to the
// overlap: the text gets its contrast back the moment the thumb arrives instead of partway
// across. Parked at either end it doesn't dodge (see `getSliderThumbDodged`).
const DODGE_APPROACH_PX = 8;
const DODGE_OPACITY = 0.15;

// "In use" for the bar: hovered, dragged, or keyboard-focused. Focus means the slider's own
// range input, not anything focused inside the control, so typing into the editable value
// doesn't light up the thumb's ring or the ticks. The ticks fade in, the fill
// steps up and the inline value comes to full ink; at rest the bar is just a rail and a fill.
// The slow token, not the base one: these are ambient changes the hand didn't ask for, so they
// ease in rather than snap with the cursor.
const BAR_TICKS_IN_USE =
  "opacity-0 transition-[opacity] duration-(--duration-slow) ease-out group-hover:opacity-100 group-data-[dragging-index]:opacity-100 group-has-[[type=range]:focus-visible]:opacity-100";
// The fill colour. `--slider-fill` sets it from outside; by default it is the foreground at
// 15%. The bar's in-use step mixes in 8% foreground, so a custom colour deepens (or, in the
// dark theme, lightens) the same way the default grey steps up to about 20%.
const FILL_COLOR =
  "[--slider-fill-rest:var(--slider-fill,color-mix(in_oklab,var(--color-foreground)_15%,transparent))] [--slider-fill-active:color-mix(in_oklab,var(--slider-fill-rest),var(--color-foreground)_8%)] bg-(color:--slider-fill-rest)";
const BAR_FILL_IN_USE =
  "transition-[background-color] duration-(--duration-slow) ease-out group-hover:bg-(color:--slider-fill-active) group-data-[dragging-index]:bg-(color:--slider-fill-active) group-has-[[type=range]:focus-visible]:bg-(color:--slider-fill-active)";
const INLINE_VALUE_IN_USE =
  "text-muted-foreground transition-[color] duration-(--duration-slow) ease-out group-hover:text-foreground group-data-[dragging-index]:text-foreground group-has-[[type=range]:focus-visible]:text-foreground";

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
  thumbLabels,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  inlineLabel = false,
  thumb = "bar",
  size = "md",
  range = false,
  disabled,
  className,
  ...props
}: SliderProps) {
  const labelId = useId();
  const labelledBy = ariaLabelledBy ?? (ariaLabel == null && label != null ? labelId : undefined);
  const isBar = thumb === "bar";
  const isKnob = thumb === "knob";
  const inline = inlineLabel && isBar;
  const dims = DIMS[thumb][size];
  const roundThumbGrabScale = isKnob ? KNOB_GRAB_SCALE[size] : 1.12;
  // A thumb the fill holds (circle, bar) travels inset by the fill's reach past it; the knob,
  // which the fill only meets, by half its own width.
  const thumbTravelInsetPx = dims.fillCapRadiusPx > 0 ? dims.fillCapRadiusPx : dims.thumbPx / 2;
  const holdsThumb = dims.fillCapRadiusPx > 0;
  const reduceMotion = useReducedMotion();
  const direction = useDirection();
  const isRtl = direction === "rtl";
  const normalizedMin = Number.isFinite(min) ? min : 0;
  const normalizedMax = Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1;
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 1;
  const isRange = range || isSliderRange(value) || isSliderRange(defaultValue);
  // A single bar works like a fader: the fill's edge is the value, running the full width
  // from nothing at the minimum, and the thumb rides `fillCapRadiusPx` inside it. A range has
  // two edges to hold, so it keeps the inset travel with the fill reaching past each thumb.
  const followFillPx = isBar && !isRange ? dims.fillCapRadiusPx : 0;
  const [internal, setInternal] = useState<SliderValue | undefined>(defaultValue);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [thumbHovered, setThumbHovered] = useState<ThumbFlags>([false, false]);
  const [thumbFocused, setThumbFocused] = useState<ThumbFlags>([false, false]);
  const [dodged, setDodged] = useState<ThumbFlags>([false, false]);
  const controlRef = useRef<HTMLDivElement>(null);
  const inlineLabelRef = useRef<HTMLSpanElement>(null);
  const inlineValueRef = useRef<HTMLSpanElement>(null);
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
  // A value as a physical left-to-right position along the control, 0–100.
  const toVisualPercent = (thumbValue: number) => {
    const percent = ((thumbValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100;
    return isRtl ? 100 - percent : percent;
  };
  const visualPercent0 = toVisualPercent(normalizedThumbValues[0]);
  const visualPercent1 = toVisualPercent(normalizedThumbValues[1]);

  const thumbWidthPx = dims.thumbPx;

  // The drawn position drives transform-only visual layers. Each value change picks how the
  // drawn thumb gets there: the thumb being dragged follows the pointer (directly, or on the
  // short notch spring when steps are coarse); everything else glides.
  const fineSteps = (normalizedMax - normalizedMin) / normalizedStep >= FINE_STEP_COUNT;
  const heldSpring = notchSpring(Math.min(normalizedStep / (normalizedMax - normalizedMin), 1));
  const pos0 = useMotionValue(visualPercent0);
  const pos1 = useMotionValue(visualPercent1);
  const targetsRef = useRef([visualPercent0, visualPercent1]);
  // Moves one drawn thumb to a new position. Called from the value-change handler, inside the
  // pointer event, so the move lands before React renders and is drawn in the same frame —
  // the way a fader writes its fill. Not from a layout effect: React tears down the
  // `useTransform` subscriptions before re-running layout effects, so a move made there is
  // missed and the drawn thumb trails one value behind, short of the end at the end of a drag.
  //
  // Base UI's change reason says whether the pointer is carrying the thumb: `drag` follows it,
  // and everything else — a track press's jump, a keyboard step, a value from outside — glides.
  // Counting changes per press instead mistook the first drag step for a press's jump whenever
  // the press itself landed on the thumb and changed nothing.
  const follow = (index: 0 | 1, to: number, reason?: string) => {
    if (targetsRef.current[index] === to) return;
    targetsRef.current[index] = to;
    const position = index === 0 ? pos0 : pos1;
    const held = reason === "drag";
    if (reduceMotion || (held && fineSteps)) position.jump(to);
    else animate(position, to, held ? heldSpring : SPRING_GLIDE);
  };
  // Values from outside — a controlled value, or a controlled parent declining a change. After
  // every render the drawn thumbs settle on the value actually rendered; `follow` returns at
  // once when nothing has changed.
  useEffect(() => {
    follow(0, visualPercent0);
    follow(1, visualPercent1);
  });
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
      setTooltipAlignOffsets(
        visualPercentsRef.current.map(
          (percent) =>
            getSliderThumbCenter(percent, nextWidth, thumbTravelInsetPx, followFillPx, isRtl) -
            nextWidth / 2,
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
  }, [dims.thumbPx, thumbTravelInsetPx, followFillPx, isRtl]);
  const thumbX0 = useTransform(
    pos0,
    (p) =>
      getSliderThumbCenter(p, controlWidth, thumbTravelInsetPx, followFillPx, isRtl) -
      dims.thumbPx / 2,
  );
  const thumbX1 = useTransform(
    pos1,
    (p) =>
      getSliderThumbCenter(p, controlWidth, thumbTravelInsetPx, followFillPx, isRtl) -
      dims.thumbPx / 2,
  );
  // The fader fill is a whole box slid along the rail rather than a clip. Translating by its own width keeps it
  // exact before the control is measured; the rail clips the part slid out of view.
  const faderFillX = useTransform(pos0, (p) => `${isRtl ? p : p - 100}%`);

  // Whether each thumb is under the inline text. Checked on every frame of the thumb's own
  // spring, with the spans read from a ref, but React only hears about it when a thumb
  // crosses in or out — sliding along under a label re-renders nothing.
  const setThumbDodged = (index: 0 | 1, next: boolean) =>
    setDodged((previous) => {
      if (previous[index] === next) return previous;
      const updated = [...previous] as ThumbFlags;
      updated[index] = next;
      return updated;
    });
  useMotionValueEvent(thumbX0, "change", (latest) => {
    if (inline) {
      setThumbDodged(
        0,
        getSliderThumbDodged(latest, dims.thumbPx, controlWidth, inlineSpansRef.current, DODGE_APPROACH_PX, thumbTravelInsetPx),
      );
    }
  });
  useMotionValueEvent(thumbX1, "change", (latest) => {
    if (inline) {
      setThumbDodged(
        1,
        getSliderThumbDodged(latest, dims.thumbPx, controlWidth, inlineSpansRef.current, DODGE_APPROACH_PX, thumbTravelInsetPx),
      );
    }
  });

  // The text's own width is what the thumb is dimming against, and it changes under two
  // things the control's width doesn't cover: the value gains a digit, and the label is
  // swapped. Both elements are observed, so the spans follow either without polling.
  useLayoutEffect(() => {
    const control = controlRef.current;
    if (!control || !inline) {
      inlineSpansRef.current = NO_SPANS;
      setDodged((previous) => (previous[0] || previous[1] ? [false, false] : previous));
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
      const width = getSliderControlWidth(control);
      const next: ThumbFlags = [
        getSliderThumbDodged(thumbX0.get(), dims.thumbPx, width, spans, DODGE_APPROACH_PX, thumbTravelInsetPx),
        getSliderThumbDodged(thumbX1.get(), dims.thumbPx, width, spans, DODGE_APPROACH_PX, thumbTravelInsetPx),
      ];
      setDodged((previous) =>
        previous[0] === next[0] && previous[1] === next[1] ? previous : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(control);
    if (inlineLabelRef.current) observer.observe(inlineLabelRef.current);
    if (inlineValueRef.current) observer.observe(inlineValueRef.current);
    return () => observer.disconnect();
  }, [dims.thumbPx, inline, label, showValue, thumbTravelInsetPx, thumbX0, thumbX1]);

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
      holdsThumb,
      firstFieldPercent,
      lastFieldPercent,
    );
  });
  const ltrFillClip = useMotionTemplate`inset(0 calc(100% - ${fillProgress}% - ${offset}px) 0 0)`;
  const rtlFillClip = useMotionTemplate`inset(0 0 0 calc(100% - ${fillProgress}% - ${offset}px))`;
  const ltrRoundFillClip = useMotionTemplate`inset(0 calc(100% - ${fillProgress}% - ${offset}px) 0 0 round ${dims.fillRadiusPx}px)`;
  const rtlRoundFillClip = useMotionTemplate`inset(0 0 0 calc(100% - ${fillProgress}% - ${offset}px) round ${dims.fillRadiusPx}px)`;
  const rangeStartPosition = isRtl ? pos1 : pos0;
  const rangeEndPosition = isRtl ? pos0 : pos1;
  const rangeBoundaryInset = dims.fillCapRadiusPx;
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
  const rangeFillClip = useMotionTemplate`inset(0 calc(100% - ${rangeEndInset}px) 0 ${rangeStartInset}px${holdsThumb ? ` round ${dims.fillRadiusPx}px` : ""})`;
  const fillClip = isRange
    ? rangeFillClip
    : holdsThumb
      ? isRtl
        ? rtlRoundFillClip
        : ltrRoundFillClip
      : isRtl
        ? rtlFillClip
        : ltrFillClip;

  // The thin knob rail carries only the fill; tick dots would crowd it.
  const ticks =
    showTicks && !isKnob && stepCount > 0 && stepCount <= 50
      ? Array.from(
          { length: stepCount + 1 },
          (_, i) => ((i * normalizedStep) / (normalizedMax - normalizedMin)) * 100,
        )
      : [];

  const handleValueChange = (
    next: number | readonly number[],
    details?: { reason?: string; activeThumbIndex?: number },
  ) => {
    // With both range thumbs on one value, the press can't tell which was meant — it picks
    // by distance, and the two are equally close — but Base UI resolves it from the drag's
    // direction. Hand the grab (its stretch, its tooltip) to the thumb that is actually moving.
    const moving = details?.activeThumbIndex;
    if (details?.reason === "drag" && (moving === 0 || moving === 1) && moving !== draggingIndex) {
      activeThumbIndexRef.current = moving;
      setDraggingIndex(moving);
    }
    const nextValue = isRange
      ? normalizeSliderRange(next, normalizedMin, normalizedMax)
      : normalizeSliderValue(next, normalizedMin, normalizedMax);
    if (!controlled) setInternal(nextValue);
    const nextThumbs = Array.isArray(nextValue) ? nextValue : [nextValue, nextValue];
    follow(0, toVisualPercent(nextThumbs[0]), details?.reason);
    follow(1, toVisualPercent(nextThumbs[1]), details?.reason);
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

  // The shown numbers can be typed into — one per thumb — unless the slider is disabled.
  const editableValue = !disabled;
  const valueName = typeof label === "string" ? label : (ariaLabel ?? "value");
  const editLabel = (index: 0 | 1) =>
    isRange
      ? `Edit ${thumbLabels?.[index] ?? `${valueName} ${index === 0 ? "minimum" : "maximum"}`}`
      : `Edit ${valueName}`;
  // A typed value moves its thumb like any value from outside: it glides there. In a range it
  // can't cross the other thumb; it stops at it.
  const commitTypedValue = (index: number, typed: number) => {
    if (!isRange) return handleValueChange(typed);
    const [low, high] = normalizedThumbValues;
    handleValueChange(index === 0 ? [Math.min(typed, high), high] : [low, Math.max(typed, low)]);
  };
  const renderValue = (className: string) => {
    if (!editableValue) return <BaseSlider.Value className={cn("tabular", className)} />;
    const editable = (index: 0 | 1) => (
      <EditableValue
        index={index}
        value={normalizedThumbValues[index]}
        min={normalizedMin}
        max={normalizedMax}
        step={normalizedStep}
        label={editLabel(index)}
        onCommit={commitTypedValue}
        className={className}
      />
    );
    return isRange ? (
      <span className="inline-flex items-baseline gap-1">
        {editable(0)}
        <span aria-hidden className={className}>–</span>
        {editable(1)}
      </span>
    ) : (
      editable(0)
    );
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
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
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
          {label != null && <span id={labelId} className="text-muted-foreground">{label}</span>}
          {showValue &&
            // `tabular` so the number doesn't reflow the row as its digits change. No
            // `font-mono` — it inherits Geist Sans from the body.
            renderValue("text-foreground")}
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
            isBar ? "rounded-md" : "rounded-full",
          )}
        >
          {/* Fill — the single bar's is a whole box slid along the rail, its straight edge
              the value (see `faderFillX`); otherwise a clip that reaches past a thumb it
              holds, rounded for the circle, or ends at the thumb's centre (knob). */}
          {followFillPx > 0 ? (
            <motion.div
              aria-hidden
              data-slot="slider-fill"
              className={cn("absolute inset-0", FILL_COLOR, BAR_FILL_IN_USE)}
              style={{ x: faderFillX }}
            />
          ) : (
            <motion.div
              aria-hidden
              data-slot="slider-fill"
              className={cn("absolute inset-0", FILL_COLOR, isBar && BAR_FILL_IN_USE)}
              style={{ clipPath: fillClip }}
            />
          )}

          {/* Ticks inset by the thumb's travel inset, so each one lands where the thumb's
              centre lands at that value — otherwise the ticks and the thumb drift apart
              toward the ends. The single bar's marks instead sit where its fill's edge lands
              (see `FaderTick`).

              The shape follows the thumb: round thumbs get dots, and `bar` — whose thumb
              is a thin vertical handle — gets thin vertical lines, so the marks read as
              the same family of object as the thing sliding over them. */}
          <div
            aria-hidden
            data-slot="slider-ticks"
            className={cn(
              "pointer-events-none absolute inset-y-0",
              followFillPx > 0 ? "inset-x-0" : dims.tickInset,
              // The bar shows its marks only while it's in use; at rest it's a rail and a fill.
              isBar && BAR_TICKS_IN_USE,
            )}
          >
            {ticks.map((tp, i) => {
              // A fader's marks sit where the fill's edge lands, across the full width; the
              // end marks would sit on the rail's own edges, so they're left out.
              if (followFillPx > 0 && (tp <= 0.5 || tp >= 99.5)) return null;
              const percent = isRtl ? 100 - tp : tp;
              // Snapped to whole pixels once the control has been measured. A hairline
              // placed at a percentage lands on a fractional device pixel and the browser
              // spreads it across two, so a run of identical ticks renders as a mix of
              // crisp 1px lines and blurred 2px ones. The width is already measured here
              // for the thumb, so rounding costs nothing. Only the *centring* translate
              // stays, and only on the axis the tick has no odd half-pixel on.
              const tickInsetPx = followFillPx > 0 ? 0 : thumbTravelInsetPx;
              const trackPx = Math.max(controlWidth - tickInsetPx * 2, 0);
              // Snapped to the device pixel grid, not the CSS one. On a display scaled to
              // 125% or 150% — the common Windows case — a whole CSS pixel still lands
              // mid-device-pixel, so the browser spreads a hairline across two and the run
              // of ticks comes out as a mix of crisp and blurred. Rounding in device
              // pixels puts every tick on the same boundary, so they all render alike.
              const snap = (px: number) => Math.round(px * pixelRatio) / pixelRatio;
              const hairlinePx = Math.max(1, Math.round(pixelRatio)) / pixelRatio;
              const left =
                trackPx > 0 ? `${snap((percent / 100) * trackPx)}px` : `${percent}%`;
              // The width has to sit on the grid too. `1px` is 1.25 device pixels at 125%
              // scaling, so even a perfectly placed line bleeds a quarter of a pixel into
              // its neighbour and reads as thicker than one that doesn't. Rounding to a
              // whole number of device pixels — never fewer than one — gives every tick
              // the same true hairline.
              const hairline = `${hairlinePx}px`;
              const tickClass = cn(
                // The bar's marks sit quieter: the rail already has an outline and a fill.
                "absolute top-1/2 -translate-y-1/2",
                isBar ? "bg-foreground/10" : "bg-foreground/25",
                dims.tick,
                isBar && BAR_TICK_HEIGHTS[size][barTickLevel(i, stepCount)],
                dims.tickCenterX,
              );
              const tickStyle = { left, ...(dims.tickHairline && { width: hairline }) };

              return followFillPx > 0 ? (
                <FaderTick
                  key={i}
                  percent={percent}
                  position={pos0}
                  width={controlWidth}
                  className={tickClass}
                  style={tickStyle}
                />
              ) : (
                <span key={i} className={tickClass} style={tickStyle} />
              );
            })}
          </div>

          {/* The bar's outline: a hairline around the whole rail in the stronger border
              colour — the default one reads as no border at all against the muted rail. Drawn
              as an overlay above the fill rather than as the rail's own border, so it takes no
              space and the fill, ticks, and thumb keep their exact positions. */}
          {isBar && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border-strong"
            />
          )}
        </div>

        {/* Base UI's thumb: the input lives here for focus, keyboard and ARIA. Hidden,
            because the visual thumb below is what's seen. When opted in, the same thumb
            is the tooltip anchor, so the value popup follows Base UI's real thumb position. */}
        {thumbIndices.map((index) => {
          const bound = index === 0 ? "minimum" : "maximum";
          const boundId = `${labelId}-${bound}`;
          const customLabel = isRange ? thumbLabels?.[index] : undefined;
          const baseThumb = (
            <BaseSlider.Thumb
              key={`slider-thumb-${index}`}
              ref={thumbRefs[index]}
              index={index}
              aria-label={customLabel ?? (isRange
                ? labelledBy ? undefined : [ariaLabel, bound].filter(Boolean).join(" ")
                : ariaLabel)}
              aria-labelledby={customLabel == null && labelledBy
                ? isRange ? `${labelledBy} ${boundId}` : labelledBy
                : undefined}
              className={cn("opacity-0", dims.thumb, isBar && BAR_HIT_WIDTH)}
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
            {isBar ? (
              <BarThumb
                dodged={inline && dodged[index]}
                stretched={!reduceMotion && draggingIndex === index && !(inline && dodged[index])}
                heightPx={dims.thumbHeightPx}
                widthPx={dims.thumbPx}
                reduceMotion={reduceMotion ?? false}
              />
            ) : (
            <motion.div
              data-slot="slider-thumb"
              data-dodged={inline && dodged[index] ? "" : undefined}
              className={cn(
                "absolute inset-0 origin-center bg-foreground shadow-sm",
                // A thin vertical handle, or a round knob the height of the rail.
                dims.thumb,
                "group-has-[[type=range]:focus-visible]:ring-4 group-has-[[type=range]:focus-visible]:ring-ring/40",
              )}
              // A round thumb can't stretch one axis without going oval, so it grabs by
              // growing evenly (the bar stretches; see BarThumb). Keep this on the inner shape
              // so the Motion position wrapper never moves during the resize. Reduced motion
              // drops the scale.
              animate={
                reduceMotion
                  ? { scale: 1 }
                  : { scale: draggingIndex === index ? roundThumbGrabScale : 1 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : SPRING_GRAB
              }
            />
            )}
          </motion.div>
        ))}

        {isRange && (
          <span className="sr-only">
            <span id={`${labelId}-minimum`}>minimum</span>
            <span id={`${labelId}-maximum`}>maximum</span>
          </span>
        )}

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
              <span id={labelId} ref={inlineLabelRef} className="truncate text-foreground">
                {label}
              </span>
            )}
            {showValue && (
              // Dim at rest, full ink while the slider is in use — the number matters most
              // while it is changing.
              // The wrapper carries the measuring ref, so the thumb keeps dodging the number
              // while it is being edited too.
              <span ref={inlineValueRef} className="inline-flex shrink-0">
                {renderValue(INLINE_VALUE_IN_USE)}
              </span>
            )}
          </div>
        )}
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
