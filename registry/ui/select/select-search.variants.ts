import { cva } from "class-variance-authority";

export type SearchSelectInputVariant = "default" | "outline-ghost" | "ghost" | "plain";

/**
 * Select Search's typed field, in the same four looks as Select's trigger. Focus tone and the
 * error border apply to the boxed looks; `ghost` fills on focus, and `plain` owns no surface,
 * edge or horizontal padding, so its leading icon and chevron sit at the text's edges.
 */
export const searchSelectInputVariants = cva(
  [
    "col-start-1 row-start-1 min-w-0 w-full border pl-3.5 text-foreground",
    "outline-none placeholder:text-muted-foreground data-[selected-label]:placeholder:text-foreground",
    "transition-[background-color,border-color,box-shadow,color] duration-(--duration-fast) ease-out",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "[&:is([aria-invalid=true],[data-invalid])]:ring-[3px]! [&:is([aria-invalid=true],[data-invalid])]:ring-destructive/25! [&:is([aria-invalid=true],[data-invalid])]:shadow-none!",
  ],
  {
    variants: {
      variant: {
        default: "border-border bg-surface hover:border-border-strong [&:is([aria-invalid=true],[data-invalid])]:border-destructive!",
        // Button's outline-ghost: the `shadow-border` edge, no fill, a translucent wash on hover.
        "outline-ghost": "border-transparent bg-transparent shadow-border hover:bg-foreground/5 [&:is([aria-invalid=true],[data-invalid])]:border-destructive!",
        // Button's ghost colours, as Select's ghost trigger; focus is the open state.
        ghost: [
          "border-transparent bg-transparent text-muted-foreground",
          "hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
        ],
        // No surface, edge or ring of any kind: the caret marks focus in a typed field.
        plain: "border-0 bg-transparent pl-0",
      },
      tone: { neutral: "", accent: "" },
      // Plain reserves only the chevron and its 8px gap, not the boxed field's side padding.
      size: { sm: "", md: "" },
    },
    compoundVariants: [
      { variant: ["default", "outline-ghost"], tone: "neutral", class: "focus:border-[oklch(0.719_0_0)] focus:shadow-[0_0_0_3px_oklch(0.390_0_0_/_0.502)]" },
      { variant: ["default", "outline-ghost"], tone: "accent", class: "focus:border-ring focus:ring-[3px] focus:ring-ring/25" },
      { variant: "plain", size: "sm", class: "pr-5.5" },
      { variant: "plain", size: "md", class: "pr-6" },
    ],
    defaultVariants: { variant: "default", tone: "neutral", size: "sm" },
  },
);
