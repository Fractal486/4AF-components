import { cva } from "class-variance-authority";

export const asciiLoaderVariants = cva([
  "inline-block font-mono leading-none tabular-nums",
  // The fallback Braille font sits slightly left within its cell. Correct the cell,
  // consistently across frames, rather than moving each frame's changing ink.
  "translate-x-[0.3px]",
]);
