"use client";

import { Circle, Copy, Eraser, Highlighter } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import {
  SelectionToolbar,
  SelectionToolbarActionButton,
  SelectionToolbarActionToggle,
  SelectionToolbarButton,
  SelectionToolbarSeparator,
  SelectionToolbarToggle,
  SelectionToolbarToggleGroup,
  useSelectionToolbar,
} from "@/registry/ui/selection-toolbar/selection-toolbar";
import { bool, defineEntry, select } from "../schema";

const SIDES = ["top", "bottom"] as const;
const KINDS = ["basic", "all"] as const;

/**
 * Three highlighter colours, from the ramps rather than the semantic tokens: there is no
 * "highlight green" in the design foundation and there shouldn't be — this is the demo
 * picking pigments, not the library naming a role.
 */
const TONES = {
  amber: {
    swatch: "text-accent-500",
    mark: "bg-accent-300/60 dark:bg-accent-900/70",
  },
  green: {
    swatch: "text-success-500",
    mark: "bg-success-500/25 dark:bg-success-700/40",
  },
  red: {
    swatch: "text-danger-500",
    mark: "bg-danger-300/50 dark:bg-danger-900/60",
  },
} as const;

type Tone = keyof typeof TONES;

const PARAGRAPHS = [
  "Select any of this text and a small bar appears over it. It is the tooltip's material — the same fill, the same hairline, the same drop shadow — holding two ghost buttons, because a selection toolbar is an annotation on what you just did rather than a panel you opened.",
  "The bar is anchored to the selection itself rather than to any element, so it follows the text as the page scrolls, and it waits for you to let go of the mouse before it appears. Pressing an action dismisses it: the selection has been acted on, and a bar that lingers over it is just something else to close.",
];

/** A highlighted span, as character offsets into one paragraph's text. */
interface Span {
  paragraph: number;
  start: number;
  end: number;
  tone: Tone;
}

/**
 * Where `range` falls inside `element`, as offsets into that element's plain text.
 *
 * Offsets rather than the matched string, because a string is ambiguous: highlight one
 * letter and every other copy of that letter lights up too. The range knows *which* "e"
 * you meant, so the demo has to carry that through rather than throw it away and search
 * for the text again.
 *
 * A selection that starts before the paragraph or ends after it is clipped to the
 * paragraph's own bounds, which is what makes a selection across both paragraphs land as
 * two spans instead of nothing.
 */
function spanIn(element: Element, range: Range): { start: number; end: number } | null {
  if (!range.intersectsNode(element)) return null;

  const whole = document.createRange();
  whole.selectNodeContents(element);

  const clipped = range.cloneRange();
  if (!element.contains(clipped.startContainer)) {
    clipped.setStart(whole.startContainer, whole.startOffset);
  }
  if (!element.contains(clipped.endContainer)) {
    clipped.setEnd(whole.endContainer, whole.endOffset);
  }

  const text = clipped.toString();
  if (!text.trim()) return null;

  const before = document.createRange();
  before.setStart(whole.startContainer, whole.startOffset);
  before.setEnd(clipped.startContainer, clipped.startOffset);
  const start = before.toString().length;

  return { start, end: start + text.length };
}

/**
 * Every span a range covers, found from the range itself rather than from a ref into the
 * prose. The range already knows which document it points at, so walking up to the region
 * and back down to its paragraphs costs nothing and leaves this callable during a render.
 */
function spansOf(range: Range | null, tone: Tone): Span[] {
  if (!range) return [];

  const node = range.commonAncestorContainer;
  const element = node instanceof Element ? node : node.parentElement;
  const region = element?.closest('[data-slot="selection-toolbar-region"]');
  if (!region) return [];

  const found: Span[] = [];
  region.querySelectorAll("p").forEach((paragraph, index) => {
    const span = spanIn(paragraph, range);
    if (span) found.push({ paragraph: index, tone, ...span });
  });
  return found;
}

