import { cva, type VariantProps } from "class-variance-authority";

export const classicLoaderVariants = cva(
  [
    "inline-block size-5 shrink-0 select-none align-middle",
    "[&>[data-slot=classic-loader-inner]]:relative [&>[data-slot=classic-loader-inner]]:block",
    "[&>[data-slot=classic-loader-inner]]:top-1/2 [&>[data-slot=classic-loader-inner]]:left-1/2",
    "[&>[data-slot=classic-loader-inner]]:size-full",
    "[&_i]:absolute [&_i]:block [&_i]:top-[-3.9%] [&_i]:left-[-10%]",
    "[&_i]:w-[24%] [&_i]:h-[8%] [&_i]:rounded-[6px] [&_i]:bg-current",
    "[&_i]:animate-classic-fade [&_i]:[animation-duration:var(--classic-cycle,1.2s)]",
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
