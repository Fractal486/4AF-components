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
import { Tabs, TabsList, TabsTab } from "@/registry/ui/tabs/tabs";
import { cn } from "@/registry/lib/cn";
import { Ellipsis } from "lucide-react";
import { Fragment } from "react";
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
/** The most icon-only tabs a setting shows before its icons move into dropdown rows. */
const MAX_ICON_TABS = 6;
/** A setting that doesn't apply to the current configuration dims as a whole row. */
const DISABLED_ROW = "cursor-not-allowed opacity-50";

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
    // Icons stay tabs up to six options; past that a row of glyphs is a guessing game, so
    // they move into the dropdown's rows beside their labels instead.
    const iconTabs = icons !== undefined && !def.iconsInDropdown && def.options.length <= MAX_ICON_TABS;
    if (iconTabs || (!icons && fitsPillTabs(def.options.map(humanizeLabel)))) {
      // The tab's value is the raw option, so picking one hands back exactly what the schema
      // declared — no round-trip through the display label and back.
      return (
        <div className={row}>
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
                <TabsTab
                  key={option}
                  value={option}
                  disabled={disabled}
                  aria-label={iconTabs ? humanizeLabel(option) : undefined}
                  title={iconTabs ? humanizeLabel(option) : undefined}
                >
                  {iconTabs ? icons[option] : humanizeLabel(option)}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
        </div>
      );
    }

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
