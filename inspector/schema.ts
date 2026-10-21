import type { ReactNode } from "react";

/**
 * A component's "settings" are declared once, as data, and everything else falls
 * out of that: the knobs in the panel, the types handed to `render`, and the
 * initial state. Adding a component demo should never mean writing a
 * bespoke page.
 */

/** Grey a control out based on the other controls' current values. */
export type DisabledWhen = (values: Record<string, unknown>) => boolean;

export type ControlDef =
  | {
      kind: "select";
      options: readonly string[];
      defaultValue: string;
      label?: string;
      disabledWhen?: DisabledWhen;
    }
  | {
      kind: "multiselect";
      options: readonly string[];
      defaultValue: readonly string[];
      label?: string;
    }
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
  : C extends { kind: "multiselect"; options: readonly (infer O)[] }
    ? readonly O[]
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
  disabledWhen?: DisabledWhen,
): {
  kind: "select";
  options: O;
  defaultValue: O[number];
  label?: string;
  disabledWhen?: DisabledWhen;
} {
  return { kind: "select", options, defaultValue, label, disabledWhen };
}

/** Any number of the options, including none: related on/off settings in one row. */
export function multi<const O extends readonly string[]>(
  options: O,
  defaultValue: readonly O[number][],
  label?: string,
): { kind: "multiselect"; options: O; defaultValue: readonly O[number][]; label?: string } {
  return { kind: "multiselect", options, defaultValue, label };
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
