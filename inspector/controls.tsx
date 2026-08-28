"use client";

import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
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
    <div className="flex w-full flex-col gap-3">
      {entries.map(([key, def]) => (
        <Control
          key={key}
          id={idPrefix ? `${idPrefix}-${key}` : key}
          def={def}
          label={def.label ?? humanizeLabel(key)}
          value={values[key]}
          values={values as Record<string, unknown>}
          onChange={(v) => onChange(key, v)}
        />
      ))}
    </div>
  );
}

function Control({
  id,
  def,
  label,
  value: rawValue,
  values,
  onChange,
}: {
  id: string;
  def: ControlDef;
  label: string;
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

  if (def.kind === "boolean") {
    const disabled = def.disabledWhen?.(values) ?? false;
    // The whole row is the hit area (wrapping <label>), not a 16px square you aim at —
    // this mirrors the Checkbox's own label structure, so a row click toggles it.
    return (
      <label
        className={cn(
          "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <span className="min-w-0 text-sm text-muted-foreground select-none">{label}</span>
        <Checkbox
          checked={value as boolean}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </label>
    );
  }

  if (def.kind === "select") {
    const labelId = `${id}-label`;
    const selectedLabel = humanizeLabel(value as string);

    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-center gap-4">
        <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
          {label}
        </span>
        <AlignedSelect<string>
          value={selectedLabel}
          onValueChange={(next) => {
            const option = def.options.find((candidate) => humanizeLabel(candidate) === next);
            if (option !== undefined) onChange(option);
          }}
        >
          <AlignedSelectTrigger
            aria-labelledby={labelId}
            variant="plain"
            className="justify-self-end"
          />
          <AlignedSelectContent>
            {def.options.map((option) => (
              <AlignedSelectItem key={option} value={humanizeLabel(option)}>
                {humanizeLabel(option)}
              </AlignedSelectItem>
            ))}
          </AlignedSelectContent>
        </AlignedSelect>
      </div>
    );
  }

  if (def.kind === "number") {
    // Keep the label, rail, and value in one compact row so numeric props follow their
    // names instead of taking a full-width line in the settings strip.
    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
        <div className="flex min-w-0 items-center gap-2 justify-self-end">
          <Slider
            aria-label={label}
            className="w-28 shrink-0"
            thumb="knob"
            size="sm"
            showTicks={false}
            showValue={false}
            min={def.min}
            max={def.max}
            step={def.step}
            value={value as number}
            onValueChange={onChange}
          />
          <output className="min-w-8 text-right text-sm tabular-nums text-foreground">
            {value as number}
          </output>
        </div>
      </div>
    );
  }

  const labelId = `${id}-label`;

  return (
    <label className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,12rem)] items-center gap-4">
      <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
        {label}
      </span>
      <Input
        id={id}
        aria-labelledby={labelId}
        tone="accent"
        className="w-full max-w-48 justify-self-end"
        value={value as string}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function humanizeLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
