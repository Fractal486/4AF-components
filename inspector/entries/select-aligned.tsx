"use client";

import { useState } from "react";
import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/registry/ui/select/select-aligned";
import { bool, defineEntry, select } from "../schema";

const SIZES = ["sm", "md"] as const;

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

export const selectAlignedEntry = defineEntry({
  slug: "select-aligned",
  name: "Aligned",
  controls: {
    size: select(SIZES, "sm"),
    disabled: bool(false, "Disabled"),
  },
  render({ size, disabled }) {
    return <AlignedSelectDemo size={size} disabled={disabled} />;
  },
});

function AlignedSelectDemo({
  size,
  disabled,
}: {
  size: (typeof SIZES)[number];
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
        <AlignedSelectTrigger placeholder="Pick a city" />
        <AlignedSelectContent>
          {CITIES.map((city) => (
            <AlignedSelectItem key={city} value={city}>
              {city}
            </AlignedSelectItem>
          ))}
        </AlignedSelectContent>
      </AlignedSelect>
    </div>
  );
}
