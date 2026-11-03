import { cva } from "class-variance-authority";

/**
 * Background feedback is opt-in and follows Base UI's pressed attribute.
 * Solid variants keep their own palette; quiet variants gain a neutral fill.
 */
export const pressedVariants = cva("", {
  variants: {
    variant: {
      ghost: "data-[pressed]:text-foreground data-[fill-background=true]:data-[pressed]:bg-foreground/10 data-[fill-background=true]:data-[pressed]:hover:bg-foreground/15",
      plain: "data-[pressed]:text-foreground data-[fill-background=true]:data-[pressed]:bg-foreground/10 data-[fill-background=true]:data-[pressed]:hover:bg-foreground/15",
      outline: "data-[fill-background=true]:data-[pressed]:bg-foreground/10 data-[fill-background=true]:data-[pressed]:hover:bg-foreground/15",
      "outline-ghost": "data-[fill-background=true]:data-[pressed]:bg-foreground/10 data-[fill-background=true]:data-[pressed]:hover:bg-foreground/15",
      primary: "data-[fill-background=true]:data-[pressed]:bg-primary-hover",
      destructive: "data-[fill-background=true]:data-[pressed]:bg-destructive-hover",
      link: "data-[fill-background=true]:data-[pressed]:bg-foreground/10 data-[fill-background=true]:data-[pressed]:hover:bg-foreground/15",
    },
  },
  defaultVariants: { variant: "ghost" },
});
