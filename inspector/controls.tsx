"use client";

import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { Input } from "@/registry/ui/input/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { ScrubSlider } from "@/registry/ui/scrub-slider/scrub-slider";
import { cn } from "@/registry/lib/cn";
import { Ellipsis } from "lucide-react";
import { Fragment } from "react";
import type { ControlDef, ControlSchema, ControlValues } from "./schema";

// Wrap only when this label and control cannot fit together, regardless of panel width.
const CONTROL_ROW = "flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2";
/** A setting that doesn't apply to the current configuration dims as a whole row. */
const DISABLED_ROW = "cursor-not-allowed opacity-50";

interface ControlsProps<S extends ControlSchema> {
  /** Prefixes DOM ids when several settings panels are rendered on one page. */
  idPrefix?: string;
  schema: S;
  values: ControlValues<S>;
  onChange: (key: keyof S, value: unknown) => void;
}

/** Where a setting sorts: dropdowns and tabs, then sliders and fields, then switches. */
function controlRank(key: string, def: ControlDef) {
  if (key === "disabled") return 3;
  if (def.kind === "select" || def.kind === "multiselect") return 0;
  if (def.kind === "boolean") return 2;
  return 1;
}

export function Controls<S extends ControlSchema>({
  idPrefix,
  schema,
  values,
  onChange,
}: ControlsProps<S>) {
  // Every panel reads the same way: choices first, amounts second, switches last, and
  // Disabled at the very end. A stable sort, so each group keeps the order its demo wrote.
  const entries = (Object.entries(schema) as [keyof S & string, ControlDef][]).sort(
    ([keyA, a], [keyB, b]) => controlRank(keyA, a) - controlRank(keyB, b),
  );
  // Selects that live in a boolean's ⋯ menu render there, not as rows of their own.
  const menuOf = (def: ControlDef) => (def.kind === "select" ? def.menuOf : undefined);

  return (
    <div className="flex w-full flex-col gap-3">
      {entries.filter(([, def]) => !menuOf(def)).map(([key, def]) => (
        <Control
          key={key}
          id={idPrefix ? `${idPrefix}-${key}` : key}
          def={def}
          label={def.label ?? humanizeLabel(key)}
          value={values[key]}
          values={values as Record<string, unknown>}
          onChange={(v) => onChange(key, v)}
          menu={entries
            .filter(([, child]) => menuOf(child) === key)
            .map(([childKey, child]) => ({
              key: childKey,
              def: child,
              label: child.label ?? humanizeLabel(childKey),
              value: values[childKey],
              onChange: (v: unknown) => onChange(childKey, v),
            }))}
        />
      ))}
    </div>
  );
}

