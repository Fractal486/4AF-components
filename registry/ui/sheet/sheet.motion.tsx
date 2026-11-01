"use client";

import { useRender } from "@base-ui/react/use-render";
import type { Dialog } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import type { ComponentProps, CSSProperties, Ref } from "react";

// Base UI resolves its state and DOM events first. Keep those props separate from
// Motion's similarly named gesture events, then animate the same rendered element.
function createAnimatedSurface<State>() {
  return motion.create(function SheetSurface({ elementProps, render, state, ref, style }: {
    elementProps: ComponentProps<"div">;
    render?: useRender.RenderProp<State>;
    state: State;
    ref?: Ref<HTMLDivElement>;
    style?: CSSProperties;
  }) {
    return useRender({
      render: typeof render === "function" ? (props) => render(props, state) : render,
      ref: [ref ?? null, elementProps.ref ?? null],
      props: { ...elementProps, style: { ...elementProps.style, ...style } },
    });
  });
}

export const SheetPanelSurface = createAnimatedSurface<Dialog.Popup.State>();
export const SheetOverlaySurface = createAnimatedSurface<Dialog.Backdrop.State>();
