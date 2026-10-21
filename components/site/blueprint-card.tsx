"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { useEffect, useState } from "react";
import { useBlueprintPreviewsEnabled } from "@/lib/blueprint-preview-preference";
import { cn } from "@/registry/lib/cn";

/** Shared by every rail link, so one card follows the pointer from label to label. */
export type BlueprintHandle = BaseTooltip.Handle<string>;
export const createBlueprintHandle = () => BaseTooltip.createHandle<string>();

/** Blueprint SVG text by URL, fetched once per page load. */
const sources = new Map<string, Promise<string>>();

function loadBlueprint(url: string) {
  let source = sources.get(url);
  if (!source) {
    source = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Blueprint ${url} failed with ${response.status}`);
      return response.text();
    });
    // A failed fetch is retried on the next hover rather than cached.
    source.catch(() => sources.delete(url));
    sources.set(url, source);
  }
  return source;
}


/**
 * Plays `url` from its first frame, again whenever `play` changes.
 *
 * An `<img>` keeps each SVG's stylesheet sealed off from the page (several use bare
 * selectors such as `text`), but browsers share one animation timeline between every image
 * of the same URL, so a remounted `<img src={url}>` shows the finished frame. Each play
 * gets its own blob URL of the same text instead.
 *
 * The drawing on screen stays until the next one has loaded, so moving between labels
 * swaps one for the other without the card emptying in between.
 */
function BlueprintPlayer({ url, play }: { url: string; play: number }) {
  const [shown, setShown] = useState<string>();
  const [pending, setPending] = useState<string>();

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    loadBlueprint(url)
      .then((text) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
        setPending(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      // Revoking only stops new loads; an image that has already loaded keeps its drawing.
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, play]);

  // One keyed list, so the pending image becomes the shown one without remounting.
  return [shown, pending].map((src) =>
    src ? (
      // A blob URL has nothing for next/image to optimize.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={src}
        src={src}
        alt=""
        onLoad={
          src === pending
            ? () => {
                setShown(src);
                setPending(undefined);
              }
            : undefined
        }
        // The drawings vary in aspect; each is fitted inside the fixed card at its own
        // proportions, on the card's matching ground.
        className={cn("absolute inset-0 size-full object-contain", src === pending && "opacity-0")}
      />
    ) : null,
  );
}

/**
 * The hovered component's blueprint, beside the cursor. It opens without delay, follows the
 * pointer while it is over a label, and closes as soon as the pointer is anywhere else. The
 * drawing restarts on every label, and on every return to the same one.
 */
export function BlueprintCard({ handle }: { handle: BlueprintHandle }) {
  const [plays, setPlays] = useState(0);
  // Switched in the search palette; disabled, the triggers stay plain links.
  const enabled = useBlueprintPreviewsEnabled();

  return (
    <BaseTooltip.Root
      handle={handle}
      disabled={!enabled}
      trackCursorAxis="both"
      disableHoverablePopup
      onOpenChange={(open) => {
        if (open) setPlays((count) => count + 1);
      }}
    >
      {({ payload }) => (
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            side="right"
            sideOffset={20}
            collisionPadding={16}
            className="pointer-events-none z-50"
          >
            <BaseTooltip.Popup
              data-theme="dark"
              className={cn(
                // One fixed size for every drawing. The ground is the dark theme's background,
                // which is the blueprints' own, so letterboxing is invisible in either theme.
                "relative h-40 w-64 overflow-hidden rounded-md bg-background",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_-12px_rgba(0,0,0,0.6)]",
                // Fades in from the cursor; leaves with a fade and blur rather than retracing
                // the entrance.
                "origin-[var(--transform-origin)] blur-0",
                "transition-[opacity,scale,filter] duration-(--duration-fast) ease-out",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                "data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
              )}
            >
              {payload && <BlueprintPlayer url={payload} play={plays} />}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      )}
    </BaseTooltip.Root>
  );
}
