import { cva, type VariantProps } from "class-variance-authority";

export const classicLoaderVariants = cva(
  [
    "inline-block size-5 shrink-0 select-none align-middle",
    "[&>[data-slot=classic-loader-inner]]:block [&>[data-slot=classic-loader-inner]]:size-full",
    "[&_rect]:fill-current",
    "[&_rect]:animate-classic-fade [&_rect]:[animation-duration:var(--classic-cycle,1.2s)]",
  ],
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-8",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type ClassicLoaderVariants = VariantProps<typeof classicLoaderVariants>;
