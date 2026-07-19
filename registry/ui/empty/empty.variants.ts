import { cva, type VariantProps } from "class-variance-authority";

/**
 * The media slot's two shapes: `default` is a bare icon/illustration; `icon` wraps it in a
 * muted rounded tile (auto-sizing a plain SVG to `size-6`).
 */
export const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent text-muted-foreground",
        icon: "size-10 rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>;
