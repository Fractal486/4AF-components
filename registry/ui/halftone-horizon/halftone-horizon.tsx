"use client";

import { useEffect, useMemo, useRef, type ComponentProps, type CSSProperties } from "react";
import { cn } from "@/registry/lib/cn";
import { duration } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import { prefersReducedMotion, subscribeReducedMotion } from "@/registry/lib/reduced-motion";
import {
  halftoneHorizonCanvasVariants,
  halftoneHorizonVariants,
} from "./halftone-horizon.variants";

export type HalftoneHorizonDirection = "top" | "right" | "bottom" | "left";

/** The ember sky color; the ramp runs from near-black through it to near-white. */
export const HALFTONE_HORIZON_COLOR = "oklch(0.667 0.189 39.2)";

export type HalftoneHorizonPalette = "ember" | "night" | "ring" | "ink";

/**
 * The built-in palettes. A string is one sky color drawn in shades of itself; an array is the
 * ramp's stops from the dark edge to the light edge.
 */
export const HALFTONE_HORIZON_PALETTES: Record<HalftoneHorizonPalette, string | readonly string[]> = {
  // Near-black ink through orange to a near-white glow.
  ember: HALFTONE_HORIZON_COLOR,
  // Dark at both edges: the ember glow peaks mid-frame and sinks back to near-black.
  night: [
    "oklch(0.070 0.012 25)",
    "oklch(0.180 0.065 30)",
    "oklch(0.460 0.150 37)",
    "oklch(0.190 0.070 32)",
    "oklch(0.080 0.014 28)",
  ],
  // The theme's focus blue, in shades of itself.
  ring: "var(--ring)",
  // The page background through to the foreground, so it follows the theme.
  ink: ["var(--background)", "var(--muted)", "var(--muted-foreground)", "var(--foreground)"],
};

export interface HalftoneHorizonProps extends ComponentProps<"div"> {
  /** A built-in palette. `color` and `colors` override it. */
  palette?: HalftoneHorizonPalette;
  /** One sky color; the ramp is drawn in shades of it, from near-black to near-white. Overrides `palette`. */
  color?: string;
  /** 2–6 CSS colors from the dark edge to the light edge. Overrides `color` and `palette`. `var()` resolves. */
  colors?: readonly string[];
  /** The edge the dark comes from; the light gathers at the opposite edge. */
  direction?: HalftoneHorizonDirection;
  /** How strongly the bands arch toward the dark edge. 0 is level; negative bows them toward the light. */
  curve?: number;
  /** How far the dark reaches. 1 is the designed height. */
  reach?: number;
  /** How gradual the bands are. */
  softness?: number;
  /** Distance between dot centers, in CSS pixels. */
  spacing?: number;
  /** Dot size as a share of its cell. */
  dotSize?: number;
  /** The smallest dot, in the dark, as a share of a full dot. */
  minDot?: number;
  /** How far into the light (0–1) the halftone reaches; past it the gradient is smooth. */
  dots?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Film grain strength. */
  grain?: number;
  /** Shifts the composition. */
  seed?: number;
  /** Dots under the pointer grow and square off, small dots growing most. Mouse and pen only. */
  hover?: boolean;
  /** A press sends a ring outward that grows and squares off the dots it passes. */
  ripple?: boolean;
  /** Let the bands drift. Off, or under reduced motion, one still frame is drawn. */
  animate?: boolean;
  /** Seconds for the dark to come in on first show. 0 skips the intro. */
  intro?: number;
  /** Where the intro starts, 0–2: 0 is a blank sky, 1 is at rest, above 1 starts further in and draws back. */
  introFrom?: number;
}

interface Settings {
  colors: [number, number, number][];
  direction: number;
  curve: number;
  reach: number;
  softness: number;
  spacing: number;
  dotSize: number;
  minDot: number;
  dots: number;
  grain: number;
  seed: number;
  /** Pointer x and y in canvas pixels (WebGL's bottom-left origin), and its 0–1 strength. */
  hover: [number, number, number];
  /** Up to MAX_RIPPLES rings: x and y and radius in canvas pixels, then 0–1 strength. */
  ripples: Float32Array;
}

