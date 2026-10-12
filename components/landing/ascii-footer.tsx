"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * The 4AF logo (`app/icon.png`) as ASCII art: sampled at 52 columns with rows halved for the
 * monospace aspect ratio, brighter pixels mapped to denser characters (" .:-=+*#%@").
 */
const LINES = [
  "                       ..  --..",
  "                     .#@%%#@@@%#+",
  "                    -%@@@@@@@@@@+ .",
  "                   -@@@@@@@@@@@==%@*",
  "                  =@@@@@@@@@@%: .#%+",
  "                 =@@@@@@@@@@%: ---=--.",
  "                -@@@@@@@@@@@- .%@@@@@=",
  "               =@@@@@@@@@@%-   .-----.",
  "              +@@@@@@@@@@#: =*#***+++**-",
  "             =@@@@@@@@@@#.  +@@@@@@@@@@#.",
  "            -@@@@@@@@@@*.  ..:-:::::---.",
  "           :%@@@@@@@@@%  +@@@@@@@@%@@@@@@*",
  "          -%@@@@@@@@@#:  -############*##*",
  "         =@@@@@@@@@@*  :-::::::::::::::--=-:",
  "        =@@@@@@@@@@#. *@@@@@@@@@@@@@@@@@@@@*",
  "       -@@@@@@@@@@#.  .+++============-=+==.",
  "      -%@@@@@@@@@#..-==-----------------=++*-.",
  "     -@@@@@@@@@@*. +@@@@@@@@@@@@@@@@@@@@@@@@%=",
  "    =@@@@@@@@@@#   :=--:--:------------:::::.",
  "  :*@@@@@@@@@@#..=+====++++*****+++++++++++++*+-",
  "   +@@@@@@@@%#: -%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.",
  "   .=**+==-:.    ..:::::::::::::::::::::::::.:::",
];

/** The field is wider than any main area, and clipped by the band. */
const FIELD_COLS = 220;
/** Empty rows above and below the logo. */
const PAD_ROWS = 6;
/** The logo's left edge, in columns: about the width of the page's content gutter. */
const LOGO_COL = 8;
const FIELD_ROWS = LINES.length + PAD_ROWS * 2;

/** Rows over which the texture fades out toward the band's top and bottom. */
const FADE_ROWS = 7;

/** The texture's opacity on a row: full in the middle, thinning toward both edges. */
function rowOpacity(y: number) {
  const fromEdge = Math.min(y, FIELD_ROWS - 1 - y);
  const t = Math.min(1, (fromEdge + 1) / (FADE_ROWS + 1));
  return t * t * (3 - 2 * t);
}

/** The dim texture behind the logo, weighted toward dots. */
const TEXTURE = "..........::::::--=  ";

