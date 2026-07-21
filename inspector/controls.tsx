"use client";

import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { cn } from "@/registry/lib/cn";
import type { ControlDef, ControlSchema, ControlValues } from "./schema";

interface ControlsProps<S extends ControlSchema> {
  /** Prefixes DOM ids when several settings panels are rendered on one page. */
  idPrefix?: string;
  schema: S;
  values: ControlValues<S>;
  onChange: (key: keyof S, value: unknown) => void;
}

export function Controls<S extends ControlSchema>({
  idPrefix,
  schema,
  values,
  onChange,
}: ControlsProps<S>) {
  const entries = Object.entries(schema) as [keyof S & string, ControlDef][];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
        Settings
      </h2>
      <div className="flex flex-col gap-3">
        {entries.map(([key, def]) => (
          <Control
            key={key}
            id={idPrefix ? `${idPrefix}-${key}` : key}
            def={def}
            value={values[key]}
            values={values as Record<string, unknown>}
            onChange={(v) => onChange(key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function Control({
  id,
  def,
  value: rawValue,
  values,
  onChange,
}: {
  id: string;
  def: ControlDef;
  value: unknown;
  values: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  // Fall back to the def's own default when the stored value is missing. This keeps every
  // control *controlled* from its first render even if the persisted `values` predates
  // this key — which is what happens when a new control is added to a schema mid-session
  // and Fast Refresh keeps the old state around. Without it, the field flips from
  // uncontrolled to controlled and Base UI (rightly) warns.
  const value = rawValue === undefined ? def.defaultValue : rawValue;
  const label = def.label ?? id;

  if (def.kind === "boolean") {
    const disabled = def.disabledWhen?.(values) ?? false;
    // The whole row is the hit area (wrapping <label>), not a 16px square you aim at —
    // this mirrors the Checkbox's own label structure, so a row click toggles it.
    return (
      <label
        className={cn(
          "flex items-center justify-between gap-4",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <span className="text-sm text-muted-foreground select-none">{label}</span>
        <Checkbox
          size="sm"
          checked={value as boolean}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </label>
    );
  }

  if (def.kind === "select") {
    const labelId = `${id}-label`;
    // A record of value → label so Base UI can resolve the closed trigger's text from the
    // selected value (options are a bare string array; the record gives it the pairings).
    const items = Object.fromEntries(def.options.map((option) => [option, option]));

    return (
      // Inline, so the row reads as one phrase — "Variant: default ⌄". The trigger is the
      // borderless (`outline={false}`) one sized to its content; `h-auto` drops the field
      // height so the row sits on the label's baseline rather than a 40px hit box.
      <div className="flex items-baseline gap-1">
        <span id={labelId} className="text-sm text-muted-foreground">
          {label}:
        </span>
        <Select
          items={items}
          value={value as string}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger outline={false} className="h-auto" aria-labelledby={labelId}>
            <SelectValue />
          </SelectTrigger>
          {/* `content` sizes the panel to its rows rather than the narrow borderless
              trigger, which would clip the longest option. */}
          <SelectContent width="content">
            {def.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (def.kind === "number") {
    // The circle Slider owns its own label and value readout, with a dot at each step
    // (the Slider hides them automatically once there are more than 50).
    return (
      <Slider
        thumb="knob"
        size="sm"
        showTicks={false}
        label={label}
        min={def.min}
        max={def.max}
        step={def.step}
        value={value as number}
        onValueChange={onChange}
      />
    );
  }

  const labelId = `${id}-label`;

  return (
    <div className="flex flex-col gap-1.5">
      {/* A `<span>`, not a `<label htmlFor>`: it still names the field via `aria-labelledby`,
          but clicking the text no longer focuses the input. */}
      <span id={labelId} className="text-sm text-muted-foreground">
        {label}
      </span>
      <Input
        id={id}
        aria-labelledby={labelId}
        tone="accent"
        value={value as string}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
