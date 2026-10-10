import { cva, type VariantProps } from "class-variance-authority";

/**
 * The trail's one versions axis is its scale. Everything inside — the separator glyph, the
 * ellipsis box, icons inside links — is sized from the list, so a single `size` keeps the
 * parts in proportion instead of each part carrying its own.
 */
export const breadcrumbListVariants = cva(
  "flex min-w-0 flex-wrap items-center text-muted-foreground wrap-anywhere",
  {
    variants: {
      size: {
        sm: [
          "gap-1 text-xs",
          "[&_[data-slot=breadcrumb-separator]>svg]:size-3",
          "[&_[data-slot=breadcrumb-link]>svg]:size-3.5 [&_[data-slot=breadcrumb-page]>svg]:size-3.5",
          "[&_[data-slot=breadcrumb-ellipsis]]:size-5 [&_[data-slot=breadcrumb-ellipsis]>svg]:size-3.5",
        ],
        md: [
          "gap-1.5 text-sm",
          "[&_[data-slot=breadcrumb-separator]>svg]:size-3.5",
          "[&_[data-slot=breadcrumb-link]>svg]:size-4 [&_[data-slot=breadcrumb-page]>svg]:size-4",
          "[&_[data-slot=breadcrumb-ellipsis]]:size-6 [&_[data-slot=breadcrumb-ellipsis]>svg]:size-4",
        ],
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type BreadcrumbListVariants = VariantProps<typeof breadcrumbListVariants>;
