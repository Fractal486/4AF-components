"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import { Toggle } from "@/registry/ui/toggle/toggle";
import type { ControlVariant } from "../button-options";

type Variant = ControlVariant;
type Shape = "rectangular" | "pill";

export function IconToggle({
  labels,
  icons,
  variant = "outline",
  shape,
}: {
  labels: [string, string];
  icons: [ReactNode, ReactNode];
  variant?: Variant;
  shape?: Shape;
}) {
  const [on, setOn] = useState(false);

  return (
    <Button
      variant={variant}
      size="icon"
      shape={shape}
      onClick={() => setOn((value) => !value)}
      aria-label={on ? labels[1] : labels[0]}
      aria-pressed={on}
    >
      {/* Icons share a known 16px box, so the swap needs no hidden sizing copies. */}
      <Morph
        sizing="fixed"
        className="size-4"
        activeKey={on ? "on" : "off"}
        items={{ off: icons[0], on: icons[1] }}
      />
    </Button>
  );
}

export function TextToggle({
  labels,
  variant = "outline",
  shape,
  sizing,
}: {
  labels: [string, string];
  variant?: Variant;
  shape?: Shape;
  sizing?: "widest" | "current";
}) {
  const [on, setOn] = useState(false);

  return (
    <Toggle
      variant={variant}
      size="md"
      shape={shape}
      pressed={on}
      onPressedChange={setOn}
      aria-label={on ? labels[1] : labels[0]}
    >
      <Morph
        activeKey={on ? "on" : "off"}
        sizing={sizing}
        items={{ off: labels[0], on: labels[1] }}
      />
    </Toggle>
  );
}