/** Whether any of `probes` lands on text that is already highlighted. */
function overlaps(spans: Span[], probes: Span[]): boolean {
  return probes.some((probe) =>
    spans.some(
      (span) =>
        span.paragraph === probe.paragraph && span.start < probe.end && probe.start < span.end,
    ),
  );
}

/** The spans with `cuts` taken out of them, splitting any span a cut lands in the middle of. */
function without(spans: Span[], cuts: Span[]): Span[] {
  return cuts.reduce(
    (rest, cut) =>
      rest.flatMap((span) => {
        if (span.paragraph !== cut.paragraph || cut.end <= span.start || span.end <= cut.start) {
          return [span];
        }
        const parts: Span[] = [];
        if (span.start < cut.start) parts.push({ ...span, end: cut.start });
        if (cut.end < span.end) parts.push({ ...span, start: cut.end });
        return parts;
      }),
    spans,
  );
}

/**
 * Splits one paragraph into plain text and `<mark>`s, merging spans that touch and share a
 * colour. Two colours that overlap don't merge — the later one simply wins the overlap,
 * which is what a highlighter does.
 */
function marked(text: string, spans: Span[], paragraph: number): ReactNode[] {
  const mine = spans
    .filter((span) => span.paragraph === paragraph)
    .sort((a, b) => a.start - b.start);
  if (mine.length === 0) return [text];

  const merged: { start: number; end: number; tone: Tone }[] = [];
  for (const span of mine) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end && last.tone === span.tone) {
      last.end = Math.max(last.end, span.end);
    } else if (last && span.start < last.end) {
      last.end = span.start;
      merged.push({ ...span });
    } else {
      merged.push({ ...span });
    }
  }

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const span of merged) {
    if (span.end <= cursor) continue;
    if (span.start > cursor) out.push(text.slice(cursor, span.start));
    out.push(
      <mark
        key={`${span.start}-${span.tone}`}
        className={cn("rounded-sm text-foreground", TONES[span.tone].mark)}
      >
        {text.slice(Math.max(span.start, cursor), span.end)}
      </mark>,
    );
    cursor = span.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));

  return out;
}

export const selectionToolbarEntry = defineEntry({
  slug: "selection-toolbar",
  name: "Selection Toolbar",
  controls: {
    side: select(SIDES, "top"),
    kinds: select(KINDS, "all", "Items"),
    labels: bool(true, "Labels"),
    disabled: bool(false, "Disabled"),
  },
  render({ side, kinds, labels, disabled }) {
    return (
      <SelectionToolbarDemo side={side} kinds={kinds} labels={labels} disabled={disabled} />
    );
  },
});

