"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import { Toggle } from "@/registry/ui/toggle/toggle";

type Variant = "primary" | "outline" | "ghost" | "plain";

export function IconToggle({
  labels,
  icons,
  variant = "outline",
}: {
  labels: [string, string];
  icons: [ReactNode, ReactNode];
  variant?: Variant;
}) {
  const [on, setOn] = useState(false);

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setOn((value) => !value)}
      aria-label={on ? labels[1] : labels[0]}
      aria-pressed={on}
    >
      <Morph activeKey={on ? "on" : "off"} items={{ off: icons[0], on: icons[1] }} />
    </Button>
  );
}

export function TextToggle({
  labels,
  variant = "outline",
}: {
  labels: [string, string];
  variant?: Variant;
}) {
  const [on, setOn] = useState(false);

  return (
    <Toggle
      variant={variant}
      size="md"
      pressed={on}
      onPressedChange={setOn}
      aria-label={on ? labels[1] : labels[0]}
    >
      <Morph activeKey={on ? "on" : "off"} items={{ off: labels[0], on: labels[1] }} />
    </Toggle>
  );
}
