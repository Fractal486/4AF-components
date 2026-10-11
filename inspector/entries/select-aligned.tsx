"use client";

import { useState } from "react";
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
    variant: select(["default", "ghost", "plain"] as const, "default", "Variant"),
    showLabel: bool(true, "Show label"),
    sections: bool(false, "Sections"),
    searchable: bool(false, "Search field"),
    disabled: bool(false, "Disabled"),
  },
  render({ size, variant, showLabel, sections, searchable, disabled }) {
    return (
      <AlignedSelectDemo
        size={size}
        variant={variant}
        showLabel={showLabel}
        sections={sections}
        searchable={searchable}
        disabled={disabled}
      />
    );
  },
});

function AlignedSelectDemo({
  size,
  variant,
  showLabel,
  sections,
  searchable,
  disabled,
}: {
  size: (typeof SIZES)[number];
  variant: "default" | "ghost" | "plain";
  showLabel: boolean;
  sections: boolean;
  searchable: boolean;
  disabled: boolean;
}) {
  const [value, setValue] = useState<string | null>("Istanbul");

  return (
    <div className="w-full max-w-56">
      <AlignedSelect
        size={size}
        disabled={disabled}
        value={value}
        onValueChange={setValue}
        items={CITIES.map((city) => ({ value: city, label: city }))}
      >
        <AlignedSelectTrigger
          variant={variant}
          label={showLabel ? "City" : undefined}
          placeholder="Pick a city"
        />
        <AlignedSelectContent searchable={searchable}>
          {sections
            ? REGIONS.map((region) => (
                <AlignedSelectGroup key={region.label}>
                  <AlignedSelectGroupLabel>{region.label}</AlignedSelectGroupLabel>
                  {region.cities.map((city) => (
                    <AlignedSelectItem key={city} value={city}>
                      {city}
                    </AlignedSelectItem>
                  ))}
                </AlignedSelectGroup>
              ))
            : CITIES.map((city) => (
                <AlignedSelectItem key={city} value={city}>
                  {city}
                </AlignedSelectItem>
              ))}
        </AlignedSelectContent>
      </AlignedSelect>
    </div>
  );
}