interface MenuSetting {
  key: string;
  def: ControlDef;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * The ⋯ beside a boolean: the styles of what it turns on, one radio group per setting.
 * Outside the row's `<label>`, so opening it never toggles the checkbox.
 */
function SettingMenu({
  label,
  settings,
  values,
  disabled,
}: {
  label: string;
  settings: MenuSetting[];
  values: Record<string, unknown>;
  disabled: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button variant="plain" size="icon-xs" aria-label={`${label} styles`}>
            <Ellipsis />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        {settings.map((setting, index) => {
          if (setting.def.kind !== "select") return null;
          const def = setting.def;
          const groupDisabled = def.disabledWhen?.(values) ?? false;
          const value = setting.value === undefined ? def.defaultValue : setting.value;
          return (
            <Fragment key={setting.key}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel>{setting.label}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={value as string} onValueChange={(v) => setting.onChange(v)}>
                  {def.options.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option} disabled={groupDisabled}>
                      {humanizeLabel(option)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Control({
  id,
  def,
  label,
  value: rawValue,
  values,
  onChange,
  menu = [],
}: {
  id: string;
  def: ControlDef;
  label: string;
  value: unknown;
  values: Record<string, unknown>;
  onChange: (value: unknown) => void;
  menu?: MenuSetting[];
}) {
  // Fall back to the def's own default when the stored value is missing. This keeps every
  // control *controlled* from its first render even if the persisted `values` predates
  // this key — which is what happens when a new control is added to a schema mid-session
  // and Fast Refresh keeps the old state around. Without it, the field flips from
  // uncontrolled to controlled and Base UI (rightly) warns.
  const value = rawValue === undefined ? def.defaultValue : rawValue;
  const disabled = def.disabledWhen?.(values) ?? false;
  const row = cn(CONTROL_ROW, disabled && DISABLED_ROW);

  if (def.kind === "boolean") {
    // The whole row is the hit area (wrapping <label>), not a 16px square you aim at —
    // this mirrors the Checkbox's own label structure, so a row click toggles it.
    const row = (
      <label
        className={cn(
          "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
          // Room for the ⋯ that sits just before the checkbox.
          menu.length > 0 && "gap-12",
          disabled ? DISABLED_ROW : "cursor-pointer",
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
    if (menu.length === 0) return row;
    // The ⋯ is a sibling of the label, laid over the gap before the checkbox: a button inside
    // a <label> would become the label's control, and a click on it would toggle the box.
    // It applies only while the setting is on.
    return (
      <div className="relative min-w-0">
        {/* First in the DOM, so Tab reaches it before the checkbox, the order they read in. */}
        <div className="absolute top-1/2 right-6 z-10 -translate-y-1/2">
          <SettingMenu label={label} settings={menu} values={values} disabled={disabled || value !== true} />
        </div>
        {row}
      </div>
    );
  }

  if (def.kind === "select") {
    const labelId = `${id}-label`;
    const selectedLabel = humanizeLabel(value as string);
    const icons = def.icons;

    return (
      <div className={row}>
        <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
          {label}
        </span>
        <Select<string>
          value={value as string}
          disabled={disabled}
          // The rows only mount while open, so the closed trigger reads its icon from here.
          iconForValue={icons ? (option) => icons[option] : undefined}
          onValueChange={(next) => {
            if (next !== null) onChange(next);
          }}
        >
          <SelectTrigger
            aria-labelledby={labelId}
            variant="plain"
            className="ml-auto max-w-full shrink-0"
          >
            <SelectValue>{() => selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {def.options.map((option) => (
              <SelectItem key={option} value={option} icon={icons?.[option]}>
                {humanizeLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (def.kind === "multiselect") {
    const labelId = `${id}-label`;
    const selected = Array.isArray(value) ? value as readonly string[] : def.defaultValue;

    // A compact count can summarize longer option lists without widening the setting.
    return (
      <div className={row}>
        <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
          {label}
        </span>
        <Select<string, true>
          multiple
          disabled={disabled}
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
                if (def.showCount) return `${options.length} selected`;
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
              <SelectItem key={option} value={option} icon={def.icons?.[option]}>
                {humanizeLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (def.kind === "range") {
    const [low, high] = Array.isArray(value) ? (value as [number, number]) : def.defaultValue;
    return (
      <div className={row}>
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
            disabled={disabled}
            value={[low, high]}
            onValueChange={(next: readonly [number, number]) => onChange(next)}
          />
          <output className="min-w-8 text-right text-sm tabular-nums text-foreground">
            {low === high ? low : `${low}–${high}`}
          </output>
        </div>
      </div>
    );
  }

  if (def.kind === "number") {
    // Keep the label, ruler, and value in one compact row so numeric props follow their
    // names instead of taking a full-width line in the settings strip. The inline scrub
    // slider takes the old rail and readout's width; a click on it types a value.
    return (
      <div className={row}>
        <span className="min-w-0 text-sm text-muted-foreground">{label}</span>
        <ScrubSlider
          aria-label={label}
          layout="inline"
          variant="plain"
          size="sm"
          chevrons={false}
          className="ml-auto w-38 max-w-full shrink-0"
          min={def.min}
          max={def.max}
          step={def.step}
          disabled={disabled}
          value={value as number}
          onValueChange={(next) => onChange(next)}
        />
      </div>
    );
  }

  const labelId = `${id}-label`;

  return (
    <label className={row}>
      <span id={labelId} className="min-w-0 text-sm text-muted-foreground">
        {label}
      </span>
      <Input
        id={id}
        aria-labelledby={labelId}
        tone="accent"
        wrapperClassName="ml-auto w-48 max-w-full shrink-0"
        value={value as string}
        disabled={disabled}
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