const DIRECTIONS: Record<HalftoneHorizonDirection, number> = { top: 0, right: 1, bottom: 2, left: 3 };
const GRADIENT_TO: Record<HalftoneHorizonDirection, string> = {
  top: "to bottom",
  right: "to left",
  bottom: "to top",
  left: "to right",
};
const MAX_COLORS = 6;
const MAX_DPR = 2;
/**
 * The hover lens: how far it reaches, in CSS pixels, and how much the smallest dot's radius
 * grows at its center, as a share of the cell. Larger dots grow less, down to none.
 */
const HOVER_RADIUS = 110;
const HOVER_GROWTH = 0.18;
/**
 * Click ripples: how many can overlap, how fast the ring travels and how wide its band is (in
 * CSS pixels), and how long it lasts before it has faded out, in seconds.
 */
const MAX_RIPPLES = 4;
const RIPPLE_SPEED = 650;
const RIPPLE_WIDTH = 34;
const RIPPLE_LIFE = 1.1;
/** How far the intro pushes the bands: enough to clear the frame at either extreme. */
const INTRO_SHIFT = 1.3;

// Shades keep their chroma as they darken and turn slightly redder, like ink; toward the
// light they lose chroma and warm into a near-white glow.
function shadesOf(color: string) {
  const shade = (l: number, c: number, h: number) =>
    `oklch(from ${color} min(calc(l * ${l}), 0.99) calc(c * ${c}) calc(h + ${h}))`;
  return [
    shade(0.33, 0.45, -13),
    shade(0.42, 0.56, -9),
    shade(0.72, 0.87, -4),
    color,
    shade(1.3, 0.38, 8),
    shade(1.48, 0.04, 22),
  ];
}

const VERTEX = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpacing;
uniform float uDotSize;
uniform float uMinDot;
uniform float uDots;
uniform float uCurve;
uniform float uReach;
uniform float uSoftness;
uniform float uGrain;
uniform float uSeed;
uniform float uDpr;
uniform float uIntro;
uniform float uDir;
uniform vec4 uHover;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec3 uColors[${MAX_COLORS}];
uniform float uCount;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// The drift's noise blends with a quintic: a cubic leaves the tone's slope kinked along
// every lattice line, and as the drift sweeps the lattice through the smooth glow those
// kinks read as faint moving stripes (mirrored in pairs, since the drift reads y squared).
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

vec3 ramp(float t) {
  float s = clamp(t, 0.0, 1.0) * (uCount - 1.0);
  vec3 c = uColors[0];
  for (int i = 1; i < ${MAX_COLORS}; i++) {
    if (float(i) >= uCount) break;
    c = mix(c, uColors[i], clamp(s - float(i - 1), 0.0, 1.0));
  }
  return c;
}

// x: 0 at the dark edge, 1 at the light edge. y: across the frame, centered, in the
// same units as x so the arch keeps its shape at any aspect ratio.
vec2 frame(vec2 p) {
  vec2 uv = p / uRes;
  if (uDir < 0.5) return vec2(1.0 - uv.y, (uv.x - 0.5) * uRes.x / uRes.y);
  if (uDir < 1.5) return vec2(1.0 - uv.x, (uv.y - 0.5) * uRes.y / uRes.x);
  if (uDir < 2.5) return vec2(uv.y, (uv.x - 0.5) * uRes.x / uRes.y);
  return vec2(uv.x, (uv.y - 0.5) * uRes.y / uRes.x);
}

