import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { createContext, useContext, type ComponentProps } from "react";
import { SidebarContext } from "./sidebar.context";

/** The main column beside the sidebar. `inset` floats it as a card. */
export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  // A provider forced to desktop insets at every width, not only from the breakpoint.
  const forcedDesktop = useContext(SidebarContext)?.mobileOverride === false;
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        forcedDesktop
          ? [
              "peer-data-[variant=inset]:m-2 peer-data-[variant=split-inset]:m-2",
              "peer-data-[variant=inset]:ml-0 peer-data-[variant=split-inset]:ml-0",
              "peer-data-[variant=inset]:rounded-lg peer-data-[variant=split-inset]:rounded-lg",
              "peer-data-[variant=inset]:shadow-border peer-data-[variant=split-inset]:shadow-border",
            ]
          : [
              "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=split-inset]:m-2",
              "md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=split-inset]:ml-0",
              "md:peer-data-[variant=inset]:rounded-lg md:peer-data-[variant=split-inset]:rounded-lg",
              "md:peer-data-[variant=inset]:shadow-border md:peer-data-[variant=split-inset]:shadow-border",
            ],
        className,
      )}
      {...props}
    />
  );
}

/**
 * How a header part folds away into the icon rail, shared by the search field and the tab
 * row. Its grid row closes from the part's own height to 0, whatever that height is, and it
 * drops the header's 8px gap above it and fades. The part is pinned to the bottom of its
 * closing slot, so it slides up and out of the slot's top edge, where the clip cuts it off:
 * it passes under the header row above rather than over it. The clip reaches 4px past the
 * slot so a focus ring isn't cut, still short of the 8px gap. `visibility` holds visible to
 * the end, then takes the part out of the tab order. `minmax(0,1fr)` and `min-w-0` let the
 * part narrow with the sidebar: a grid item otherwise keeps its content's minimum width (a
 * tab row's tabs abreast, an input's intrinsic size) and runs past the collapsing edge. The
 * tab row then shows its own scroll-edge fade on the side it overflows.
 */
export const SIDEBAR_HEADER_FOLD = cn(
  "grid grid-cols-[minmax(0,1fr)] grid-rows-[1fr] transition-[grid-template-rows,margin,opacity,visibility] duration-(--duration-slow) ease-collapse",
  "group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:-mt-2 group-data-[collapsible=icon]:grid-rows-[0fr] group-data-[collapsible=icon]:opacity-0",
);
export const SIDEBAR_HEADER_FOLD_CLIP = "flex min-h-0 min-w-0 flex-col justify-end [clip-path:inset(-4px)]";

