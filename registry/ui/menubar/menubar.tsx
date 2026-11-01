"use client";

/**
 * A desktop-style bar of menus.
 *
 * Behaviour is Base UI's Menubar: one tab stop with arrow keys between menus, and once a
 * menu is open, sweeping the pointer or pressing an arrow key opens its neighbour. Each
 * menu is a Dropdown Menu, so rows, shortcuts, submenus, async actions, and nested select
 * panels are the same parts with the same styling.
 *
 * Moving between open menus switches the panels instantly (Base UI marks them
 * `data-instant="group"`), and one highlight slides behind the triggers to show where the
 * open menu moved. Opening from a closed bar and closing keep the menu's normal motion.
 */

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { mergeStateClassName } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import {
  DropdownMenu,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  type DropdownMenuProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { useMenubarHighlight } from "./menubar.highlight";
import {
  menubarHighlightVariants,
  menubarTriggerVariants,
  menubarVariants,
} from "./menubar.variants";

export type MenubarSize = "sm" | "md";
export type MenubarOrientation = "horizontal" | "vertical";

interface MenubarContextValue {
  size: MenubarSize;
  orientation: MenubarOrientation;
}

const MenubarContext = createContext<MenubarContextValue>({ size: "md", orientation: "horizontal" });

export interface MenubarProps extends ComponentProps<typeof BaseMenubar> {
  /** Tabs' outlined track, or none for a bar inside an existing header. @default "outline" */
  variant?: "outline" | "plain";
  /** Trigger height and text: 30px and 34px bars. @default "md" */
  size?: MenubarSize;
}

export function Menubar({
  className,
  variant = "outline",
  size = "md",
  orientation = "horizontal",
  children,
  ref,
  ...props
}: MenubarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(ref, barRef);
  useMenubarHighlight(barRef, highlightRef);
  const context = useMemo(() => ({ size, orientation }), [size, orientation]);

  return (
    <MenubarContext.Provider value={context}>
      <BaseMenubar
        ref={mergedRef}
        orientation={orientation}
        data-slot="menubar"
        data-variant={variant}
        data-size={size}
        className={mergeStateClassName(menubarVariants({ variant, size, orientation }), className)}
        {...props}
      >
        <span
          ref={highlightRef}
          aria-hidden
          data-slot="menubar-highlight"
          className={menubarHighlightVariants({ size })}
        />
        {children}
      </BaseMenubar>
    </MenubarContext.Provider>
  );
}

export type MenubarMenuProps<Payload = unknown> = DropdownMenuProps<Payload>;

/** One menu in the bar: a Dropdown Menu root, with the same open, loader, and handle API. */
export function MenubarMenu<Payload>(props: MenubarMenuProps<Payload>) {
  return <DropdownMenu {...props} />;
}

export type MenubarTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload>;

export function MenubarTrigger<Payload>({ className, children, ...props }: MenubarTriggerProps<Payload>) {
  const { size, orientation } = useContext(MenubarContext);
  const icons = iconLayout(children);

  return (
    <BaseMenu.Trigger
      {...props}
      data-slot="menubar-trigger"
      data-icon-start={icons.start || undefined}
      data-icon-only={icons.only || undefined}
      className={mergeStateClassName(menubarTriggerVariants({ size, orientation }), className)}
    >
      {children}
    </BaseMenu.Trigger>
  );
}

/**
 * The menu panel, placed for the bar: below a horizontal bar, beside a vertical one, and
 * clear of the bar's padding. With `align="start"` the rows' labels line up with the
 * trigger's label (horizontal) or the first row with the trigger (vertical).
 */
export function MenubarContent({
  side,
  align = "start",
  sideOffset,
  alignOffset,
  className,
  ...props
}: DropdownMenuContentProps) {
  const { size, orientation } = useContext(MenubarContext);
  const vertical = orientation === "vertical";
  // Popup border (1px) + scroll padding (4px), then the row's 10px label inset against
  // the trigger's 10px (md) or 8px (sm).
  const labelOffset = vertical ? -5 : size === "sm" ? -7 : -5;

  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      side={side ?? (vertical ? "inline-end" : "bottom")}
      align={align}
      // The bar's border and padding plus a 4px gap.
      sideOffset={sideOffset ?? 8}
      alignOffset={alignOffset ?? (align === "start" ? labelOffset : 0)}
      className={mergeStateClassName("data-[instant=group]:transition-none", className)}
      {...props}
    />
  );
}

export {
  DropdownMenuActionItem as MenubarActionItem,
  DropdownMenuCheckboxItem as MenubarCheckboxItem,
  DropdownMenuGroup as MenubarGroup,
  DropdownMenuItem as MenubarItem,
  DropdownMenuLabel as MenubarLabel,
  DropdownMenuPortal as MenubarPortal,
  DropdownMenuRadioGroup as MenubarRadioGroup,
  DropdownMenuRadioItem as MenubarRadioItem,
  DropdownMenuSelect as MenubarSelect,
  DropdownMenuSelectContent as MenubarSelectContent,
  DropdownMenuSelectItem as MenubarSelectItem,
  DropdownMenuSelectTrigger as MenubarSelectTrigger,
  DropdownMenuSeparator as MenubarSeparator,
  DropdownMenuShortcut as MenubarShortcut,
  DropdownMenuSub as MenubarSub,
  DropdownMenuSubContent as MenubarSubContent,
  DropdownMenuSubTrigger as MenubarSubTrigger,
  type DropdownMenuActionItemProps as MenubarActionItemProps,
  type DropdownMenuCheckboxItemProps as MenubarCheckboxItemProps,
  type DropdownMenuContentProps as MenubarContentProps,
  type DropdownMenuItemProps as MenubarItemProps,
  type DropdownMenuRadioItemProps as MenubarRadioItemProps,
  type DropdownMenuSelectContentProps as MenubarSelectContentProps,
  type DropdownMenuSelectItemProps as MenubarSelectItemProps,
  type DropdownMenuSelectProps as MenubarSelectProps,
  type DropdownMenuSelectTriggerProps as MenubarSelectTriggerProps,
  type DropdownMenuSubTriggerProps as MenubarSubTriggerProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";

/**
 * `data-icon-start` shaves the leading padding for a leading glyph, as Button does;
 * `data-icon-only` squares a trigger whose only content is an element. Fragments are
 * flattened so conditional icons count.
 */
function iconLayout(children: ReactNode) {
  const parts = flatten(children);
  return {
    start: parts.length > 1 && isValidElement(parts[0]),
    only: parts.length === 1 && isValidElement(parts[0]),
  };
}

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children)
      : [child],
  );
}
