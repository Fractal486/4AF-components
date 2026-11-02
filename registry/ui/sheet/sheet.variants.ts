import { cva, type VariantProps } from "class-variance-authority";

// Positioning and size only. The enter/exit motion lives in the component (Motion),
// because Base UI's CSS-transition exit for Dialog is unreliable — it re-applies the
// starting-style on close, so the panel jumps off-screen instead of animating out.
export const sheetContentVariants = cva(
  "fixed z-50 flex min-h-0 max-h-dvh min-w-0 flex-col overflow-y-auto overscroll-contain material-glass shadow-overlay-drop outline-none forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
  {
    variants: {
      side: {
        right: "top-0 right-0 h-dvh w-96 max-w-[85vw] border-l border-border",
        left: "top-0 left-0 h-dvh w-96 max-w-[85vw] border-r border-border",
        top: "inset-x-0 top-0 h-auto max-h-[85dvh] w-full border-b border-border",
        bottom: "inset-x-0 bottom-0 h-auto max-h-[85dvh] w-full border-t border-border",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export type SheetContentVariants = VariantProps<typeof sheetContentVariants>;

export const sheetOverlayVariants = cva("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm forced-colors:bg-[Canvas]/50 forced-colors:backdrop-blur-none");
export const sheetHeaderVariants = cva("flex min-w-0 shrink-0 flex-col gap-1.5 p-5 data-[show-close]:pr-16");
export const sheetBodyVariants = cva("min-w-0 px-5 wrap-anywhere");
export const sheetFooterVariants = cva("mt-auto flex shrink-0 flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end");
export const sheetTitleVariants = cva("min-w-0 text-base font-semibold text-pretty wrap-anywhere text-foreground");
export const sheetDescriptionVariants = cva("min-w-0 text-sm text-pretty wrap-anywhere text-muted-foreground");