export function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    // Collapsing into the icon rail folds the field away with the width, so the rows below
    // rise with the collapse instead of jumping in its first frame. See `SIDEBAR_HEADER_FOLD`.
    <div data-slot="sidebar-input-container" className={SIDEBAR_HEADER_FOLD}>
      <div className={SIDEBAR_HEADER_FOLD_CLIP}>
        <Input
          data-slot="sidebar-input"
          className={cn(
            "h-8 w-full bg-background",
            // An underlined field has no box to fill: it sits on the sidebar's own surface, its
            // text 8px in like a row's content (rather than Input's flush `px-0`), and its line
            // steps up a tone so it still reads against that surface, to the foreground when
            // focused whichever tone the field has.
            // A side holding an icon or an action keeps Input's own room for it.
            "data-[variant=underline]:bg-transparent data-[variant=underline]:text-xs",
            "data-[variant=underline]:not-data-[icon-start]:ps-2 data-[variant=underline]:not-data-[action-end]:pe-2",
            "data-[variant=underline]:not-focus:border-b-border-strong data-[variant=underline]:not-focus:hover:border-b-muted-foreground",
            "data-[variant=underline]:focus:border-b-foreground",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

/**
 * Whether a header button is sharing its row, which is the one thing it can't work out
 * for itself: the same button is full width on its own and content-sized in a pair, and
 * the difference is `flex-basis` in one direction versus the other — a lone button that
 * grew along the header's column axis would stretch to the height of the header.
 */
const SidebarHeaderRowContext = createContext(false);

/**
 * Two header actions side by side, where one would otherwise sit full width.
 *
 * The margin a lone button carries moves up here, so the actions sit the same distance
 * below the title whether there are one or two of them, and the buttons inside split
 * the remaining width evenly after accounting for their content. A button that should stay its own size — an icon beside a labelled
 * action — opts out with `className="flex-none"`.
 *
 * ```tsx
 * <SidebarHeader>
 *   <span>Emails</span>
 *   <SidebarHeaderRow>
 *     <SidebarHeaderButton><Plus />Compose</SidebarHeaderButton>
 *     <SidebarHeaderButton variant="outline"><Search />Search</SidebarHeaderButton>
 *   </SidebarHeaderRow>
 * </SidebarHeader>
 * ```
 */
export function SidebarHeaderRow({ className, ...props }: ComponentProps<"div">) {
  return (
    <SidebarHeaderRowContext.Provider value={true}>
      <div
        data-slot="sidebar-header-row"
        className={cn(
          "mt-2 flex items-center gap-2",
          // Nothing in the row may size itself by its label, or a long one pushes the
          // rest out of the sidebar instead of truncating.
          "[&>*]:min-w-0",
          // Collapsed there is no room for two buttons abreast — two 32px squares
          // against 32px of usable rail — so the row becomes a column and they stack.
          "group-data-[collapsible=icon]:flex-col",
          className,
        )}
        {...props}
      />
    </SidebarHeaderRowContext.Provider>
  );
}

export type SidebarHeaderButtonProps = ButtonProps;

/**
 * A primary action placed directly beneath a sidebar header title: full width on its
 * own, content-sized with a share of the remaining space inside a `SidebarHeaderRow`.
 *
 * Its spacing is part of the component contract, matching the inspector's canonical
 * title/action composition. Consumers should not need local margin adjustments.
 */
export function SidebarHeaderButton({
  className,
  variant = "primary",
  size = "sm",
  ...props
}: SidebarHeaderButtonProps) {
  const inRow = useContext(SidebarHeaderRowContext);

  return (
    <Button
      data-slot="sidebar-header-button"
      variant={variant}
      size={size}
      className={cn(
        inRow
          ? [
              // Start at the content width, share extra space, and allow shrinking.
              "flex-auto",
              // Stacked into the rail, each one is a square again.
              "group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex-none",
            ]
          : "mt-2 w-full justify-start",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseSeparator>) {
  return (
    <BaseSeparator
      data-slot="sidebar-separator"
      className={cn("mx-2 h-px w-auto bg-border", className)}
      {...props}
    />
  );
}

/**
 * The scrolling middle of the sidebar. `className` styles the scrolling element itself.
 *
 * Only the vertical axis scrolls. Collapsed, the labels are wider than the rail and the column
 * is shorter than the nav, so it clips instead: no scrollbar appearing every time it closes.
 * `!` because Base UI sets the viewport's overflow inline.
 */
export function SidebarContent({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <ScrollArea
      data-slot="sidebar-content"
      className="min-h-0 flex-1 group-data-[collapsible=icon]:[&>[data-orientation=vertical]]:hidden"
      viewportClassName={cn(
        "flex flex-col gap-2 overflow-x-hidden!",
        "group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:overflow-hidden!",
        // Closes with the width, rather than shifting every group up in the first frame.
        "transition-[gap] duration-(--duration-slow) ease-collapse",
        className,
      )}
      {...props}
    >
      {children}
    </ScrollArea>
  );
}

/* -- Groups --------------------------------------------------------------------------- */

export function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn(
        "relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:pb-0",
        "transition-[padding] duration-(--duration-slow) ease-collapse",
        // Collapsed section labels disappear; preserve the boundary above each
        // subsequent section as a short line in the icon rail.
        "not-first:group-data-[collapsible=icon]:before:pointer-events-none not-first:group-data-[collapsible=icon]:before:absolute not-first:group-data-[collapsible=icon]:before:top-0 not-first:group-data-[collapsible=icon]:before:left-1/2 not-first:group-data-[collapsible=icon]:before:h-px not-first:group-data-[collapsible=icon]:before:w-4 not-first:group-data-[collapsible=icon]:before:-translate-x-1/2 not-first:group-data-[collapsible=icon]:before:bg-border not-first:group-data-[collapsible=icon]:before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-[8px] px-2 text-xs font-medium text-subtle-foreground",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Collapsing pulls the label up into its own height and fades it, so the rows
        // close the gap rather than leaving a hole where the heading was.
        "transition-[margin,opacity] duration-(--duration-slow) ease-collapse",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      className={cn(
        // The 14px inset centers this 16px glyph on the same vertical line as a menu
        // row's trailing icon inside its 8px right padding.
        "absolute top-3.5 right-3.5 flex aspect-square w-5 cursor-default items-center justify-center rounded-[6px] p-0",
        "text-muted-foreground outline-none hover:bg-transparent hover:text-white",
        "focus-visible:ring-2 focus-visible:ring-ring",
        // A 20px control is under the comfortable touch target, so the hit area is
        // widened on pointer-coarse devices without moving the glyph.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}
