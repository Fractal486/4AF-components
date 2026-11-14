import { cva, type VariantProps } from "class-variance-authority";

export const alertDialogHeaderVariants = cva([
  "has-[>[data-slot=alert-dialog-media]]:grid has-[>[data-slot=alert-dialog-media]]:justify-items-center has-[>[data-slot=alert-dialog-media]]:text-center",
  "sm:has-[>[data-slot=alert-dialog-media]]:grid-cols-[auto_minmax(0,1fr)] sm:has-[>[data-slot=alert-dialog-media]]:gap-x-4 sm:has-[>[data-slot=alert-dialog-media]]:justify-items-start sm:has-[>[data-slot=alert-dialog-media]]:text-start",
]);
export const alertDialogMediaVariants = cva(
  "mb-2 flex size-10 shrink-0 items-center justify-center rounded-lg sm:row-span-2 sm:mb-0 [&>svg]:size-5",
  {
    variants: { variant: {
      default: "bg-muted text-foreground",
      destructive: "bg-destructive/10 text-destructive",
    } },
    defaultVariants: { variant: "default" },
  },
);
export type AlertDialogMediaVariants = VariantProps<typeof alertDialogMediaVariants>;
