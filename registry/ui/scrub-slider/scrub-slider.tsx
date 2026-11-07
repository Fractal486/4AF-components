"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from "@base-ui/react/internals/createBaseUIEventDetails";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/registry/lib/cn";
import {
  clampOffset,
  clampOffsetAtPointer,
  clamp,
  edgeSpeed,
  lastTick,
  lensAt,
  offsetKeepingInView,
  snapValue,
  tickLevel,
  tickOfValue,
  valueAtTick,
  type ScrubScale,
  stepPrecision,
} from "./scrub-slider-geometry";
import {
  scrubSliderContentVariants,
  scrubSliderIndicatorVariants,
  scrubSliderInputVariants,
  scrubSliderLabelVariants,
  scrubSliderRulerVariants,
  scrubSliderStepperVariants,
  scrubSliderTickVariants,
  scrubSliderTicksVariants,
  scrubSliderUnitVariants,
  scrubSliderValueVariants,
  scrubSliderVariants,
} from "./scrub-slider.variants";

/**
 * A scrub slider: a card with a label and a value that you drag anywhere to change.
 *
 * Behaviour that Base UI has is Base UI's: a visually hidden `<input type="range">` carries
 * focus, the keyboard map (arrows, Shift and PageUp/Down large steps, Home/End), ARIA, form
 * integration and RTL. Base UI has no relative scrub, so the pointer gesture is ours.
 *
 * The ruler is a fixed scale. A press sets the value to the tick under the pointer, as a
 * press on a slider's track does, without moving the ruler; dragging then moves the value
 * one step per tick the pointer crosses. A press released without moving is a click instead:
 * it opens the number for typing, with the ruler hidden. Near either
 * end of the ruler, the ruler scrolls under a resting pointer and the value keeps changing,
 * faster the deeper into the edge and the longer it stays there.
 *
 * With `indicator="fixed"` the indicator instead stays at the ruler's centre and a drag
 * moves the ruler under it, as if pulling a tape past a fixed mark: there is no press-to-set
 * and no edge zone, and the value is whatever tick sits under the line.
 *
 * Ticks near the indicator grow and brighten, falling off with distance, like the site
 * rail's lens.
 */

/**
 * The ruler's pixel geometry by size, matching `scrub-slider.variants.ts`: tick spacing,
 * each tick level's resting height, and the height the lens lifts the centre tick to. The
 * ruler itself is 16px tall at `md` and 14px at `sm`; the indicator fills it.
 */
const DIMS = {
  md: { spacing: 6, heights: [4, 6, 8], lensHeight: 10, rulerHeight: 16 },
  sm: { spacing: 5, heights: [3, 5, 7], lensHeight: 9, rulerHeight: 14 },
} as const;

/** Resting opacity by tick level, and the opacity the lens lifts a tick to. */
const TICK_OPACITY = [0.14, 0.22, 0.32] as const;
const LENS_OPACITY = 0.46;

/** How long the ruler stays up after a chevron nudge, from the last click. */
const NUDGE_SHOW_MS = 1000;

/** How far a press has to move before it scrubs; released sooner, it was a click. */
const DRAG_THRESHOLD_PX = 3;

/** One pass of the edge loop can't move further than this, so a stalled frame doesn't leap. */
const MAX_FRAME_SECONDS = 0.05;

type ChangeDetails = BaseSlider.Root.ChangeEventDetails;
type CommitDetails = BaseSlider.Root.CommitEventDetails;

export interface ScrubSliderProps
  extends Omit<
    ComponentProps<typeof BaseSlider.Root>,
    "value" | "defaultValue" | "onValueChange" | "onValueCommitted" | "orientation" | "children" | "minStepsBetweenValues" | "thumbAlignment" | "thumbCollisionBehavior"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number, details: ChangeDetails) => void;
  /** Runs when a drag ends with a changed value, or a keyboard change commits. */
  onValueCommitted?: (value: number, details: CommitDetails) => void;
  /** Shown at the start of the card, and the slider's accessible name. */
  label?: ReactNode;
  /** Shown after the value, in a quieter ink. */
  unit?: ReactNode;
  /** Spoken value: `(formattedValue, value) => string`. Defaults to the value and a text unit. */
  getAriaValueText?: (formattedValue: string, value: number) => string;
  size?: "md" | "sm";
  /** `card` (a faint fill), `outline-ghost` (an edge alone), or `plain` (neither). */
  variant?: "card" | "outline-ghost" | "plain";
  /**
   * `card` stacks the label and value over a ruler that shows on hover and in use. `inline`
   * is one row for dense panels: an always-visible ruler, its indicator resting at half
   * height, then the value. Inline, `label` only names the slider; place a visible label
   * beside it.
   */
  layout?: "card" | "inline";
  /** The one-step chevrons either side of the value. */
  chevrons?: boolean;
  /**
   * `sliding`: the indicator follows the pointer over a ruler that stays put. `fixed`: the
   * indicator always shows at the centre and a drag slides the ruler behind it.
   */
  indicator?: "sliding" | "fixed";
}

