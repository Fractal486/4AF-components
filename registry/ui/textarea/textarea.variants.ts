import { cva } from "class-variance-authority";

export const textareaVariants = cva("block h-auto resize-none py-2", {
  variants: {
    autoResize: {
      // Height animation intentionally reflows the surrounding form as lines are added.
      true: "min-h-0 transition-[height,border-color,box-shadow,color,opacity] duration-(--duration-base) ease-out",
      false: "min-h-16",
    },
    grip: { true: "pb-4", false: "" },
  },
});
