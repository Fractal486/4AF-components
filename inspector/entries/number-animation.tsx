"use client";

import { useState } from "react";
import { NumberAnimation, type NumberAnimationTrend } from "@/registry/ui/number-animation/number-animation";
import { Button } from "@/registry/ui/button/button";
import { defineEntry, select, withIcons } from "../schema";
import { NUMBER_FORMAT_ICONS } from "../setting-icons";

const formats = {
  number: { maximumFractionDigits: 0 },
  decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  currency: { style: "currency", currency: "USD" },
  percent: { style: "percent" },
} satisfies Record<string, Intl.NumberFormatOptions>;

function NumberAnimationPreview({ format, trend }: {
  format: keyof typeof formats;
  trend: NumberAnimationTrend;
}) {
  const [value, setValue] = useState(99);
  return (
    <div className="flex flex-col items-center gap-6">
      <NumberAnimation
        value={format === "percent" ? value / 100 : format === "decimal" ? value / 10 : value}
        format={formats[format]}
        locales="en-US"
        trend={trend}
        className="text-4xl font-medium text-foreground"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setValue(current => current - 1)}>−1</Button>
        <Button size="sm" variant="ghost" onClick={() => setValue(current => current + 1)}>+1</Button>
        <Button size="sm" variant="ghost" onClick={() => setValue(current => current + 10)}>+10</Button>
      </div>
    </div>
  );
}

export const numberAnimationEntry = defineEntry({
  slug: "number-animation",
  name: "Number Animation",
  controls: {
    format: withIcons(select(["number", "decimal", "currency", "percent"], "number", "Format"), NUMBER_FORMAT_ICONS),
    trend: select(["auto", "up", "down", "shortest"], "auto", "Direction"),
  },
  render: props => <NumberAnimationPreview {...props} />,
});
