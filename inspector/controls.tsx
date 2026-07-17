"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
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
  value,
  onChange,
}: {
  id: string;
  def: ControlDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
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
      <div className="flex flex-col gap-1.5">
        <span id={labelId} className="text-sm text-muted-foreground">
          {label}
        </span>
        {/* Radio-style segments rather than a <select>: with ≤5 options, seeing all
            the variants at once is worth more than the space a dropdown saves. */}
        <RadioGroup
          value={value as string}
          onValueChange={onChange}
          aria-labelledby={labelId}
          className="flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.5"
        >
          {def.options.map((option) => (
            <Radio.Root
              key={option}
              value={option}
              nativeButton
              render={<button type="button" />}
              className={(state) =>
                cn(
                  "rounded-md px-2 py-1 font-mono text-2xs",
                  "transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-out",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  state.checked
                    ? "bg-surface text-foreground shadow-border"
                    : "text-subtle-foreground hover:text-foreground",
                )
              }
            >
              {option}
            </Radio.Root>
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