/** A fixed pseudo-random value per cell, so the server and the client draw the same field. */
function noise(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type Cell = { char: string; logo: boolean };

const FIELD: Cell[][] = Array.from({ length: FIELD_ROWS }, (_, y) =>
  Array.from({ length: FIELD_COLS }, (_, x) => {
    const logoChar = LINES[y - PAD_ROWS]?.[x - LOGO_COL];
    if (logoChar && logoChar !== " ") return { char: logoChar, logo: true };
    return { char: TEXTURE[Math.floor(noise(x, y) * TEXTURE.length)]!, logo: false };
  }),
);

/**
 * Each row split into runs of logo or texture characters. This is what the server renders: a
 * few spans per row instead of one per character, which kept the page's HTML light.
 */
const RUNS = FIELD.map((row) => {
  const runs: { text: string; logo: boolean }[] = [];
  for (const { char, logo } of row) {
    const kind = char === " " ? runs.at(-1)?.logo ?? logo : logo;
    const last = runs.at(-1);
    if (last && last.logo === kind) last.text += char;
    else runs.push({ text: char, logo: kind });
  }
  return runs;
});

const noopSubscribe = () => () => {};

/**
 * What a scrambling character cycles through, grouped by how much ink each glyph carries. A
 * character only swaps within its own group, so a faint dot never flashes into a heavy `@` and
 * the band keeps its brightness while it scrambles.
 */
const GLYPHS = {
  light: ".,:;'`-~",
  mid: "=+*<>/\|^!",
  heavy: "#%@&$?{}[]",
};

function glyphsFor(char: string) {
  if (".,:;'`-~ ".includes(char)) return GLYPHS.light;
  if ("#%@&$".includes(char)) return GLYPHS.heavy;
  return GLYPHS.mid;
}
/** How long a character keeps changing after the pointer passes, in ms. */
const HOLD = 450;
/** Time between scrambled frames, in ms: fast enough to read as rapid, slow enough to see. */
const FRAME = 40;
/** The brush's size around the pointer, in columns and rows. */
const RADIUS = { x: 6, y: 3 };
/** Inside this share of the radius every character takes; beyond it, fewer and fewer do. */
const CORE = 0.45;
/** How far past the radius the thinning edge reaches, as a share of it. */
const EDGE = 0.4;

/**
 * A band of dim ASCII characters with the logo drawn into it, for the foot of the page.
 * The characters near the pointer keep scrambling while it moves or rests there, and settle
 * back once it moves on. They keep their own colour throughout. The scramble writes to the spans directly rather than through React state, since it
 * touches dozens of characters many times a second. Reduced motion turns it off.
 */
export function AsciiFooter({ className }: { className?: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  // False on the server and during hydration; per-character spans only exist after that.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const pre = preRef.current;
    if (!hydrated || !pre || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cells = Array.from(pre.querySelectorAll<HTMLSpanElement>("[data-cell]"));
    const byPosition = new Map(cells.map((cell) => [cell.dataset.cell!, cell]));
    const expiry = new Map<HTMLSpanElement, number>();
    // Where the pointer is while it's over the band, so a resting cursor keeps scrambling.
    let pointer: { clientX: number; clientY: number } | null = null;
    let frame = 0;
    let last = 0;

    /**
     * Brushes the characters around a point, so they keep changing for a while. The brush is
     * soft and uneven rather than a clean oval: the centre always takes, further out a
     * character takes only some of the time, the outline wobbles with angle and drifts over
     * time, and each character holds for a random share of `HOLD`. Brushed every frame while
     * the cursor rests, the edge keeps shifting.
     */
    const stamp = (clientX: number, clientY: number) => {
      const box = pre.getBoundingClientRect();
      const col = ((clientX - box.left) / box.width) * FIELD_COLS;
      const row = ((clientY - box.top) / box.height) * FIELD_ROWS;
      const now = performance.now();
      const reach = 1 + EDGE;
      for (let y = Math.floor(row - RADIUS.y * reach); y <= Math.ceil(row + RADIUS.y * reach); y++) {
        for (let x = Math.floor(col - RADIUS.x * reach); x <= Math.ceil(col + RADIUS.x * reach); x++) {
          const dx = (x + 0.5 - col) / RADIUS.x;
          const dy = (y + 0.5 - row) / RADIUS.y;
          const wobble = 1 + 0.28 * Math.sin(Math.atan2(dy, dx) * 3 + now / 260);
          const distance = Math.hypot(dx, dy) / wobble;
          const chance = distance < CORE ? 1 : 1 - (distance - CORE) / (1 + EDGE - CORE);
          if (chance <= 0 || Math.random() > chance) continue;
          const cell = byPosition.get(`${y}:${x}`);
          if (!cell) continue;
          const until = now + HOLD * (0.35 + 0.65 * Math.random());
          if ((expiry.get(cell) ?? 0) < until) expiry.set(cell, until);
        }
      }
    };

    const tick = () => {
      // The same clock `stamp` uses, rather than the frame's own timestamp.
      const now = performance.now();
      if (now - last >= FRAME) {
        if (pointer) stamp(pointer.clientX, pointer.clientY);
        last = now;
        for (const [cell, until] of expiry) {
          if (now >= until) {
            cell.textContent = cell.dataset.char!;
            delete cell.dataset.hot;
            expiry.delete(cell);
          } else {
            const glyphs = glyphsFor(cell.dataset.char!);
            cell.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]!;
            cell.dataset.hot = "";
          }
        }
      }
      frame = pointer || expiry.size > 0 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event: PointerEvent) => {
      pointer = { clientX: event.clientX, clientY: event.clientY };
      stamp(event.clientX, event.clientY);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    // The characters already stamped finish their hold and settle on their own.
    const onLeave = () => {
      pointer = null;
    };

    pre.addEventListener("pointermove", onMove);
    pre.addEventListener("pointerleave", onLeave);
    return () => {
      pre.removeEventListener("pointermove", onMove);
      pre.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [hydrated]);

  return (
    // The sides fade with a mask: briefly on the left, ending before the logo, and longer on
    // the right, where the field runs on past the edge. Top and bottom fade per row, above,
    // so the logo itself never dims.
    <footer
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_70%,transparent)]",
        className,
      )}
    >
      <pre
        ref={preRef}
        aria-hidden
        className="w-max font-mono text-[7px] leading-[1.15] select-none sm:text-[9px]"
      >
        {!hydrated
          ? RUNS.map((runs, y) => (
              <div key={y}>
                {runs.map(({ text, logo }, index) => (
                  <span
                    key={index}
                    className={logo ? "text-muted-foreground" : "text-border-strong"}
                    style={logo ? undefined : { opacity: rowOpacity(y) }}
                  >
                    {text}
                  </span>
                ))}
              </div>
            ))
          : FIELD.map((row, y) => (
          <div key={y}>
            {row.map(({ char, logo }, x) =>
              char === " " ? (
                " "
              ) : (
                <span
                  key={x}
                  data-cell={`${y}:${x}`}
                  data-char={char}
                  className={logo ? "text-muted-foreground" : "text-border-strong"}
                  style={logo ? undefined : { opacity: rowOpacity(y) }}
                >
                  {char}
                </span>
              ),
            )}
          </div>
        ))}
      </pre>
    </footer>
  );
}
