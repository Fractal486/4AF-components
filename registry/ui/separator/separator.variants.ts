import { cva } from "class-variance-authority";

export const separatorVariants = cva(
  [
    "group/separator shrink-0 bg-border forced-colors:bg-[CanvasText] data-[labeled]:flex data-[labeled]:items-center data-[labeled]:gap-3 data-[labeled]:bg-transparent forced-colors:data-[labeled]:bg-transparent",
    "[--separator-hairline:1px] [@media(min-resolution:2dppx)]:[--separator-hairline:0.5px] [@media(min-resolution:3dppx)]:[--separator-hairline:0.333333px]",
  ],
  {
    variants: {
      orientation: {
        horizontal: "h-(--separator-hairline) w-full data-[labeled]:h-auto",
        vertical: "w-(--separator-hairline) self-stretch data-[labeled]:w-auto data-[labeled]:flex-col",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export const separatorLineVariants = cva(
  "flex-1 bg-border forced-colors:bg-[CanvasText] group-data-[orientation=horizontal]/separator:h-(--separator-hairline) group-data-[orientation=horizontal]/separator:min-w-4 group-data-[orientation=vertical]/separator:w-(--separator-hairline) group-data-[orientation=vertical]/separator:min-h-4",
  {
    variants: {
      side: {
        before: "group-data-[align=start]/separator:hidden",
        after: "group-data-[align=end]/separator:hidden",
      },
    },
  },
);

export const separatorLabelVariants = cva(
  "flex min-w-0 max-w-full items-center gap-1.5 text-center text-xs text-pretty wrap-anywhere text-muted-foreground group-data-[align=start]/separator:text-start group-data-[align=end]/separator:text-end [&>svg]:size-3.5 [&>svg]:shrink-0",
);
