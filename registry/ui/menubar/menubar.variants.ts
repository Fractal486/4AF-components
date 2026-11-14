import { cva, type VariantProps } from "class-variance-authority";

/**
 * The bar, drawn as Tabs' outlined segment track: a 1px border around 3px of padding.
 * Concentric through the border (outer = trigger + padding + border), so 4px and 3px
 * triggers round to 8px and 7px. With 26px and 22px triggers the bar lands on 34px and
 * 30px, the md and sm control heights, so it lines up beside an Input, Select, or Button.
 *
 * The bar scrolls instead of wrapping when it runs out of room; the scrollbar is hidden
 * because the open trigger is always scrolled into view by focus.
 */
export const menubarVariants = cva(
  [
    "group/menubar relative isolate flex w-fit max-w-full min-w-0 gap-[3px] border p-[3px] text-foreground outline-none",
    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  ],
  {
    variants: {
      variant: {
        // Tabs' outline track: a bordered, unfilled bar.
        outline: "border-border",
        // No visible track, for a bar inside an existing header or toolbar. The border stays
        // transparent so both variants share geometry and menu offsets.
        plain: "border-transparent",
      },
      size: {
        sm: "rounded-[7px]",
        md: "rounded-[8px]",
      },
      orientation: {
        horizontal: "items-center overflow-x-auto",
        vertical: "flex-col items-stretch overflow-y-auto",
      },
    },
    defaultVariants: { variant: "outline", size: "md", orientation: "horizontal" },
  },
);

export const menubarTriggerVariants = cva(
  [
    // Above the highlight, which sits behind the triggers at z-0.
    "relative z-10 inline-flex shrink-0 cursor-default items-center gap-1.5",
    "font-medium whitespace-nowrap select-none text-foreground outline-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&>svg]:text-muted-foreground",
    // Instant, like a menu row's highlight, so the fill hands over to the sliding
    // highlight without a cross-fade dip. While any menu is open the highlight owns the
    // fill; hover fills would otherwise reveal where the pointer is ahead of the slide.
    "hover:bg-muted group-data-[has-submenu-open]/menubar:hover:bg-transparent",
    // Inset, so the bar's padding and overflow never clip it.
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    // Icon-only triggers are square.
    "data-[icon-only]:justify-center data-[icon-only]:px-0",
  ],
  {
    variants: {
      size: {
        sm: "h-[22px] rounded-[3px] px-2 text-xs [&_svg]:size-3.5 data-[icon-start]:ps-1.5 data-[icon-only]:w-[22px]",
        md: "h-[26px] rounded-[4px] px-2.5 text-sm [&_svg]:size-4 data-[icon-start]:ps-2 data-[icon-only]:w-[26px]",
      },
      orientation: {
        horizontal: "",
        vertical: "justify-start",
      },
    },
    defaultVariants: { size: "md", orientation: "horizontal" },
  },
);

/**
 * The open trigger's fill, one element for the whole bar so it can slide between menus.
 * `Menubar` writes the trigger's box into the custom properties.
 *
 * Width and height transition alongside `translate` because triggers differ in width and
 * scaling would distort the rounded corners. The element is absolutely positioned, so the
 * size change lays out only itself.
 *
 * It appears in place without fading, so a hovered trigger's fill hands over without a dip,
 * and fades out when the last menu closes. `data-instant` suppresses the slide for the
 * first placement and for resizes.
 */
export const menubarHighlightVariants = cva(
  [
    "pointer-events-none absolute top-0 left-0 z-0 bg-muted opacity-0",
    "h-(--menubar-highlight-height) w-(--menubar-highlight-width)",
    "translate-x-(--menubar-highlight-x) translate-y-(--menubar-highlight-y)",
    "transition-[translate,width,height,opacity] ease-out",
    "[transition-duration:var(--duration-base),var(--duration-base),var(--duration-base),var(--duration-fast)]",
    "data-[visible]:opacity-100 data-[instant]:transition-none",
  ],
  {
    variants: {
      size: { sm: "rounded-[3px]", md: "rounded-[4px]" },
    },
    defaultVariants: { size: "md" },
  },
);

export type MenubarVariants = VariantProps<typeof menubarVariants>;
