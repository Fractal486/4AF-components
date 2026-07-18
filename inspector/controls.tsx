"use client";

import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Radio, RadioGroup } from "@/registry/ui/radio/radio";
import { Slider } from "@/registry/ui/slider/slider";
import type { ControlDef, ControlSchema, ControlValues } from "./schema";

interface ControlsProps<S extends ControlSchema> {
  schema: S;
  values: ControlValues<S>;
  onChange: (key: keyof S, value: unknown) => void;
}

export function Controls<S extends ControlSchema>({
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
            id={key}
            def={def}
            value={values[key]}
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
  onChange,
}: {
  id: string;
  def: ControlDef;
  value: unknown;
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
    // The whole row is the hit area (wrapping <label>), not a 16px square you aim at —
    // this mirrors the Checkbox's own label structure, so a row click toggles it.
    return (
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground select-none">{label}</span>
        <Checkbox
          size="sm"
          checked={value as boolean}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </label>
    );
  }

  if (def.kind === "select") {
    const labelId = `${id}-label`;

    return (
      <div className="flex flex-col gap-2">
        <span id={labelId} className="text-sm text-muted-foreground">
          {label}
        </span>
        {/* The Radio group itself — dogfooding the component as the enum control. */}
        <RadioGroup
          size="sm"
          value={value as string}
          onValueChange={(next) => onChange(next)}
          aria-labelledby={labelId}
        >
          {def.options.map((option) => (
            <Radio key={option} value={option} label={option} />
          ))}
        </RadioGroup>
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

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        tone="accent"
        value={value as string}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm text-muted-foreground">
      {children}
    </label>
  );
}
