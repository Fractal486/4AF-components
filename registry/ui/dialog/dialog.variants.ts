import { cva } from "class-variance-authority";

// Each portal is a layer: a nested backdrop must sit above the parent's popup.
export const dialogPortalVariants = cva("relative z-50");

export const dialogBackdropVariants = cva([
  "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-nested:bg-black/25",
  "opacity-100 transition-[opacity] duration-(--duration-slow) ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast)",
]);

export const dialogPopupVariants = cva([
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-1/2",
  "min-w-0 overflow-hidden rounded-md border border-border material-glass text-foreground shadow-overlay-drop outline-none",
  // Height is intentionally animated: the frame follows changing content around its centre.
  // The shorter surface transitions preserve the asymmetric scale-in / fade-out entrance.
  "opacity-100 scale-100 blur-none transition-[height,opacity,scale,translate,filter] ease-out",
  "[transition-duration:var(--duration-slower),var(--duration-slow),var(--duration-slow),var(--duration-slow),var(--duration-slow)]",
  "data-starting-style:opacity-0 data-starting-style:scale-96 data-starting-style:blur-[4px]",
  "data-ending-style:opacity-0 data-ending-style:blur-[8px] data-ending-style:duration-(--duration-base)",
  "data-nested-dialog-open:scale-[max(0.8,calc(1-0.04*var(--nested-dialogs)))]",
  "data-nested-dialog-open:-translate-y-[calc(50%+0.5rem*var(--nested-dialogs))]",
  "motion-reduce:[transition-property:height,opacity] motion-reduce:data-starting-style:scale-100 motion-reduce:data-starting-style:blur-none motion-reduce:data-ending-style:blur-none",
  "motion-reduce:data-nested-dialog-open:scale-100 motion-reduce:data-nested-dialog-open:-translate-y-1/2",
]);

export const dialogLayoutVariants = cva([
  "flex min-w-0 shrink-0 flex-col gap-4 p-6",
  "has-[>[data-slot=dialog-body]]:min-h-0 has-[>[data-slot=dialog-body]]:flex-1 has-[>[data-slot=dialog-body]]:shrink",
]);

export const dialogBodyVariants = cva("min-h-0 min-w-0 flex-1");
export const dialogBodyContentVariants = cva("min-w-0 space-y-4 wrap-anywhere");
export const dialogHeaderVariants = cva("flex min-w-0 shrink-0 flex-col gap-1.5 data-close:pe-6");
export const dialogFooterVariants = cva("flex min-w-0 shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end");
export const dialogTitleVariants = cva("min-w-0 text-base font-semibold text-pretty wrap-anywhere text-foreground");
export const dialogDescriptionVariants = cva([
  "min-w-0 text-sm text-pretty wrap-anywhere text-muted-foreground",
  "[&_p+p]:mt-2 [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-muted-foreground/50",
  "[&_a:hover]:text-foreground [&_a:hover]:decoration-foreground [&_a:focus-visible]:rounded-xs [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-ring",
]);
