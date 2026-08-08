import { cva, type VariantProps } from "class-variance-authority";

/**
 * Two appearances, and they differ in one thing only: whether the disclosure owns a
 * surface. `plain` is a bare row in the flow of a page — a tree node, a "show more".
 * `card` is a self-contained section that keeps its content inside a panel.
 */
export const collapsibleVariants = cva("", {
  variants: {
    variant: {
      plain: "",
      // Concentric: rounded-xl (14px) with p-1 (4px) holds rounded-lg (10px) children,
      // so the trigger's corners sit parallel to the card's rather than inside them at
      // the wrong curve. shadow-border, not border — it's elevation, not separation.
      card: "rounded-xl bg-surface p-1 shadow-border",
    },
  },
  defaultVariants: { variant: "plain" },
});

export const collapsibleTriggerVariants = cva(
  [
    "group/collapsible-trigger flex w-full cursor-pointer items-center gap-2",
    "text-left text-sm font-medium select-none",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Only the colours change here — the chevron's rotation is named on the chevron
    // itself, so neither element is watching properties it never animates.
    "transition-[background-color,color] duration-(--duration-fast) ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        /* The negative inline margin cancels the row's own padding, so the label lines
           up with the prose above and below it while the hit area still extends past
           the text. A row with no surface shouldn't indent itself. */
        plain:
          "-mx-2 rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground data-[panel-open]:text-foreground",
        card: "rounded-lg px-3 py-2 text-foreground hover:bg-muted",
      },
    },
    defaultVariants: { variant: "plain" },
  },
);

/**
 * The panel — the only element in this library that transitions a layout property, and the
 * reason why is in `collapsible.tsx`. Its one job is to open the space; the content inside
 * it isn't clipped and doesn't move.
 *
 * Base UI measures the panel and publishes `--collapsible-panel-height`; once the panel is
 * open and settled it resets that var to `auto`, so content that grows later (a nested
 * disclosure, a loaded image) isn't stuck at the height it was measured at.
 *
 * **No `overflow-hidden`.** Clipping would reveal the content top-down as the panel grows,
 * which reads as a wipe over text that is otherwise standing still. Without it the content
 * simply fades in where it will end up, and the height transition does nothing but move
 * the rows below out of the way — which was the only thing it was ever needed for. The
 * content does overhang the following row for the length of the transition, but it's
 * transparent at the moment the overhang is largest, so there's nothing to see. It also
 * means a focus ring inside the content isn't cropped, which a clip would have done.
 *
 * The panel carries no padding of its own, deliberately: padding is part of the box, so a
 * padded element at `h-0` is still padding-tall and the panel could never close flush.
 * That's the inner content box's job.
 */
export const collapsiblePanelVariants = cva([
  "group/collapsible-panel h-(--collapsible-panel-height)",
  "transition-[height] duration-(--duration-base) ease-out",
  "data-[starting-style]:h-0 data-[ending-style]:h-0",
]);

/** The content inside the panel: padding, and the fade that lands it. */
export const collapsibleContentVariants = cva(
  [
    // A dissolve and nothing more. No translate: the content belongs at its final position
    // from the first frame, and anything that moves it competes with the space opening
    // underneath. `blur-0` is the resting filter so the transition interpolates from
    // blur(3px) rather than from `none`, which some browsers refuse to tween.
    "blur-0 transition-[opacity,filter] duration-(--duration-base) ease-out",
    // Keyed off the panel, because that's the element Base UI puts the attributes on.
    "group-data-[starting-style]/collapsible-panel:opacity-0",
    "group-data-[starting-style]/collapsible-panel:blur-[3px]",
    "group-data-[ending-style]/collapsible-panel:opacity-0",
    "group-data-[ending-style]/collapsible-panel:blur-[2px]",
  ],
  {
    variants: {
      variant: {
        plain: "pt-2 text-sm text-muted-foreground",
        card: "px-3 pt-1 pb-2.5 text-sm text-muted-foreground",
      },
    },
    defaultVariants: { variant: "plain" },
  },
);

export type CollapsibleVariants = VariantProps<typeof collapsibleVariants>;
