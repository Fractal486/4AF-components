"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * Attributes that identify, position, or configure an element rather than describe what it
 * is doing right now. Variant and size are real attributes, but they never change here.
 */
const IGNORED =
  /^data-(slot|testid|base-ui|index|orientation|side|align|variant|size|pending-mode|composite-item-active)$|^data-base-ui/;

/** Reads the element's `data-*` attributes as `name` or `name="value"` strings. */
function readState(element: Element | null) {
  if (!element) return [];
  return Array.from(element.attributes)
    .filter(({ name }) => name.startsWith("data-") && !IGNORED.test(name))
    .map(({ name, value }) => (value === "" ? name : `${name}="${value}"`));
}

export interface SpecimenProps {
  /** Registry name; also the docs slug the caption links to. */
  name: string;
  /** Selects the element inside the specimen whose state is read out. */
  target: string;
  className?: string;
  children: ReactNode;
}

/**
 * A live component on the landing board, captioned with the state it carries on the DOM.
 * The readout is observed rather than derived from props, so it shows exactly what a
 * stylesheet or test would see. Attributes that change since the last read flash amber.
 */
export function Specimen({ name, target, className, children }: SpecimenProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<string[]>([]);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let previous: string[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const read = () => {
      const next = readState(stage.querySelector(target));
      if (next.join(" ") === previous.join(" ")) return;
      const changed = next.filter((attribute) => !previous.includes(attribute));
      previous = next;
      setState(next);
      setFresh(new Set(changed));
      clearTimeout(timer);
      timer = setTimeout(() => setFresh(new Set()), 700);
    };

    read();
    // The first read is the resting state, not a change.
    setFresh(new Set());
    // Subtree, because some components swap their target element as they change state.
    // Motion writes `style` every frame; those records are skipped before any work.
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.type === "childList" || r.attributeName?.startsWith("data-"))) {
        read();
      }
    });
    observer.observe(stage, { attributes: true, childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [target]);

  return (
    <figure className={cn("flex min-h-60 flex-col bg-surface p-4", className)}>
      <figcaption className="font-mono text-2xs text-subtle-foreground">
        <Link
          href={`/docs/${name}`}
          className="rounded-xs underline-offset-4 outline-none transition-[color] duration-(--duration-fast) hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {name}
        </Link>
      </figcaption>
      <div ref={stageRef} className="flex flex-1 items-center justify-center py-8">
        {children}
      </div>
      <p
        // Duplicates state the component already exposes to assistive technology.
        aria-hidden
        className="flex min-h-[2lh] flex-wrap content-end gap-x-2 font-mono text-2xs text-muted-foreground"
      >
        {state.length === 0 ? (
          <span className="text-subtle-foreground">—</span>
        ) : (
          state.map((attribute) => (
            <span
              key={attribute}
              data-fresh={fresh.has(attribute) || undefined}
              // Snaps to amber on change, then eases back.
              className="transition-[color] duration-(--duration-slower) data-fresh:text-accent-600 data-fresh:transition-none dark:data-fresh:text-accent-400"
            >
              {attribute}
            </span>
          ))
        )}
      </p>
    </figure>
  );
}
