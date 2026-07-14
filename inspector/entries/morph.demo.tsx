"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph, type MorphFeel, type MorphStyle } from "@/registry/ui/morph/morph";
import { Toggle } from "@/registry/ui/toggle/toggle";

/**
 * The interactive demos live here, apart from the entry itself.
 *
 * `"use client"` marks the whole *module* as a client boundary, so every export becomes
 * a client reference — an opaque stub on the server. Put it on the entry file and
 * `entry.slug` reads as `undefined` during `generateStaticParams`, because the server
 * never sees the real object. Entries stay plain modules that import client components;
 * only the components cross the boundary.
 */

export function IconToggle({
  labels,
  icons,
  style = "pop",
  feel = "clean",
}: {
  labels: [string, string];
  icons: [ReactNode, ReactNode];
  style?: MorphStyle;
  feel?: MorphFeel;
}) {
  const [on, setOn] = useState(false);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOn((v) => !v)}
      aria-label={on ? labels[1] : labels[0]}
      aria-pressed={on}
    >
      <Morph
        activeKey={on ? "on" : "off"}
        items={{ off: icons[0], on: icons[1] }}
        style={style}
        feel={feel}
      />
    </Button>
  );
}

/**
 * The case icons never exercise: the two labels are different widths. The button holds
 * the width of the longer one in both states, so it never moves under the cursor.
 *
 * A Toggle rather than a Button, because it holds a state — and the variant stays put.
 * The label is already morphing; changing the fill at the same time would be two
 * signals for one event.
 */
export function TextToggle({
  labels,
  style = "lift",
  feel = "clean",
}: {
  labels: [string, string];
  style?: MorphStyle;
  feel?: MorphFeel;
}) {
  const [on, setOn] = useState(false);

  return (
    <Toggle
      variant="outline"
      size="md"
      pressed={on}
      onPressedChange={setOn}
      aria-label={on ? labels[1] : labels[0]}
    >
      <Morph
        activeKey={on ? "on" : "off"}
        items={{ off: labels[0], on: labels[1] }}
        style={style}
        feel={feel}
      />
    </Toggle>
  );
}
