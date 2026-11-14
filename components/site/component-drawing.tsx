"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useReducedMotion } from "motion/react";
import { InlineLink } from "@/components/inline-link";
import type { ComponentDrawing as Drawing } from "@/lib/drawings";
import { cn } from "@/registry/lib/cn";
import { Dialog, DialogBackdrop, DialogPortal, DialogTitle, DialogTrigger } from "@/registry/ui/dialog/dialog";

interface ComponentDrawingProps extends Drawing {
  title: string;
}

/**
 * The dimensional drawing above a component's docs. With a film, the film plays there once the
 * docs come into view; either way, opening it shows the vector drawing at full size.
 */
export function ComponentDrawing({ title, svg, sheetUrl, filmUrl }: ComponentDrawingProps) {
  const reduceMotion = useReducedMotion();
  const [from, setFrom] = useState<CSSProperties>();

  // Measured on the click, before the popup renders: its starting style places it over the
  // image on the page, so the transition enlarges it from there. The popup's width is the
  // same formula as its `--w` class.
  const measure = (event: MouseEvent<HTMLButtonElement>) => {
    const image = event.currentTarget.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const width = Math.min(window.innerWidth - 2 * rem, 110 * rem, ((window.innerHeight - 2 * rem) * 1700) / 1060);
    setFrom({
      "--from-x": `${image.left + image.width / 2 - window.innerWidth / 2}px`,
      // A little below the image, to line up with the sheet as the film frames it.
      "--from-y": `${image.top + image.height / 2 - window.innerHeight / 2 + 12}px`,
      "--from-scale": image.width / width,
    } as CSSProperties);
  };

  return (
    <Dialog>
      <DialogTrigger
        onClick={measure}
        aria-label={`Open the ${title} drawing`}
        className="not-prose mb-10 block w-full cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {filmUrl && !reduceMotion ? <Film src={filmUrl} /> : <Sheet svg={svg} />}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        {/* The sheet alone, without the dialog's frame: Base UI's popup with only the
            dialog's entrance and exit. The backdrop or Escape dismisses it. */}
        <BaseDialog.Popup
          style={from}
          className={cn(
            // 1700×1060 sheet, as large as the viewport allows. The corner is concentric with
            // the sheet's drawn border: its radius 16 plus its inset 20, in sheet units.
            // Centred by margins, so translate is free for the entrance.
            "[--w:min(calc(100vw-2rem),110rem,calc((100dvh-2rem)*1700/1060))]",
            "fixed inset-0 z-50 m-auto h-fit w-(--w)",
            "overflow-hidden rounded-[calc(var(--w)*36/1700)] bg-background shadow-overlay-drop outline-none",
            // The image on the page enlarges into the dialog on the panel curve, whose movement
            // stays visible (the expo ease-out spends it in two frames). It fades in linearly
            // over the image, still visible under the backdrop, so the film's dimmed lines
            // cross-fade into the drawing's. The exit fades and blurs in place.
            "translate-0 scale-100 opacity-100 blur-none transition-[opacity,scale,translate,filter]",
            "[transition-duration:var(--duration-slow),var(--duration-slower),var(--duration-slower),var(--duration-slower)]",
            "[transition-timing-function:linear,var(--ease-panel),var(--ease-panel),var(--ease-panel)]",
            "data-starting-style:translate-x-(--from-x) data-starting-style:translate-y-(--from-y) data-starting-style:scale-(--from-scale) data-starting-style:opacity-0",
            "data-ending-style:opacity-0 data-ending-style:blur-[8px] data-ending-style:duration-(--duration-base) data-ending-style:ease-out",
            "motion-reduce:transition-[opacity] motion-reduce:data-starting-style:translate-0 motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:blur-none",
          )}
        >
          <DialogTitle className="sr-only">{title} · dimensional drawing</DialogTitle>
          {/* A second copy on the page: its marker and pattern ids get their own prefix. */}
          <Sheet svg={svg.replace(/(id="|url\(#)/g, "$1dialog-")} />
          <span className="absolute end-[3%] bottom-[2.5%] rounded-full bg-background/75 px-2.5 py-0.5 backdrop-blur-md">
            <InlineLink href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
              Open sheet ↗
            </InlineLink>
          </span>
        </BaseDialog.Popup>
      </DialogPortal>
    </Dialog>
  );
}

function Sheet({ svg }: { svg: string }) {
  return (
    <span
      className="block [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      // Generated from our own sheet by scripts/build-drawings.mjs.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Plays once, the first time it is visible: the docs sit behind a tab, or below the demo. */
function Film({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      void video.play().catch(() => {});
    }, { threshold: 0.5 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // The film is monochrome on white. Blended onto its own isolated page-coloured ground,
  // multiply turns the white into the app background; in dark mode, inverting first makes the
  // white black, which screen turns into the background too. The ground is local because an
  // ancestor's stacking context would otherwise leave nothing beneath the film to blend with.
  return (
    <span className="isolate block bg-background">
      <video
        ref={ref}
        src={src}
        aria-hidden
        muted
        playsInline
        preload="auto"
        className="block aspect-video w-full mix-blend-multiply dark:mix-blend-screen dark:invert"
      />
    </span>
  );
}
