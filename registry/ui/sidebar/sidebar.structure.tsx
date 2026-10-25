import { cn } from "@/registry/lib/cn";
import { Slot } from "@/registry/lib/slot";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { createContext, useContext, type ComponentProps } from "react";

export const SIDEBAR_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

/** The main column beside the sidebar. `inset` floats it as a card. */
export function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=split-inset]:m-2",
        "md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=split-inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-lg md:peer-data-[variant=split-inset]:rounded-lg",
        "md:peer-data-[variant=inset]:shadow-border md:peer-data-[variant=split-inset]:shadow-border",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      className={cn("h-8 w-full bg-background", className)}
      {...props}
    />
  );
}

/**
 * Whether a header button is sharing its row, which is the one thing it can't work out
 * for itself: the same button is full width on its own and half of it in a pair, and
 * the difference is `flex-basis` in one direction versus the other — a lone button that
 * grew along the header's column axis would stretch to the height of the header.
 */
const SidebarHeaderRowContext = createContext(false);

/**
 * Two header actions side by side, where one would otherwise sit full width.
 *
 * The margin a lone button carries moves up here, so the actions sit the same distance
 * below the title whether there are one or two of them, and the buttons inside split
 * the width evenly. A button that should stay its own size — an icon beside a labelled
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
 * own, an equal share of the row inside a `SidebarHeaderRow`.
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
              // An equal share of the row, and centred — the label has too little
              // width left to read as a row of its own the way a full-width one does.
              // `flex-1` also clears the Button's `shrink-0`, which would otherwise
              // hold both buttons at their label width and overflow the sidebar.
              "flex-1",
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

export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        SIDEBAR_SCROLLBAR,
        // Collapsed, the labels are wider than the rail; clipping beats a scrollbar
        // appearing every time the sidebar closes.
        "group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:gap-0",
        className,
      )}
      {...props}
    />
  );
}

/* -- Groups --------------------------------------------------------------------------- */

export function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn(
        "relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:pb-0",
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
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-subtle-foreground",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Collapsing pulls the label up into its own height and fades it, so the rows
        // close the gap rather than leaving a hole where the heading was.
        "transition-[margin,opacity] duration-(--duration-slow) ease-out",
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