// A positive curve makes the light a vast disc beyond the light edge, its rim the horizon:
// a smaller disc falls away faster at the sides, so the bands arch toward the dark. A
// negative curve mirrors it with a disc beyond the dark edge, so the bands bow toward the
// light. Both flatten to level bands as the curve approaches 0.
float level(vec2 p) {
  vec2 f = frame(p);
  float radius = 6.0 / max(abs(uCurve), 0.01);
  float v = uCurve >= 0.0
    ? 1.0 - (length(vec2(f.y, f.x - 1.0 - radius)) - radius)
    : length(vec2(f.y, f.x + radius)) - radius;
  float t = uTime + uSeed * 7.31;
  vec2 drift = vec2(uSeed * 3.17, uSeed * 1.93);
  // The drift is mirror-symmetric across the frame (it reads only y squared), so the bands
  // breathe evenly about the center instead of tilting to one side.
  float y2 = f.y * f.y;
  v += 0.03 * sin(t * 0.5) * cos(y2 * 1.6) + 0.012 * sin(t * 0.31 + y2 * 3.0 + 1.7);
  v += 0.05 * (smoothNoise(vec2(y2 * 2.0 + t * 0.06, f.x * 1.3 - t * 0.04) + drift) - 0.5);
  v += uIntro;
  return v;
}

