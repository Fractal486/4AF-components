"use client";

import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import { Toggle } from "@/registry/ui/toggle/toggle";

type MorphVariant = "primary" | "outline" | "ghost" | "plain";

export interface MorphStoryProps {
  variant: MorphVariant;
}

function IconToggle({
  labels,
  icons,
  variant,
}: {
  labels: [string, string];
  icons: [ReactNode, ReactNode];
  variant: MorphVariant;
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

function TextToggle({ variant }: { variant: MorphVariant }) {
  const [on, setOn] = useState(false);

  return (
    <Toggle
      variant={variant}
      pressed={on}
      onPressedChange={setOn}
      aria-label={on ? "Following" : "Follow"}
    >
      <Morph
        activeKey={on ? "on" : "off"}
        items={{ off: "Follow", on: "Following" }}
      />
    </Toggle>
  );
}

export function MorphStory({ variant }: MorphStoryProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <IconToggle
          variant={variant}
          labels={["Play", "Pause"]}
          icons={[<Play key="play" />, <Pause key="pause" />]}
        />
        <IconToggle
          variant={variant}
          labels={["Open menu", "Close menu"]}
          icons={[<Menu key="menu" />, <X key="x" />]}
        />
        <IconToggle
          variant={variant}
          labels={["Dark theme", "Light theme"]}
          icons={[<Moon key="moon" />, <Sun key="sun" />]}
        />
      </div>
      <TextToggle variant={variant} />
    </div>
  );
}
