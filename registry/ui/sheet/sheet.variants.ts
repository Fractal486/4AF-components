import { cva, type VariantProps } from "class-variance-authority";

// Positioning and size only. The enter/exit motion lives in the component (Motion),
// because Base UI's CSS-transition exit for Dialog is unreliable — it re-applies the
// starting-style on close, so the panel jumps off-screen instead of animating out.
export const sheetContentVariants = cva(
  "fixed z-50 flex flex-col bg-surface-raised shadow-overlay-drop outline-none",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-96 max-w-[85vw] border-l border-border",
        left: "inset-y-0 left-0 h-full w-96 max-w-[85vw] border-r border-border",
        top: "inset-x-0 top-0 h-80 max-h-[85vh] w-full border-b border-border",
        bottom: "inset-x-0 bottom-0 h-80 max-h-[85vh] w-full border-t border-border",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export type SheetContentVariants = VariantProps<typeof sheetContentVariants>;
