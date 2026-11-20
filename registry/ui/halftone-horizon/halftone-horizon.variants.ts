import { cva } from "class-variance-authority";

// `isolate` gives the canvas its own stacking context, so it can sit at -z-10 behind
// children without escaping beneath the root's own background.
export const halftoneHorizonVariants = cva("relative isolate overflow-hidden bg-background");

// The canvas fades in over the CSS gradient once its first frame is drawn. Without WebGL
// it never becomes ready and the gradient remains the background.
export const halftoneHorizonCanvasVariants = cva(
  "pointer-events-none absolute inset-0 -z-10 block size-full opacity-0 transition-[opacity] duration-(--duration-slower) ease-out data-ready:opacity-100",
);
