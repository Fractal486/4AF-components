"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScanEye } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import { useDemoRevealsEnabled } from "@/lib/demo-reveal-preference";
import type { GenerationRun } from "../vendor/ui-generation/ui-generation";
import "../vendor/ui-generation/ui-generation.css";
import "./table-generation.css";

// Site-only presentation, never part of the installable registry package.
export function GenerationDemo({
  children, loading = false, name, contentKey, showReplay = true, className = "w-full max-w-xl self-start", targetClassName,
}: {
  children: ReactNode | ((revealed: boolean) => ReactNode);
  loading?: boolean;
  name: string;
  contentKey?: string;
  showReplay?: boolean;
  className?: string;
  targetClassName?: string;
}) {
  const target = useRef<HTMLDivElement>(null);
  const enabled = useDemoRevealsEnabled();
  const cancelCurrent = useRef<(() => void) | null>(null);
  const previousContentKey = useRef(contentKey);
  const [attempt, setAttempt] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let run: GenerationRun | undefined;
    let started = false;
    const cancel = () => {
      disposed = true;
      run?.cancel();
      setRunning(false);
      setRevealed(true);
      setPending(false);
    };
    cancelCurrent.current = cancel;
    // Only a width change moves the layout under the drawing. Mobile browsers also fire
    // `resize` when the address bar shows or hides on touch and scroll; that only changes
    // the height, and the overlay scrolls with the demo, so it plays on.
    let width = window.innerWidth;
    const resized = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      cancel();
    };

    async function play() {
      try {
        const [{ generate }] = await Promise.all([
          import("../vendor/ui-generation/ui-generation.js"),
          document.fonts.ready,
        ]);
        if (disposed || !target.current) return;
        await Promise.all(
          [...target.current.querySelectorAll("img")]
            .filter((image) => image.getBoundingClientRect().width > 0)
            .map((image) => image.decode().catch(() => undefined)),
        );
        if (disposed || !target.current) return;
        // The runtime does not account for clipped descendants in a scroll panel.
        // Trace only complete visible rows, including when the table is scrolled.
        const bounds = target.current.getBoundingClientRect();
        const header = target.current.querySelector("thead")?.getBoundingClientRect();
        const clipped = [...target.current.querySelectorAll("tbody tr, tfoot tr")].filter((row) => {
          const rect = row.getBoundingClientRect();
          return rect.top < (header?.bottom ?? bounds.top) || rect.bottom > bounds.bottom;
        });
        // Base UI's form inputs are visually clipped and fixed at the viewport origin.
        // They participate in forms, but must not become animation targets.
        const skipped = [
          ...clipped,
          ...target.current.querySelectorAll('input[aria-hidden="true"], input[type="hidden"]'),
        ].filter((element) => !element.hasAttribute("data-t-generate-skip"));
        skipped.forEach((element) => element.setAttribute("data-t-generate-skip", ""));
        try {
          run = generate(target.current, {
            mode: "skeleton",
            container: target.current.closest<HTMLElement>("[data-demo-box], [data-generation-boundary]") ?? undefined,
          });
          // The runtime now owns opacity; release the server-rendered hiding rule.
          setPending(false);
          window.addEventListener("resize", resized);
          // generate() measures on a later animation frame, not before it returns.
          // Retain the exclusions until completion or cancellation.
          await run.finished;
        } finally {
          skipped.forEach((element) => element.removeAttribute("data-t-generate-skip"));
          window.removeEventListener("resize", resized);
        }
        if (!disposed) {
          setRunning(false);
          setMessage(`${name} ready.`);
          setRevealed(true);
        }
      } catch {
        if (!disposed) {
          setRunning(false);
          setMessage("The reveal could not play. The component is ready to use.");
          setRevealed(true);
          setPending(false);
        }
      }
    }

    // Wait until navigation has brought the demo into view before measuring it.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || started || disposed) return;
      started = true;
      observer.disconnect();
      setRunning(true);
      setRevealed(false);
      setMessage("");
      void play();
    });
    if (target.current) observer.observe(target.current);
    return () => {
      disposed = true;
      observer.disconnect();
      run?.cancel();
      cancelCurrent.current = null;
      window.removeEventListener("resize", resized);
    };
  }, [attempt, name, enabled]);

  useEffect(() => {
    if (previousContentKey.current === contentKey) return;
    previousContentKey.current = contentKey;
    // Settings may change the measured geometry. Show the updated demo immediately,
    // but reserve another generation run for the explicit replay button.
    cancelCurrent.current?.();
  }, [contentKey]);

  return (
    <div className={className}>
      {showReplay && enabled && <Tooltip content="Replay generation" delay={0}>
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute bottom-3 left-3 z-10"
          aria-label={`Replay ${name} generation`}
          disabled={loading || running}
          onClick={() => {
            setRunning(true);
            setRevealed(false);
            setMessage("");
            setAttempt((value) => value + 1);
          }}
        >
          <ScanEye />
        </Button>
      </Tooltip>}
      <span role="status" className="sr-only">
        {message}
      </span>
      <div ref={target} data-generation-pending={(enabled && pending) || undefined} className={targetClassName}>
        {typeof children === "function" ? children(revealed || !enabled) : children}
      </div>
    </div>
  );
}
