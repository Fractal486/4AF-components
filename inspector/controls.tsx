"use client";

import { cn } from "@/registry/lib/cn";
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
    // The label is the click target, so the whole row is the hit area rather than
    // a 16px square you have to aim at.
    return (
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground select-none">{label}</span>
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </label>
    );
  }

  if (def.kind === "select") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {/* Radio-style segments rather than a <select>: with ≤5 options, seeing all
            the variants at once is worth more than the space a dropdown saves. */}
        <div
          role="radiogroup"
          aria-label={label}
          className="flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.5"
        >
          {def.options.map((option) => {
            const active = option === value;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(option)}
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-2xs",
                  "transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-out",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "bg-surface text-foreground shadow-border"
                    : "text-subtle-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (def.kind === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={id}>{label}</Label>
          <span className="tabular font-mono text-2xs text-subtle-foreground">
            {String(value)}
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value as number}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="text"
        value={value as string}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-md bg-surface px-2.5 py-1.5 text-sm text-foreground shadow-border",
          "placeholder:text-subtle-foreground",
          "transition-[box-shadow] duration-(--duration-fast) ease-out",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
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