function SelectionToolbarDemo({
  side,
  kinds,
  labels,
  disabled,
}: {
  side: (typeof SIDES)[number];
  kinds: (typeof KINDS)[number];
  labels: boolean;
  disabled: boolean;
}) {
  const [spans, setSpans] = useState<Span[]>([]);
  const [tone, setTone] = useState<Tone>("amber");

  /**
   * Drop the selection once an action has read it, because the nodes it points into are
   * about to be replaced by the re-render. The browser then remaps its boundaries onto
   * whatever ends up in those positions, which shows up as the highlight "jumping" to a
   * stretch of text nobody selected. Measure first, then let go.
   */
  const release = () => document.getSelection()?.removeAllRanges();

  // Icon-only below `sm`: the button becomes a square rather than a text button with
  // nothing in it, and the name it lost moves to `aria-label` — never optional.
  const size = labels ? "sm" : "icon-sm";
  const named = (label: string) => (labels ? undefined : label);

  return (
    // `self-start` pins the demo to the top of the preview box, which centres its demo —
    // right for a fixed-height component, wrong for a column of prose that has to be tall
    // enough to select through.
    <div className="flex w-full max-w-lg flex-col gap-3 self-start">
      <SelectionToolbar
        side={side}
        disabled={disabled}
        className="flex flex-col gap-3 text-sm text-pretty text-muted-foreground"
        actions={
          <>
            {/* Async, so the confirmation is drawn where the press happened. This is the
                one action that must not dismiss the bar — a check on a surface that has
                already gone is no confirmation at all. */}
            <SelectionToolbarActionButton
              size={size}
              aria-label={named("Copy")}
              icon={<Copy />}
              action={(text) => navigator.clipboard.writeText(text)}
            >
              {labels && "Copy"}
            </SelectionToolbarActionButton>

            {kinds === "basic" ? (
              <SelectionToolbarButton
                size={size}
                aria-label={named("Highlight")}
                onAction={(_text, range) => {
                  setSpans((current) => [...current, ...spansOf(range, tone)]);
                  release();
                }}
              >
                <Highlighter />
                {labels && "Highlight"}
              </SelectionToolbarButton>
            ) : (
              <>
                <SelectionToolbarSeparator />

                <HighlightToggle
                  spans={spans}
                  tone={tone}
                  labels={labels}
                  onChange={(next) => {
                    setSpans(next);
                    release();
                  }}
                />

                {/* An exclusive run: the colour the highlighter uses, which is a setting
                    rather than an action, so it holds across selections. `fillIcon` fills
                    the ring rather than swapping the glyph — same shape, more weight. */}
                <SelectionToolbarToggleGroup
                  value={[tone]}
                  onValueChange={([next]) => next && setTone(next as Tone)}
                >
                  {(Object.keys(TONES) as Tone[]).map((key) => (
                    <SelectionToolbarToggle
                      key={key}
                      value={key}
                      size="icon-sm"
                      fillIcon
                      aria-label={`${key.slice(0, 1).toUpperCase()}${key.slice(1)} highlighter`}
                    >
                      <Circle className={TONES[key].swatch} />
                    </SelectionToolbarToggle>
                  ))}
                </SelectionToolbarToggleGroup>

                <SelectionToolbarSeparator />

                <SelectionToolbarButton
                  size={size}
                  variant="destructive"
                  aria-label={named("Clear")}
                  disabled={spans.length === 0}
                  onAction={() => setSpans([])}
                >
                  <Eraser />
                  {labels && "Clear"}
                </SelectionToolbarButton>
              </>
            )}
          </>
        }
      >
        {PARAGRAPHS.map((paragraph, index) => (
          <p key={paragraph}>{marked(paragraph, spans, index)}</p>
        ))}
      </SelectionToolbar>
    </div>
  );
}

/**
 * Highlight as a toggle whose state has to be earned.
 *
 * It's a separate component for one reason: a toggle has to know whether the text under it
 * is *already* highlighted, and that means reading the selection the bar opened on. This
 * element is created out in the demo but renders inside the bar, so `useSelectionToolbar`
 * reads the right context — which is what that hook is for, and the only way to build a bar
 * item whose state depends on the selection.
 */
function HighlightToggle({
  spans,
  tone,
  labels,
  onChange,
}: {
  spans: Span[];
  tone: Tone;
  labels: boolean;
  onChange: (next: Span[]) => void;
}) {
  const { range } = useSelectionToolbar();
  const here = spansOf(range, tone);
  const pressed = overlaps(spans, here);

  return (
    <SelectionToolbarActionToggle
      size={labels ? "sm" : "icon-sm"}
      aria-label={labels ? undefined : "Highlight"}
      icon={<Highlighter />}
      fillIcon
      pressed={pressed}
      // Stands in for the round trip this variant exists for: the state isn't real until
      // the work says so, and a demo has nothing genuine to wait on.
      action={() => new Promise((resolve) => setTimeout(resolve, 450))}
      onPressedChange={(next) => onChange(next ? [...spans, ...here] : without(spans, here))}
    >
      {labels && "Highlight"}
    </SelectionToolbarActionToggle>
  );
}
