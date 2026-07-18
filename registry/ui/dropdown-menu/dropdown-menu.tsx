"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { Morph } from "@/registry/ui/morph/morph";

/**
 * A dropdown menu.
 *
 * Behaviour is Base UI's Menu: keyboard navigation and typeahead, focus into the list and
 * back to the trigger, collision-aware placement, submenus, checkbox and radio items with
 * real roles, and dismissal — none of which a hand-rolled menu gets right.
 *
 * The row highlight is a plain `data-[highlighted]` background with no transition — it has
 * to keep up with arrow-key navigation, and a sliding or fading highlight lags a keypress
 * behind, which reads as lag rather than polish. What *does* animate: the panel enter (a
 * scale-and-blur from the trigger edge off `data-starting-style`, like the popover), and a
 * checkbox tick that draws itself in and blurs out via `Morph` — those are state changes
 * you act on occasionally, not every arrow key.
 */

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

const itemBase = cn(
  "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none select-none",
  // Instant — no transition, so the highlight tracks the keyboard rather than trailing it.
  "data-[highlighted]:bg-muted",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  // Size/inert every glyph, but only mute the *leading* icons (direct children) — the
  // nested check/dot indicators keep the item's foreground ink.
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&>svg]:text-muted-foreground",
);

const popupClassName = cn(
  // Same floating-panel material as the Select/Popover panels.
  "z-50 max-h-[var(--available-height)] min-w-[9rem] overflow-y-auto rounded-md border border-border bg-surface p-1 text-foreground shadow-overlay-drop outline-none",
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
  // Scale-and-blur enter from the trigger edge; only these properties change, so only
  // these are named. Base UI unmounts on transitionend, which fires because it's set.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,filter] duration-(--duration-fast) ease-out",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[4px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[3px]",
);

export interface DropdownMenuContentProps
  extends Omit<ComponentProps<typeof BaseMenu.Popup>, "className"> {
  className?: string;
  side?: ComponentProps<typeof BaseMenu.Positioner>["side"];
  align?: ComponentProps<typeof BaseMenu.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
}

export function DropdownMenuContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <BaseMenu.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface DropdownMenuItemProps extends ComponentProps<typeof BaseMenu.Item> {
  variant?: "default" | "destructive";
  inset?: boolean;
}

export function DropdownMenuItem({
  className,
  variant = "default",
  inset,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        itemBase,
        inset && "pl-8",
        // Red ink only — the highlight stays the same neutral wash as any other row.
        variant === "destructive" && "text-destructive [&>svg]:text-destructive",
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends Omit<ComponentProps<typeof BaseMenu.CheckboxItem>, "render" | "children"> {
  /**
   * `children` may be a function of the checked state — return a different icon and label
   * for each, so a `menuitemcheckbox` can read as a toggle button (Bookmark ⇄ Bookmarked)
   * rather than a ticked row.
   */
  children?: ReactNode | ((checked: boolean) => ReactNode);
  /**
   * The built-in left tick and its `pl-8` indent. Turn it off when the toggle state is
   * carried by the label/icon instead (the bookmark case).
   */
  indicator?: boolean;
  /**
   * Fill the item's icon when checked instead of morphing it — the same glyph, only its
   * weight changing (bookmark, star, heart). It's a `fill` transition on the one element
   * (no swap), which is the honest choice when there's nothing to morph *to*. This is the
   * Toggle's `fillIcon`. Pair with `indicator={false}` so the fill *is* the state.
   */
  fillIcon?: boolean;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  indicator = true,
  fillIcon = false,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      className={cn(
        itemBase,
        indicator && "pr-2 pl-8",
        fillIcon && [
          "[&_svg]:transition-[fill] [&_svg]:duration-(--duration-fast) [&_svg]:ease-out",
          "data-[checked]:[&_svg]:fill-current",
        ],
        className,
      )}
      // Render function to read `checked`: the tick can Morph in and out (draw itself in,
      // blur out) instead of snapping, and `children` can swap on it.
      render={(itemProps, state) => (
        <div {...itemProps}>
          {indicator && (
            <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
              <Morph
                activeKey={state.checked ? "on" : "off"}
                items={{ on: <Check className="size-4" />, off: null }}
              />
            </span>
          )}
          {typeof children === "function" ? children(state.checked) : children}
        </div>
      )}
      {...props}
    />
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseMenu.RadioItem>) {
  return (
    <BaseMenu.RadioItem className={cn(itemBase, "pr-2 pl-8", className)} {...props}>
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        {/* Base UI's own indicator, styled like the standalone Radio's dot. `keepMounted`
            matters: without it the indicator is transition-status-gated and can miss the
            group's initial value on first paint, which is why it showed empty. It scales
            in when selected and out when not. */}
        <BaseMenu.RadioItemIndicator
          keepMounted
          className={cn(
            "size-2 rounded-full bg-primary transition-[scale,opacity] duration-(--duration-fast)",
            "scale-0 opacity-0 data-[checked]:scale-100 data-[checked]:opacity-100",
          )}
        />
      </span>
      {children}
    </BaseMenu.RadioItem>
  );
}

/**
 * A standalone section heading — a plain styled div, so it can sit directly in the content
 * (Base UI's `GroupLabel` throws unless it's inside a `Group`/`RadioGroup`). To label a
 * group for assistive tech, wrap items in `DropdownMenuGroup` and give it an `aria-label`.
 */
export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", inset && "pl-8", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("ml-auto pl-4 text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface DropdownMenuSubTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.SubmenuTrigger>, "children"> {
  inset?: boolean;
  children?: ReactNode;
}

export function DropdownMenuSubTrigger({ className, inset, children, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger className={cn(itemBase, inset && "pl-8", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  children,
  side = "right",
  align = "start",
  sideOffset = 4,
  // Pull up by the popup's own top padding (`p-1`) so the first item lines up with the
  // trigger row rather than sitting a few pixels low.
  alignOffset = -4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <BaseMenu.Popup className={cn(popupClassName, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}