// More reach pushes the ramp toward the light edge; softness widens it.
float rampSpan() { return 0.58 * uSoftness / 1.1; }
float rampStart() { return 0.44 + 0.3 * (uReach - 1.0) - 0.5 * rampSpan(); }
// Past the middle the ramp stretches, so the glow fades into the light edge gradually.
float toRamp(float level) {
  float x = (level - rampStart()) / rampSpan();
  return clamp(x < 0.5 ? x : 0.5 + (x - 0.5) / 1.2, 0.0, 1.0);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  float S = uSpacing;
  float aa = max(1.0, 0.12 * S);
  // The grid is centered in the frame, so partial cells split evenly between opposite edges.
  vec2 origin = mod(uRes, S) * 0.5;
  vec2 center = (floor((p - origin) / S) + 0.5) * S + origin;
  float cellLevel = level(center);
  float pixelLevel = level(p);

  // Halftone progress runs from the dark edge (0) to where the ramp reaches \`dots\` (1).
  float dotsLevel = rampStart() + uDots * rampSpan();
  float grow = clamp(cellLevel / max(dotsLevel, 0.02), 0.0, 1.0);

  // Dots grow from minDot past touching; the shrinking gaps read as soft holes, and once
  // the radius clears the cell's corners (plus the soft edge) the ink is solid.
  float radius = mix(uMinDot * 0.5, 0.84, pow(grow, 2.0)) * uDotSize * S;
  // The hover lens and click ripples work on whole dots about their center, so each keeps its
  // shape rather than bulging. They grow them and square them off (the corner radius shrinks from the full
  // radius, a circle, toward zero, a square of the same half-width). Both fade out as the
  // dots grow toward the glow: the small dots in the dark change most, and the large dots,
  // already close to fusing, barely change, so they never square off into a solid fill.
  vec2 fromPointer = (center - uHover.xy) / uHover.w;
  float lens = uHover.z * exp(-dot(fromPointer, fromPointer));
  // Each ripple is a Gaussian band around its ring.
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 ring = uRipples[i];
    float offRing = (length(center - ring.xy) - ring.z) / (float(${RIPPLE_WIDTH}) * uDpr);
    lens += ring.w * exp(-offRing * offRing);
  }
  lens = min(lens, 1.0) * (1.0 - grow);
  radius += ${HOVER_GROWTH} * uDotSize * S * lens;
  float corner = radius * (1.0 - lens);
  vec2 box = abs(p - center) - (radius - corner);
  float edge = length(max(box, 0.0)) + min(max(box.x, box.y), 0.0) - corner;
  float cover = 1.0 - smoothstep(-aa, aa, edge);

  // Ink runs ahead of the average tone: small bright dots on dark paper, like print.
  float lead = 0.1 * (1.0 - grow * grow);
  vec3 ink = ramp(mix(toRamp(cellLevel + lead), toRamp(pixelLevel), grow * grow));
  vec3 paper = ink * mix(0.15, 0.35, grow);
  vec3 color = mix(paper, ink, cover);

  // Paper grain: soft clumps a couple of pixels across over a faint, larger mottle. It is
  // fixed to the surface like paper, rather than flickering like a screen.
  vec2 q = p / (1.2 * uDpr) + uSeed * 13.7;
  float clumps = noise(q) * 0.65 + noise(q * 2.07 + 17.0) * 0.35;
  float mottle = noise(p / (10.0 * uDpr) + 31.0 + uSeed * 5.3);
  color += ((clumps - 0.5) * 1.5 + (mottle - 0.5) * 0.15) * uGrain;
  gl_FragColor = vec4(color, 1.0);
}
`;

interface Renderer {
  draw(settings: Settings, time: number, intro: number): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false });
  } catch {
    return null;
  }
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uniforms = {
    res: u("uRes"),
    time: u("uTime"),
    spacing: u("uSpacing"),
    dotSize: u("uDotSize"),
    minDot: u("uMinDot"),
    dots: u("uDots"),
    curve: u("uCurve"),
    reach: u("uReach"),
    softness: u("uSoftness"),
    grain: u("uGrain"),
    dpr: u("uDpr"),
    seed: u("uSeed"),
    intro: u("uIntro"),
    dir: u("uDir"),
    hover: u("uHover"),
    ripples: u("uRipples"),
    colors: u("uColors"),
    count: u("uCount"),
  };
  let dpr = 1;

  return {
    resize(width, height, ratio) {
      dpr = ratio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    draw(settings, time, intro) {
      const colors = new Float32Array(MAX_COLORS * 3);
      settings.colors.forEach((color, index) => colors.set(color, index * 3));
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.spacing, settings.spacing * dpr);
      gl.uniform1f(uniforms.dotSize, settings.dotSize);
      gl.uniform1f(uniforms.minDot, settings.minDot);
      gl.uniform1f(uniforms.dots, settings.dots);
      gl.uniform1f(uniforms.curve, settings.curve);
      gl.uniform1f(uniforms.reach, settings.reach);
      gl.uniform1f(uniforms.softness, settings.softness);
      gl.uniform1f(uniforms.grain, settings.grain);
      gl.uniform1f(uniforms.dpr, dpr);
      gl.uniform1f(uniforms.seed, settings.seed);
      gl.uniform1f(uniforms.intro, intro);
      gl.uniform1f(uniforms.dir, settings.direction);
      gl.uniform4f(uniforms.hover, settings.hover[0], settings.hover[1], settings.hover[2], HOVER_RADIUS * dpr);
      gl.uniform4fv(uniforms.ripples, settings.ripples);
      gl.uniform3fv(uniforms.colors, colors);
      gl.uniform1f(uniforms.count, settings.colors.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}

/** Resolves any CSS color, `var()` and `color-mix()` included, to sRGB through a probe and a 1×1 canvas. */
function resolveColors(probe: HTMLElement, colors: readonly string[]): [number, number, number][] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  return colors.map((color) => {
    probe.style.color = color;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "black";
    context.fillStyle = getComputedStyle(probe).color;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  });
}

function finite(value: number, fallback: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/**
 * An arched horizon printed in halftone in the dark: dots grow with the light until they
 * fuse into a smooth glow. Drawn by one WebGL fragment shader behind the children; a CSS
 * gradient of the same colors stands in before the first frame and where WebGL is unavailable.
 *
 * The loop pauses offscreen, in hidden tabs, when `animate` is off, and under reduced
 * motion, where a single still frame at rest is drawn instead and the intro is skipped.
 */
export function HalftoneHorizon({
  palette = "ember",
  color,
  colors,
  direction = "top",
  curve = 1,
  reach = 1,
  softness = 1.1,
  spacing = 7,
  dotSize = 1,
  minDot = 0.25,
  dots = 0.7,
  speed = 1,
  grain = 0.04,
  seed = 0,
  hover = true,
  ripple = true,
  animate = true,
  intro = 2.4,
  introFrom = 0,
  className,
  style,
  children,
  ref,
  ...props
}: HalftoneHorizonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);

  const stops = useMemo(() => {
    const list = colors?.slice(0, MAX_COLORS);
    if (list && list.length >= 2) return list;
    if (color) return shadesOf(color);
    const preset = HALFTONE_HORIZON_PALETTES[palette] ?? HALFTONE_HORIZON_COLOR;
    return typeof preset === "string" ? shadesOf(preset) : [...preset];
  }, [palette, color, colors]);
  const stopsKey = stops.join("|");

  // The loop reads the latest props from here, so prop changes never rebuild the renderer.
  const optionsRef = useRef({ stops, direction, curve, reach, softness, spacing, dotSize, minDot, dots, speed, grain, seed, hover, ripple, animate, intro, introFrom });
  const controlRef = useRef<{ update(): void; recolor(): void } | null>(null);

  useEffect(() => {
    optionsRef.current = { stops, direction, curve, reach, softness, spacing, dotSize, minDot, dots, speed, grain, seed, hover, ripple, animate, intro, introFrom };
    controlRef.current?.update();
  }, [stops, direction, curve, reach, softness, spacing, dotSize, minDot, dots, speed, grain, seed, hover, ripple, animate, intro, introFrom]);

  useEffect(() => {
    controlRef.current?.recolor();
  }, [stopsKey]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const probe = probeRef.current;
    if (!root || !canvas || !probe) return;

    // A lost context (GPU reset, too many live contexts) falls back to the CSS gradient until
    // the browser restores it, then the renderer is rebuilt on the same canvas.
    let renderer = createRenderer(canvas);
    root.dataset.renderer = renderer ? "webgl" : "fallback";

    let resolved = resolveColors(probe, optionsRef.current.stops);
    let time = 8;
    let last = 0;
    let frame = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== "hidden";
    let reduced = prefersReducedMotion();

    // The pointer's lens fades in and out over the slow duration token; under reduced motion
    // it switches without easing.
    let pointerX = 0;
    let pointerY = 0;
    let pointerInside = false;
    let hoverLevel = 0;
    const hoverTarget = () => (pointerInside && optionsRef.current.hover ? 1 : 0);

    // Each press starts a ring at its point. Ages advance with the frame clock, so a hidden
    // tab holds them where they were.
    let ripples: { x: number; y: number; age: number }[] = [];
    const rippleData = new Float32Array(MAX_RIPPLES * 4);
    const rippleUniforms = () => {
      rippleData.fill(0);
      const width = canvas.getBoundingClientRect().width;
      const scale = width > 0 ? canvas.width / width : 1;
      ripples.forEach((ring, index) => {
        const progress = ring.age / RIPPLE_LIFE;
        rippleData.set([ring.x, ring.y, ring.age * RIPPLE_SPEED * scale, (1 - progress) ** 2], index * 4);
      });
      return rippleData;
    };

    // The intro runs once, on real seconds, from `introFrom` to rest. A still frame skips it.
    const introLength = finite(optionsRef.current.intro, 2.4, 0, 30);
    const introStart = finite(optionsRef.current.introFrom, 0, 0, 2);
    let introElapsed = 0;
    let introDone = introLength === 0 || introStart === 1 || !optionsRef.current.animate || reduced;

    const introShift = () => {
      if (introDone) return 0;
      const progress = Math.min(1, introElapsed / introLength);
      const eased = 1 - (1 - progress) ** 3;
      const position = introStart + (1 - introStart) * eased;
      if (progress >= 1) introDone = true;
      return (1 - position) * INTRO_SHIFT;
    };

    const settings = (): Settings => {
      const o = optionsRef.current;
      return {
        colors: resolved,
        direction: DIRECTIONS[o.direction] ?? 0,
        curve: finite(o.curve, 1, -4, 4),
        reach: finite(o.reach, 1, 0, 3),
        softness: finite(o.softness, 1.1, 0.05, 4),
        spacing: finite(o.spacing, 7, 2, 64),
        dotSize: finite(o.dotSize, 1, 0.1, 2),
        minDot: finite(o.minDot, 0.25, 0, 1),
        dots: finite(o.dots, 0.7, 0.05, 1),
        grain: finite(o.grain, 0.04, 0, 0.5),
        seed: finite(o.seed, 0, -1e4, 1e4),
        hover: [pointerX, pointerY, hoverLevel],
        ripples: rippleUniforms(),
      };
    };

    const playing = () =>
      renderer !== null && optionsRef.current.animate && !reduced && visible && pageVisible;
    const easingHover = () => renderer !== null && visible && pageVisible && hoverLevel !== hoverTarget();
    const rippling = () => renderer !== null && visible && pageVisible && ripples.length > 0;

    const paint = () => {
      if (!renderer || resolved.length < 2) return;
      renderer.draw(settings(), time, introShift());
      canvas.dataset.ready = "";
    };

    const tick = (now: number) => {
      frame = 0;
      if (last) {
        const seconds = Math.min(now - last, 100) / 1000;
        if (optionsRef.current.animate) time += seconds * finite(optionsRef.current.speed, 1, 0, 10);
        introElapsed += seconds;
        const target = hoverTarget();
        hoverLevel = reduced ? target : hoverLevel + (target - hoverLevel) * (1 - Math.exp((-3 * seconds) / duration.slow));
        if (Math.abs(target - hoverLevel) < 0.002) hoverLevel = target;
        ripples = ripples.filter((ring) => (ring.age += seconds) < RIPPLE_LIFE);
      }
      last = now;
      paint();
      root.dataset.state = playing() ? "playing" : "paused";
      if (playing() || easingHover() || rippling()) frame = requestAnimationFrame(tick);
    };

    const update = () => {
      if (reduced || !optionsRef.current.animate) introDone = true;
      root.dataset.state = playing() ? "playing" : "paused";
      if (frame || !renderer) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    const recolor = () => {
      resolved = resolveColors(probe, optionsRef.current.stops);
      update();
    };

    const resize = () => {
      const { width, height } = root.getBoundingClientRect();
      renderer?.resize(width, height, Math.min(window.devicePixelRatio || 1, MAX_DPR));
      update();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      renderer = null;
      root.dataset.renderer = "fallback";
      delete canvas.dataset.ready;
      update();
    };
    const onContextRestored = () => {
      renderer = createRenderer(canvas);
      root.dataset.renderer = renderer ? "webgl" : "fallback";
      resize();
    };
    /** A pointer event's position in canvas pixels, with WebGL's bottom-left origin. */
    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width > 0 ? canvas.width / rect.width : 1;
      return [(event.clientX - rect.left) * scale, canvas.height - (event.clientY - rect.top) * scale] as const;
    };
    // Touch has no hover; a finger would leave the lens behind wherever it lifted.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      [pointerX, pointerY] = toCanvas(event);
      pointerInside = true;
      update();
    };
    // Ripples answer any primary press, touch included. Reduced motion skips them.
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || !optionsRef.current.ripple || reduced) return;
      const [x, y] = toCanvas(event);
      ripples = [...ripples, { x, y, age: 0 }].slice(-MAX_RIPPLES);
      update();
    };
    const onPointerLeave = () => {
      pointerInside = false;
      update();
    };
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    controlRef.current = { update, recolor };
    resize();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(root);

    const intersection = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        update();
      });
    intersection?.observe(root);

    const onVisibility = () => {
      pageVisible = document.visibilityState !== "hidden";
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const unsubscribeMotion = subscribeReducedMotion(() => {
      reduced = prefersReducedMotion();
      update();
    });

    // `var(--token)` colors change with the theme, which a class or attribute switches.
    const themeObserver = new MutationObserver(recolor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    return () => {
      cancelAnimationFrame(frame);
      controlRef.current = null;
      resizeObserver?.disconnect();
      intersection?.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeMotion();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      renderer?.dispose();
      delete canvas.dataset.ready;
    };
  }, []);

  return (
    <div
      {...props}
      ref={mergedRef}
      data-slot="halftone-horizon"
      data-palette={(colors && colors.length >= 2) || color ? "custom" : palette}
      data-direction={direction}
      data-animate={animate ? "true" : "false"}
      className={cn(halftoneHorizonVariants(), className)}
      style={{ backgroundImage: `linear-gradient(${GRADIENT_TO[direction]}, ${stops.join(", ")})`, ...style } as CSSProperties}
    >
      <canvas ref={canvasRef} aria-hidden="true" data-slot="halftone-horizon-canvas" className={halftoneHorizonCanvasVariants()} />
      <span ref={probeRef} hidden />
      {children}
    </div>
  );
}
