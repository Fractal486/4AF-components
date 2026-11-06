import { cva, type VariantProps } from "class-variance-authority";

/**
 * A label, its control, and the lines under it. `vertical` stacks them; `horizontal` puts
 * the control first, beside a `FieldContent`, nudging a 16px Checkbox or Radio down 2px to
 * centre on the label's 20px first line (a 20px Switch already does).
 */
export const fieldVariants = cva("group/field flex data-[disabled]:opacity-50", {
  variants: {
    orientation: {
      vertical: "flex-col gap-1.5",
      horizontal:
        "flex-row items-start gap-3 [&>[data-slot=checkbox]]:mt-0.5 [&>[data-slot=radio]]:mt-0.5",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

export const fieldContentVariants = cva("flex min-w-0 flex-1 flex-col gap-1");

export const fieldGroupVariants = cva("flex flex-col gap-5");

/**
 * The fieldset, unstyled as a box. Its fields dim themselves when it is disabled; the legend
 * dims with them.
 */
export const fieldSetVariants = cva(
  "m-0 flex min-w-0 flex-col gap-4 border-0 p-0 data-[disabled]:[&>[data-slot=field-legend]]:opacity-50",
);

export const fieldLegendVariants = cva("text-foreground", {
  variants: {
    variant: {
      legend: "text-base font-semibold",
      label: "text-sm font-medium",
    },
  },
  defaultVariants: { variant: "legend" },
});

/**
 * The label. Medium weight in ink, so it reads above the control's own text. The marker
 * after it (`*` or "(optional)") is muted: colour is a signal, saved for the error.
 */
export const fieldLabelVariants = cva(
  "inline-flex items-baseline gap-1 text-sm leading-5 font-medium text-foreground data-[disabled]:cursor-not-allowed",
);

export const fieldMarkerVariants = cva("font-normal text-muted-foreground", {
  variants: {
    indicator: { required: "", optional: "text-[13px]" },
  },
  defaultVariants: { indicator: "required" },
});

export const fieldDescriptionVariants = cva("text-[13px] leading-5 text-muted-foreground");

/**
 * The error. It fades and unblurs in when the field turns invalid, and on the way out only
 * fades and blurs, without moving.
 */
export const fieldErrorVariants = cva([
  "text-[13px] leading-5 text-destructive",
  "transition-[opacity,filter] duration-(--duration-base) ease-out",
  "data-[starting-style]:opacity-0 data-[starting-style]:blur-[2px] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
]);

/** The status mark: two icons stacked in one 16px box, one shown at a time. */
export const fieldStatusVariants = cva("relative inline-flex size-4 shrink-0");

/**
 * Each status icon. They read the field's own state: the check once the field is edited
 * (`data-dirty`) and valid, the alert while it is invalid. Each pops in with a fade and a
 * slight scale, and leaves with the fade alone: the scale resets once it has gone.
 */
export const fieldStatusIconVariants = cva(
  "absolute inset-0 size-4 scale-75 opacity-0 transition-[opacity,scale] duration-(--duration-base) ease-out [transition-delay:0s,var(--duration-base)]",
  {
    variants: {
      status: {
        valid:
          "text-muted-foreground group-data-[dirty]/field:group-data-[valid]/field:scale-100 group-data-[dirty]/field:group-data-[valid]/field:opacity-100 group-data-[dirty]/field:group-data-[valid]/field:[transition-delay:0s]",
        invalid:
          "text-destructive group-data-[invalid]/field:scale-100 group-data-[invalid]/field:opacity-100 group-data-[invalid]/field:[transition-delay:0s]",
      },
    },
  },
);

export type FieldMarkerVariants = VariantProps<typeof fieldMarkerVariants>;
