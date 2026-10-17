"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { DocsCodeBlock } from "@/components/docs-code-block";
import { registryItemUrl } from "@/lib/site";
import "./install-command.css";

/** How long each URL rests before the next one replaces it, in ms. */
const HOLD = 2400;

const COMMAND = "npx shadcn@latest add";

/**
 * The landing page's install command, cycling through the registry's component URLs.
 *
 * Only one URL is ever in the DOM as text, so the code block's copy button copies exactly
 * the command on screen; the outgoing URL is drawn by generated content while it leaves
 * (see install-command.css). The line clips vertically so the rise never adds scroll
 * overflow to the code block. Hovering or focusing the block holds the current URL so it
 * can be copied, and reduced motion keeps the first one still.
 */
export function InstallCommand({ names }: { names: string[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const cycling = !reduceMotion && !held && names.length > 1;

  useEffect(() => {
    if (!cycling) return;
    const timer = setTimeout(() => {
      setPrevious(index);
      setIndex((index + 1) % names.length);
    }, HOLD);
    return () => clearTimeout(timer);
  }, [cycling, index, names.length]);

  const url = registryItemUrl(names[index]!);

  return (
    <div
      className="mt-3 max-w-180"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
    >
      <DocsCodeBlock className="my-0">
        <pre className="min-w-full w-max px-4 pr-14 font-mono text-xs leading-6">
          <code>
            {COMMAND}{" "}
            <span
              // Keyed so each swap remounts and restarts both animations.
              key={url}
              data-slot="install-command-url"
              data-previous={previous == null ? undefined : registryItemUrl(names[previous]!)}
              className="relative inline-block h-6 overflow-y-clip align-top"
            >
              <span className="inline-block">{url}</span>
            </span>
          </code>
        </pre>
      </DocsCodeBlock>
    </div>
  );
}
