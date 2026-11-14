"use client";

import { Check, FilePen, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { Morph } from "@/registry/ui/morph/morph";

const STATES = ["draft", "saving", "saved"] as const;
type State = (typeof STATES)[number];

const ICONS: Record<State, ReactNode> = {
  draft: <FilePen />,
  saving: <RefreshCw />,
  saved: <Check />,
};

const LABELS: Record<State, string> = {
  draft: "Draft",
  saving: "Saving changes…",
  saved: "Saved",
};

/**
 * Morph on its own, outside any control: a status line whose icon and label swap. The
 * dashed outline wraps the icon and the label's box, so `widest` and `current` sizing show
 * as what they are — a box held at the longest label, or one that follows the showing label.
 */
export function MorphDemo({ sizing, outline }: { sizing: "widest" | "current"; outline: boolean }) {
  const [index, setIndex] = useState(0);
  const state = STATES[index]!;

  // Steps through the states on its own, as Badge's demo does.
  useEffect(() => {
    const id = window.setInterval(() => setIndex((current) => (current + 1) % STATES.length), 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-lg font-medium text-foreground",
        outline && "rounded-sm outline-1 outline-offset-4 outline-border outline-dashed",
      )}
    >
      {/* Icons share a known box, so they swap with `fixed` sizing and no hidden copies. */}
      <Morph aria-hidden="true" sizing="fixed" className="size-5 text-muted-foreground [&_svg]:size-5" activeKey={state} items={ICONS} />
      <Morph role="status" sizing={sizing} activeKey={state} items={LABELS} />
    </p>
  );
}