/** Where a pointer is along the ruler, from its inline-start edge. */
function logicalX(clientX: number, rect: DOMRect, rtl: boolean) {
  return rtl ? rect.right - clientX : clientX - rect.left;
}

interface DragState {
  pointerId: number;
  rect: DOMRect;
  /** The pointer's position on the ruler, before the value bounds clamp the indicator. */
  pointer: number;
  head: number;
  offset: number;
  start: number;
  last: number;
  dwell: number;
  frame: number;
  scrolling: boolean;
  event: PointerEvent;
  target: Element;
  /** Fixed indicator: where the drag started, and the offset the ruler had then. */
  origin: number;
  originOffset: number;
}

export function ScrubSlider({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  largeStep = 10,
  label,
  unit,
  format,
  locale,
  disabled = false,
  getAriaValueText,
  size = "md",
  variant = "card",
  layout = "card",
  chevrons = true,
  indicator = "sliding",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onPointerDown: onPointerDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerUp: onPointerUpProp,
  onPointerCancel: onPointerCancelProp,
  onLostPointerCapture: onLostPointerCaptureProp,
  onPointerEnter: onPointerEnterProp,
  onPointerLeave: onPointerLeaveProp,
  ...props
}: ScrubSliderProps) {
  const dims = DIMS[size];
  const centred = indicator === "fixed";
  const rtl = useDirection() === "rtl";
  const scale: ScrubScale = useMemo(() => ({ min, max, step }), [min, max, step]);
  const endTick = lastTick(scale);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => snapValue(defaultValue ?? min, scale));
  const current = clamp(controlled ? value : internal, min, max);
  const currentTick = tickOfValue(current, scale);
  // The value as last set, read by the drag loop between renders.
  const valueRef = useRef(current);
  useLayoutEffect(() => {
    valueRef.current = current;
  }, [current]);

  const labelId = useId();
  const rulerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drag = useRef<DragState | null>(null);

  const [width, setWidth] = useState(0);
  /** The tick at the ruler's start edge; `null` until the ruler is measured. */
  const [offset, setOffset] = useState<number | null>(null);
  /** The indicator's position while dragging; otherwise it sits on the value's tick. */
  const [head, setHead] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  /** Set for a moment after a chevron nudge, to show where the value went. */
  const [nudged, setNudged] = useState(false);
  const nudgeTimer = useRef(0);
  /** The typed text while the number is being edited; `null` otherwise. */
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  // Set once the editor has committed or been canceled, so a blur fired as the input goes
  // away doesn't commit the draft a second time.
  const editClosed = useRef(false);
  const editOpenedBy = useRef<"pointer" | "keyboard">("pointer");

  useLayoutEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const measure = () => setWidth(ruler.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, []);

  // Outside a drag, keep the value's tick on screen and clear of the edges; the first
  // measurement centres it. Adjusted during render, so a keyboard step and the scroll it
  // causes land in the same frame.
  // A fixed indicator always has the value's tick under it, at the centre.
  const centreTicks = width / dims.spacing / 2;
  const settledOffset =
    dragging || width <= 0
      ? offset
      : centred
        ? currentTick - centreTicks
        : clampOffset(
          offset === null
            ? currentTick - width / dims.spacing / 2
            : offsetKeepingInView(offset, currentTick, width, dims.spacing),
          width,
          dims.spacing,
          scale,
        );
  if (settledOffset !== offset) setOffset(settledOffset);

  useEffect(
    () => () => {
      cancelAnimationFrame(drag.current?.frame ?? 0);
      window.clearTimeout(nudgeTimer.current);
    },
    [],
  );

  const precision = stepPrecision(scale);
  // Every value shows the step's full precision (1.40, not 1.4), so with tabular figures the
  // number keeps its width as it changes. A `format` that sets fraction digits itself wins.
  const resolvedFormat = useMemo<Intl.NumberFormatOptions>(
    () =>
      format?.minimumFractionDigits !== undefined || format?.maximumFractionDigits !== undefined
        ? format
        : { ...format, minimumFractionDigits: precision, maximumFractionDigits: precision },
    [format, precision],
  );
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, resolvedFormat),
    [locale, resolvedFormat],
  );
  const formatted = formatter.format(current);

  /** Applies a value from the pointer. Returns false when the change was canceled. */
  const change = (next: number, state: DragState, reason: "drag" | "track-press") => {
    if (next === valueRef.current) return true;
    const details = createChangeEventDetails(reason, state.event, state.target, {
      activeThumbIndex: 0,
    });
    onValueChange?.(next, details);
    if (details.isCanceled) return false;
    valueRef.current = next;
    if (!controlled) setInternal(next);
    return true;
  };

  /** Places the indicator under the pointer, within the scale, and reads the value there. */
  const follow = (state: DragState, reason: "drag" | "track-press" = "drag") => {
    const startX = -state.offset * dims.spacing;
    const endX = (endTick - state.offset) * dims.spacing;
    state.head = clamp(state.pointer, Math.max(0, startX), Math.min(state.rect.width, endX));
    change(valueAtTick(state.offset + state.head / dims.spacing, scale), state, reason);
    setHead(state.head);
  };

  const loop = (now: number) => {
    const state = drag.current;
    if (!state) return;
    const seconds = clamp((now - state.last) / 1000, 0, MAX_FRAME_SECONDS);
    state.last = now;
    const speed = edgeSpeed(state.pointer, state.rect.width, state.dwell);
    const before = state.offset;
    if (speed !== 0) {
      state.dwell += seconds;
      state.offset = clampOffsetAtPointer(
        state.offset + speed * seconds,
        state.pointer,
        state.rect.width,
        dims.spacing,
        scale,
      );
    } else {
      state.dwell = 0;
    }
    const moved = state.offset !== before;
    if (moved) {
      setOffset(state.offset);
      follow(state);
    }
    if (moved !== state.scrolling) {
      state.scrolling = moved;
      setScrolling(moved);
    }
    state.frame = requestAnimationFrame(loop);
  };

  /**
   * A press is a click until the pointer moves `DRAG_THRESHOLD_PX` from where it went down:
   * released before then, it opens the number for typing; moved past it, it scrubs.
   */
  const press = useRef<{ pointerId: number; clientX: number; onValue: boolean } | null>(null);
  const valueElement = useRef<HTMLSpanElement>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // `data-disabled` also covers a slider disabled by its Base UI `Field.Root`.
    const blocked = disabled || event.currentTarget.hasAttribute("data-disabled");
    // While editing, a press on the card only ends the edit, which the input's blur does.
    if (blocked || editing || event.button !== 0 || !event.isPrimary || drag.current || press.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const onValue = valueElement.current?.contains(event.target as Node) ?? false;
    // Inline, a press on the ruler can't become an edit, so it scrubs at once: the ruler
    // activates on the press, and a release in place commits the value it set.
    if (layout === "inline" && !onValue) return startDrag(event, event.clientX);
    press.current = { pointerId: event.pointerId, clientX: event.clientX, onValue };
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, startClientX: number) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    // As Base UI's own control does: keep focus on an already focused input, and otherwise
    // focus it a frame later, after the browser has handled the press's own focus change.
    const input = inputRef.current;
    if (!input || input.ownerDocument.activeElement !== input) {
      requestAnimationFrame(() => input?.focus({ preventScroll: true }));
    }

    const rect = ruler.getBoundingClientRect();
    const pressed = clamp(logicalX(startClientX, rect, rtl), 0, rect.width);
    const state: DragState = {
      pointerId: event.pointerId,
      rect,
      pointer: pressed,
      head: pressed,
      // The ruler stays where it is; only before it has ever been measured is there nothing
      // to keep, and then the value's tick is placed under the pointer.
      offset: offset ?? currentTick - pressed / dims.spacing,
      start: current,
      last: event.timeStamp,
      dwell: 0,
      frame: 0,
      scrolling: false,
      event: event.nativeEvent,
      target: event.currentTarget,
      origin: logicalX(startClientX, rect, rtl),
      originOffset: offset ?? currentTick - pressed / dims.spacing,
    };
    if (centred) {
      // Nothing changes on the press: the line already reads the value.
      state.offset = state.originOffset = offset ?? currentTick - rect.width / dims.spacing / 2;
    }
    drag.current = state;
    valueRef.current = current;
    setWidth(rect.width);
    setOffset(state.offset);
    setDragging(true);
    if (centred) return slide(state, event.clientX);
    // The value is set where the press went down, the indicator stopping at `min` or `max`,
    // and then follows the pointer from there.
    follow(state, "track-press");
    state.pointer = clamp(logicalX(event.clientX, rect, rtl), 0, rect.width);
    follow(state);
    state.frame = requestAnimationFrame(loop);
  };

  /**
   * Fixed indicator: moves the ruler with the pointer, one tick per tick travelled, keeping an
   * end of the scale from passing the centre line, and reads the value under the line.
   */
  const slide = (state: DragState, clientX: number) => {
    const centre = state.rect.width / dims.spacing / 2;
    const travelled = (logicalX(clientX, state.rect, rtl) - state.origin) / dims.spacing;
    state.offset = clamp(state.originOffset - travelled, -centre, endTick - centre);
    setOffset(state.offset);
    change(valueAtTick(state.offset + centre, scale), state, "drag");
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pending = press.current;
    if (pending && event.pointerId === pending.pointerId) {
      if (Math.abs(event.clientX - pending.clientX) < DRAG_THRESHOLD_PX) return;
      press.current = null;
      if (event.currentTarget.hasAttribute("data-disabled")) return;
      return startDrag(event, pending.clientX);
    }
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (event.currentTarget.hasAttribute("data-disabled")) return end(event, false);
    state.event = event.nativeEvent;
    if (centred) return slide(state, event.clientX);
    state.pointer = clamp(logicalX(event.clientX, state.rect, rtl), 0, state.rect.width);
    follow(state);
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const pending = press.current;
    if (pending && event.pointerId === pending.pointerId) {
      press.current = null;
      // A click, not a canceled or interrupted press, opens the editor.
      // A click opens the editor: anywhere on the card, only the number inline (a press on
      // the inline ruler never gets here; it scrubs from the start).
      if (commit && event.type === "pointerup") openEditor("pointer");
      return;
    }
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    cancelAnimationFrame(state.frame);
    drag.current = null;
    setDragging(false);
    setScrolling(false);
    setHead(null);
    if (commit && valueRef.current !== state.start) {
      onValueCommitted?.(valueRef.current, createGenericEventDetails("drag", event.nativeEvent));
    }
  };

  const openEditor = (by: "pointer" | "keyboard") => {
    editClosed.current = false;
    editOpenedBy.current = by;
    setHovered(false);
    setDraft(valueRef.current.toFixed(precision));
  };

  /** Commits the typed value, clamped and snapped to the step; unreadable text is dropped. */
  const commitEdit = (event: Event) => {
    if (draft === null) return;
    const typed = Number(draft.trim().replace(",", "."));
    const closed = editClosed.current;
    editClosed.current = true;
    setDraft(null);
    if (closed || draft.trim() === "" || !Number.isFinite(typed)) return;
    applyValue(snapValue(typed, scale), event);
  };

  /** Sets and commits a value from the editor or a stepper, which change it in one go. */
  const applyValue = (next: number, event: Event, trigger?: Element) => {
    if (next === valueRef.current) return;
    const details = createChangeEventDetails("none", event, trigger, { activeThumbIndex: 0 });
    onValueChange?.(next, details);
    if (details.isCanceled) return;
    valueRef.current = next;
    if (!controlled) setInternal(next);
    onValueCommitted?.(next, createGenericEventDetails("none", event));
  };

  /** One step down or up from a chevron. */
  const nudge = (direction: -1 | 1, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (disabled || event.currentTarget.getAttribute("aria-disabled") === "true") return;
    applyValue(snapValue(valueRef.current + direction * step, scale), event.nativeEvent, event.currentTarget);
    // Show the ruler with a short indicator gliding to the new tick, then let it fade.
    setNudged(true);
    window.clearTimeout(nudgeTimer.current);
    nudgeTimer.current = window.setTimeout(() => setNudged(false), NUDGE_SHOW_MS);
  };

  /**
   * Hands focus back to the slider, so the keyboard carries on from the edited value. An edit
   * opened by a click returns without the focus ring (and so without the ruler); one opened
   * from the keyboard shows where focus went.
   */
  const refocus = () =>
    inputRef.current?.focus({
      preventScroll: true,
      focusVisible: editOpenedBy.current === "keyboard",
    } as FocusOptions);

  // A keyboard step from Base UI's input.
  const handleKeyboardChange = (next: number | readonly number[], details: ChangeDetails) => {
    const nextValue = snapValue(Array.isArray(next) ? next[0]! : (next as number), scale);
    onValueChange?.(nextValue, details);
    if (details.isCanceled) return;
    valueRef.current = nextValue;
    if (!controlled) setInternal(nextValue);
  };

  const active = (dragging || focusVisible) && !editing;
  const ready = offset !== null && width > 0;
  const view = offset ?? 0;
  const indicatorX = centred ? width / 2 : (head ?? (currentTick - view) * dims.spacing);
  const physical = (x: number) => (rtl ? width - x : x);

  const ticks: ReactNode[] = [];
  if (ready) {
    // The ruler ends at `min` and `max`.
    const first = Math.max(0, Math.ceil(view - 1));
    const last = Math.min(endTick, Math.floor(view + width / dims.spacing + 1));
    for (let tick = first; tick <= last; tick++) {
      const x = (tick - view) * dims.spacing;
      const level = tickLevel(tick, scale);
      // The lens belongs to the indicator, so a hover preview shows the plain ruler.
      const lens = active ? lensAt(x - indicatorX, dims.spacing) : 0;
      const rest = dims.heights[level];
      const height = rest + lens * (dims.lensHeight - rest);
      const opacity = TICK_OPACITY[level] + lens * (LENS_OPACITY - TICK_OPACITY[level]);
      ticks.push(
        <span
          key={tick}
          data-level={level}
          className={scrubSliderTickVariants()}
          style={{
            translate: `${physical(x) - 0.5}px 0`,
            scale: `1 ${height / dims.rulerHeight}`,
            opacity,
          }}
        />,
      );
    }
  }

  const valueName = typeof label === "string" ? label : (ariaLabel ?? "value");
  /**
   * A chevron that nudges the value one step. Out of the tab order, since the arrow keys
   * already step, and its press is kept from the card, so it never scrubs or opens the
   * editor. `aria-disabled` rather than `disabled` at a bound: a disabled button can drop its
   * pointer events, which would then reach the card.
   */
  const stepper = (direction: -1 | 1) => {
    const atBound = direction < 0 ? current <= min : current >= max;
    const Icon = direction < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        tabIndex={-1}
        data-slot={direction < 0 ? "scrub-slider-decrement" : "scrub-slider-increment"}
        aria-label={`${direction < 0 ? "Decrease" : "Increase"} ${valueName}`}
        aria-disabled={disabled || atBound || undefined}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => nudge(direction, event)}
        className={scrubSliderStepperVariants({ size })}
      >
        {/* Points the way the value moves, which flips in RTL. */}
        <Icon aria-hidden className="rtl:-scale-x-100" />
      </button>
    );
  };

  const spokenUnit = typeof unit === "string" || typeof unit === "number" ? ` ${unit}` : "";

  return (
    <BaseSlider.Root
      value={current}
      onValueChange={handleKeyboardChange}
      onValueCommitted={(next, details) =>
        onValueCommitted?.(Array.isArray(next) ? next[0]! : (next as number), details)
      }
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={resolvedFormat}
      locale={locale}
      disabled={disabled}
      data-slot="scrub-slider"
      data-variant={variant}
      data-layout={layout}
      data-indicator={indicator}
      data-active={active ? "" : undefined}
      data-hovered={hovered && !active && !editing ? "" : undefined}
      data-editing={editing ? "" : undefined}
      data-nudged={nudged && !active && !editing ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      data-scrolling={scrolling ? "" : undefined}
      className={
        typeof className === "function"
          ? (state) => cn(scrubSliderVariants({ layout, size, variant }), className(state))
          : cn(scrubSliderVariants({ layout, size, variant }), className)
      }
      {...props}
      onPointerDown={(event) => {
        onPointerDownProp?.(event);
        if (!event.defaultPrevented) onPointerDown(event);
      }}
      // Mouse and pen only: a touch has no hover, and would leave the ruler showing.
      onPointerEnter={(event) => {
        onPointerEnterProp?.(event);
        const blocked = disabled || event.currentTarget.hasAttribute("data-disabled");
        if (event.pointerType !== "touch" && !blocked) setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeaveProp?.(event);
        setHovered(false);
      }}
      onPointerMove={(event) => {
        onPointerMoveProp?.(event);
        onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUpProp?.(event);
        end(event, true);
      }}
      onPointerCancel={(event) => {
        onPointerCancelProp?.(event);
        end(event, false);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCaptureProp?.(event);
        end(event, true);
      }}
    >
      <div data-slot="scrub-slider-content" className={scrubSliderContentVariants({ layout, size })}>
        {label != null && (
          <span
            id={labelId}
            data-slot="scrub-slider-label"
            className={layout === "inline" ? "sr-only" : scrubSliderLabelVariants({ size })}
          >
            {label}
          </span>
        )}
        <span className="ms-auto flex shrink-0 items-center gap-1">
        {chevrons && stepper(-1)}
        <span
          ref={valueElement}
          data-slot="scrub-slider-value"
          className={scrubSliderValueVariants({ layout, size })}
        >
          {editing ? (
            <input
              autoFocus
              data-slot="scrub-slider-input"
              aria-label={`Edit ${valueName}`}
              inputMode="decimal"
              value={draft}
              size={Math.max(draft.length, 1)}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => commitEdit(event.nativeEvent)}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                // Kept from the slider, whose keys would otherwise step the value as well.
                event.stopPropagation();
                if (event.key === "Enter") {
                  commitEdit(event.nativeEvent);
                  refocus();
                }
                if (event.key === "Escape") {
                  editClosed.current = true;
                  setDraft(null);
                  refocus();
                }
              }}
              // Sized to the text where `field-sizing` is supported; `size` covers the rest.
              style={{ fieldSizing: "content" } as CSSProperties}
              className={scrubSliderInputVariants()}
            />
          ) : (
            <span>{formatted}</span>
          )}
          {unit != null && (
            <span data-slot="scrub-slider-unit" className={scrubSliderUnitVariants({ size })}>
              {unit}
            </span>
          )}
        </span>
        {chevrons && stepper(1)}
        </span>
      </div>

      <div
        ref={rulerRef}
        aria-hidden
        data-slot="scrub-slider-ruler"
        className={scrubSliderRulerVariants({ layout, size })}
      >
        <div data-slot="scrub-slider-ticks" className={scrubSliderTicksVariants({ layout })}>
          {ticks}
        </div>
        {ready && (
          <span
            data-slot="scrub-slider-indicator"
            className={scrubSliderIndicatorVariants({ layout, indicator })}
            style={{ translate: `${physical(indicatorX) - 1}px 0` }}
          />
        )}
      </div>

      {/* Base UI's thumb: the hidden range input lives here for focus, keyboard and ARIA. It
          covers the card so a screen reader's focus outline matches it, and takes no
          pointer input, which belongs to the card. */}
      <BaseSlider.Thumb
        data-slot="scrub-slider-thumb"
        inputRef={inputRef}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel == null ? (ariaLabelledBy ?? (label != null ? labelId : undefined)) : undefined}
        getAriaValueText={(text, number) =>
          getAriaValueText ? getAriaValueText(text, number) : `${text}${spokenUnit}`
        }
        className="pointer-events-none"
        style={{ position: "absolute", inset: 0, insetInlineStart: 0, translate: "none", width: "100%", height: "100%" }}
        onFocus={(event) => setFocusVisible(matchesFocusVisible(event.target))}
        onKeyDown={(event) => {
          // Enter types a value, as a click on the card does.
          if (event.key !== "Enter" || disabled) return;
          event.preventDefault();
          openEditor("keyboard");
        }}
        onBlur={() => setFocusVisible(false)}
      />
    </BaseSlider.Root>
  );
}

function matchesFocusVisible(element: Element) {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
}
