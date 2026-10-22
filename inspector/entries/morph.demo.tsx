"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph, type MorphProps } from "@/registry/ui/morph/morph";
import { Toggle } from "@/registry/ui/toggle/toggle";
import type { ControlVariant } from "../button-options";

type Variant = ControlVariant;
type Shape = "rectangular" | "pill";

export function IconToggle({
  labels,
  icons,
  variant = "outline",
  shape,
  sizing,
}: {
  labels: [string, string];
  icons: [ReactNode, ReactNode];
  variant?: Variant;
  shape?: Shape;
  sizing?: MorphProps<"on" | "off">["sizing"];
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
      <Morph
        activeKey={on ? "on" : "off"}
        sizing={sizing}
        className={sizing === "fixed" ? "size-4 [&_svg]:size-4" : undefined}
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
  sizing?: MorphProps<"on" | "off">["sizing"];
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
        className={sizing === "fixed" ? "h-5 w-20" : undefined}
        items={{ off: labels[0], on: labels[1] }}
      />
    </Toggle>
  );
}
