"use client";

import { useState } from "react";
import { Alert } from "@/registry/ui/alert/alert";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectGroup,
  AlignedSelectGroupLabel,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
import { bool, defineEntry, select } from "../schema";

const SIZES = ["xs", "sm", "md"] as const;

/**
 * Long enough that the selected row is somewhere in the middle of the list, which is the
 * only way to see what the variant does: pick "Istanbul" and the panel opens with Istanbul
 * already under the cursor, five rows deep.
 */
const CITIES = [
  "Amsterdam",
  "Berlin",
  "Copenhagen",
  "Dublin",
  "Istanbul",
  "Lisbon",
  "Oslo",
  "Prague",
  "Reykjavík",
  "Vienna",
];

/**
 * Appended when the demo is scrollable: enough rows that the panel outgrows the space around
 * the trigger and scrolls, with the selected row still placed over it.
 */
const MORE_CITIES = [
  "Athens", "Barcelona", "Brussels", "Bucharest", "Budapest", "Edinburgh", "Florence",
  "Geneva", "Hamburg", "Helsinki", "Kraków", "Lyon", "Madrid", "Milan", "Munich", "Naples",
  "Porto", "Riga", "Rome", "Seville", "Sofia", "Stockholm", "Tallinn", "Valencia", "Vilnius",
  "Warsaw", "Zagreb", "Zürich",
];

/** The same cities, grouped, so the sections have something to divide. */
const REGIONS = [
  { label: "Northern", cities: ["Copenhagen", "Dublin", "Oslo", "Reykjavík"] },
  { label: "Central", cities: ["Amsterdam", "Berlin", "Prague", "Vienna"] },
  { label: "Southern", cities: ["Istanbul", "Lisbon"] },
];

export const selectAlignedEntry = defineEntry({
  slug: "select-aligned",
  name: "Select Aligned",
  controls: {
    size: select(SIZES, "sm"),
    selected: bool(true, "Selected"),
    variant: select(["default", "ghost", "plain"] as const, "default", "Variant"),
    showLabel: bool(true, "Show label"),
    sections: bool(false, "Sections"),
    scrollable: bool(false, "Scrollable"),
    searchable: bool(false, "Search field"),
    disabled: bool(false, "Disabled"),
    invalid: bool(false),
  },
  render({ size, selected, variant, showLabel, sections, scrollable, searchable, disabled, invalid }) {
    return (
      <AlignedSelectDemo
        key={String(selected)}
        size={size}
        selected={selected}
        variant={variant}
        showLabel={showLabel}
        sections={sections}
        scrollable={scrollable}
        searchable={searchable}
        disabled={disabled}
        invalid={invalid}
      />
    );
  },
});

function AlignedSelectDemo({
  size,
  selected,
  variant,
  showLabel,
  sections,
  scrollable,
  searchable,
  disabled,
  invalid,
}: {
  size: (typeof SIZES)[number];
  selected: boolean;
  variant: "default" | "ghost" | "plain";
  showLabel: boolean;
  sections: boolean;
  scrollable: boolean;
  searchable: boolean;
  disabled: boolean;
  invalid: boolean;
}) {
  const [value, setValue] = useState<string | null>(selected ? "Istanbul" : null);
  const cities = scrollable ? [...CITIES, ...MORE_CITIES].sort((a, b) => a.localeCompare(b)) : CITIES;
  const regions = scrollable ? [...REGIONS, { label: "More", cities: MORE_CITIES }] : REGIONS;

  return (
    <div className="w-full max-w-56">
      <AlignedSelect
        size={size}
        disabled={disabled}
        value={value}
        onValueChange={setValue}
        items={cities.map((city) => ({ value: city, label: city }))}
      >
        <AlignedSelectTrigger
          variant={variant}
          label={showLabel ? "City" : undefined}
          placeholder="Select an option"
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "select-aligned-error" : undefined}
        />
        <AlignedSelectContent searchable={searchable}>
          {sections
            ? regions.map((region) => (
                <AlignedSelectGroup key={region.label}>
                  <AlignedSelectGroupLabel>{region.label}</AlignedSelectGroupLabel>
                  {region.cities.map((city) => (
                    <AlignedSelectItem key={city} value={city}>
                      {city}
                    </AlignedSelectItem>
                  ))}
                </AlignedSelectGroup>
              ))
            : cities.map((city) => (
                <AlignedSelectItem key={city} value={city}>
                  {city}
                </AlignedSelectItem>
              ))}
        </AlignedSelectContent>
      </AlignedSelect>
      {invalid && <Alert id="select-aligned-error">Please choose an option.</Alert>}
    </div>
  );
}
