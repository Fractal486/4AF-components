"use client";

import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { cn } from "@/registry/lib/cn";
import type { ControlDef, ControlSchema, ControlValues } from "./schema";

/*
 * A short enum reads better as pill tabs than as a dropdown: every choice is visible, and
 * picking one is a single click instead of open-then-choose. That only holds while the whole
 * run still fits where a settings field goes — past that it crowds the label or wraps, and the
 * dropdown is the better trade.
 *
 * So the decision is made on the width the run would take, not on how many options there are:
 * four two-letter sizes fit comfortably where three seven-letter variants do not. The numbers
 * are the `sm` pill's own metrics from `tabs.variants.ts`, measured against the width of the
 * text input in the row above.
 */
const PILL_TRACK_PX = 4; // `p-0.5` on the list
const PILL_GAP_PX = 2; // `gap-0.5` between tabs
const PILL_TAB_PX = 20; // `px-2.5` on a tab
const PILL_CHAR_PX = 6; // one `text-xs` character, averaged over mixed-case Latin
const SETTINGS_FIELD_PX = 192; // `max-w-48`, the text control this lines up with
// Wrap only when this label and control cannot fit together, regardless of panel width.
const CONTROL_ROW = "flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2";

export function fitsPillTabs(labels: readonly string[]): boolean {
  // One option is not a choice, and a lone pill reads as a button that does nothing.
  if (labels.length < 2) return false;

  const characters = labels.reduce((total, label) => total + label.length, 0);
  const width =
    PILL_TRACK_PX +
    labels.length * PILL_TAB_PX +
    (labels.length - 1) * PILL_GAP_PX +
    characters * PILL_CHAR_PX;

  return width <= SETTINGS_FIELD_PX;
}

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
    const disabled = def.disabledWhen?.(values) ?? false;

    if (fitsPillTabs(def.options.map(humanizeLabel))) {
      // The tab's value is the raw option, so picking one hands back exactly what the schema
      // declared — no round-trip through the display label and back.
      return (
        <div className={CONTROL_ROW}>
          <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
            {label}
          </span>
          <Tabs
            variant="pill"
            appearance="outline"
            size="sm"
            className="ml-auto max-w-full shrink-0"
            value={value as string}
            onValueChange={(next) => onChange(next)}
          >
            <TabsList aria-labelledby={labelId}>
              {def.options.map((option) => (
                <TabsTab key={option} value={option} disabled={disabled}>
                  {humanizeLabel(option)}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
        </div>
      );
    }

    return (
      <div className={CONTROL_ROW}>
        <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
          {label}
        </span>
        <AlignedSelect<string>
          value={selectedLabel}
          disabled={disabled}
          onValueChange={(next) => {
            const option = def.options.find((candidate) => humanizeLabel(candidate) === next);
            if (option !== undefined) onChange(option);
          }}
        >
          <AlignedSelectTrigger
            aria-labelledby={labelId}
            variant="plain"
            className="ml-auto max-w-full shrink-0"
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

  if (def.kind === "multiselect") {
    const labelId = `${id}-label`;
    const selected = value as readonly string[];

    // The library's own multi-select. Its trigger names the picks rather than counting them:
    // with three options at most, "Horizontal, Outline" says more than "2 selected".
    return (
      <div className={CONTROL_ROW}>
        <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
          {label}
        </span>
        <Select<string, true>
          multiple
          value={[...selected]}
          onValueChange={(next) =>
            // Kept in the schema's order, whatever order they were picked in.
            onChange(def.options.filter((option) => next.includes(option)))
          }
        >
          <SelectTrigger
            aria-labelledby={labelId}
            variant="plain"
            className="ml-auto max-w-full shrink-0"
          >
            <SelectValue>
              {(picked: unknown) => {
                const options = Array.isArray(picked) ? (picked as string[]) : [];
                return options.length === 0 ? (
                  <span className="text-muted-foreground">None</span>
                ) : (
                  def.options
                    .filter((option) => options.includes(option))
                    .map(humanizeLabel)
                    .join(", ")
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {def.options.map((option) => (
              <SelectItem key={option} value={option}>
                {humanizeLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (def.kind === "number") {
    // Keep the label, rail, and value in one compact row so numeric props follow their
    // names instead of taking a full-width line in the settings strip.
    return (
      <div className={CONTROL_ROW}>
        <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
        <div className="ml-auto flex min-w-0 max-w-full shrink-0 items-center gap-2">
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
    <label className={CONTROL_ROW}>
      <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
        {label}
      </span>
      <Input
        id={id}
        aria-labelledby={labelId}
        tone="accent"
        className="ml-auto w-48 max-w-full shrink-0"
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
