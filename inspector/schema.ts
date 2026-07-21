import type { ReactNode } from "react";

/**
 * A component's "settings" are declared once, as data, and everything else falls
 * out of that: the knobs in the panel, the types handed to `render`, and the
 * initial state. Adding a component to the inspector should never mean writing a
 * bespoke page.
 */

/** Grey a control out based on the other controls' current values. */
export type DisabledWhen = (values: Record<string, unknown>) => boolean;

export type ControlDef =
  | { kind: "select"; options: readonly string[]; defaultValue: string; label?: string }
  | { kind: "boolean"; defaultValue: boolean; label?: string; disabledWhen?: DisabledWhen }
  | { kind: "text"; defaultValue: string; label?: string; placeholder?: string }
  | {
      kind: "number";
      defaultValue: number;
      label?: string;
      min?: number;
      max?: number;
      step?: number;
    };

export type ControlSchema = Record<string, ControlDef>;

/** Maps a control definition to the type of value it produces. */
type ValueOf<C extends ControlDef> = C extends {
  kind: "select";
  options: readonly (infer O)[];
}
  ? O
  : C extends { kind: "boolean" }
    ? boolean
    : C extends { kind: "text" }
      ? string
      : C extends { kind: "number" }
        ? number
        : never;

export type ControlValues<S extends ControlSchema> = {
  [K in keyof S]: ValueOf<S[K]>;
};

/* -- Builders. `const O` keeps the option strings as literals, so `render` gets
      `"solid" | "outline" | …` and not a bare `string`. --------------------- */

export function select<const O extends readonly string[]>(
  options: O,
  defaultValue: O[number],
  label?: string,
): { kind: "select"; options: O; defaultValue: O[number]; label?: string } {
  return { kind: "select", options, defaultValue, label };
}

export function bool(
  defaultValue: boolean,
  label?: string,
  disabledWhen?: DisabledWhen,
): { kind: "boolean"; defaultValue: boolean; label?: string; disabledWhen?: DisabledWhen } {
  return { kind: "boolean", defaultValue, label, disabledWhen };
}

export function text(
  defaultValue: string,
  label?: string,
  placeholder?: string,
): { kind: "text"; defaultValue: string; label?: string; placeholder?: string } {
  return { kind: "text", defaultValue, label, placeholder };
}

export function num(
  defaultValue: number,
  opts: { min?: number; max?: number; step?: number; label?: string } = {},
): {
  kind: "number";
  defaultValue: number;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
} {
  return { kind: "number", defaultValue, ...opts };
}

export interface Entry<S extends ControlSchema = ControlSchema> {
  slug: string;
  name: string;
  controls: S;
  /**
   * Offer a "full screen" view — a new tab that renders the demo alone at window size,
   * with a mirrored settings panel. Only for the handful of components a preview box is
   * genuinely too small for (an app shell), where it's worth the second route. Most
   * components read fine in the box and don't want the button.
   */
  fullscreen?: boolean;
  /** Method syntax, not a property — bivariance is what lets entries with
      different schemas live in one array without an `any` in sight. */
  render(values: ControlValues<S>): ReactNode;
}

export function defineEntry<S extends ControlSchema>(entry: Entry<S>): Entry<S> {
  return entry;
}

export function initialValues<S extends ControlSchema>(schema: S): ControlValues<S> {
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(schema)) out[key] = def.defaultValue;
  return out as ControlValues<S>;
}

/* -- URL round-tripping, so a full-screen tab opens on what you were already looking at. */

export function paramsFromValues(values: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) params.set(key, String(value));
  return params;
}

/**
 * Rebuilds values from a query string, one control at a time. Every param arrives as a
 * string, so the schema is what says whether `"3000"` is a number and `"false"` is a
 * boolean — and anything missing or unparseable falls back to the control's default
 * rather than handing `render` a NaN or an option that isn't in the list.
 */
export function valuesFromParams<S extends ControlSchema>(
  schema: S,
  params: Record<string, string | string[] | undefined>,
): ControlValues<S> {
  const out: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(schema)) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (value === undefined) {
      out[key] = def.defaultValue;
    } else if (def.kind === "boolean") {
      out[key] = value === "true";
    } else if (def.kind === "number") {
      const parsed = Number(value);
      out[key] = Number.isFinite(parsed) ? parsed : def.defaultValue;
    } else if (def.kind === "select") {
      out[key] = def.options.includes(value) ? value : def.defaultValue;
    } else {
      out[key] = value;
    }
  }

  return out as ControlValues<S>;
}
