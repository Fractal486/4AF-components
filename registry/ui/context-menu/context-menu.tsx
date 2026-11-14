"use client";

/**
 * A menu opened by right click, long press, Shift+F10, or the Menu key on an area.
 *
 * Behaviour is Base UI's Context Menu: it anchors the menu at the pointer, opens on a 500ms
 * long press on touch, and otherwise uses the ordinary Menu parts. Those parts are the same
 * ones Dropdown Menu styles, so rows, shortcuts, submenus, async actions, and nested select
 * panels come from Dropdown Menu unchanged, and the two menus always look alike.
 */

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { mergeStateClassName } from "@/registry/lib/cn";
import { LoaderProvider } from "@/registry/lib/loader";
import {
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  type DropdownMenuContentProps,
  type DropdownMenuPositionerProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { contextMenuTriggerVariants } from "./context-menu.variants";

/** How long a touch must rest before the area shrinks, so taps and scrolls never flicker. */
const HOLD_DELAY = 120;
/** Movement, in pixels, that turns a hold into a scroll or drag and cancels the feedback. */
const HOLD_MOVE_THRESHOLD = 10;

const ContextMenuDisabledContext = createContext(false);

export interface ContextMenuProps extends ComponentProps<typeof BaseContextMenu.Root> {
  /** A default loading indicator for action and deferred checkbox rows. */
  loader?: ReactNode;
}

export function ContextMenu({ loader, disabled = false, ...props }: ContextMenuProps) {
  return (
    <ContextMenuDisabledContext.Provider value={disabled}>
      <LoaderProvider loader={loader}>
        <BaseContextMenu.Root disabled={disabled} {...props} />
      </LoaderProvider>
    </ContextMenuDisabledContext.Provider>
  );
}

export interface ContextMenuTriggerProps extends ComponentProps<typeof BaseContextMenu.Trigger> {
  /** Shrink the area slightly while a long press is held on touch screens. @default true */
  holdFeedback?: boolean;
}

export function ContextMenuTrigger({
  className,
  holdFeedback = true,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  ...props
}: ContextMenuTriggerProps) {
  const disabled = useContext(ContextMenuDisabledContext);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const release = () => {
    clearTimeout(timer.current);
    origin.current = null;
    setHolding(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <BaseContextMenu.Trigger
      data-slot="context-menu-trigger"
      data-holding={holding ? "" : undefined}
      className={mergeStateClassName(contextMenuTriggerVariants(), className)}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        release();
        const touch = event.touches[0];
        if (!holdFeedback || disabled || event.defaultPrevented || event.touches.length !== 1 || !touch) return;
        origin.current = { x: touch.clientX, y: touch.clientY };
        timer.current = setTimeout(() => setHolding(true), HOLD_DELAY);
      }}
      onTouchMove={(event) => {
        onTouchMove?.(event);
        const start = origin.current;
        const touch = event.touches[0];
        if (
          start &&
          (event.touches.length !== 1 ||
            !touch ||
            Math.abs(touch.clientX - start.x) > HOLD_MOVE_THRESHOLD ||
            Math.abs(touch.clientY - start.y) > HOLD_MOVE_THRESHOLD)
        ) {
          release();
        }
      }}
      onTouchEnd={(event) => {
        onTouchEnd?.(event);
        release();
      }}
      onTouchCancel={(event) => {
        onTouchCancel?.(event);
        release();
      }}
      {...props}
    />
  );
}

/**
 * The positioner, anchored at the pointer. No offset by default: the menu's corner sits at
 * the pointer, and the popup's border and padding keep the pointer off the first row.
 */
export function ContextMenuPositioner({ sideOffset = 0, ...props }: DropdownMenuPositionerProps) {
  return <DropdownMenuPositioner data-slot="context-menu-positioner" sideOffset={sideOffset} {...props} />;
}

/**
 * Dropdown Menu's panel, opened at the pointer instead of below a trigger. The same props as
 * `DropdownMenuContent`; its ref, render, classes, and DOM props belong to the popup.
 */
export function ContextMenuContent({
  side = "bottom", align = "start", sideOffset = 0, alignOffset,
  keepMounted, portalProps, positionerProps, ...popupProps
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPortal {...portalProps} keepMounted={keepMounted ?? portalProps?.keepMounted}>
      <ContextMenuPositioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} {...positionerProps}>
        <DropdownMenuPopup data-slot="context-menu-content" {...popupProps} />
      </ContextMenuPositioner>
    </DropdownMenuPortal>
  );
}

export {
  DropdownMenuActionItem as ContextMenuActionItem,
  DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
  DropdownMenuGroup as ContextMenuGroup,
  DropdownMenuItem as ContextMenuItem,
  DropdownMenuLabel as ContextMenuLabel,
  DropdownMenuPopup as ContextMenuPopup,
  DropdownMenuPortal as ContextMenuPortal,
  DropdownMenuRadioGroup as ContextMenuRadioGroup,
  DropdownMenuRadioItem as ContextMenuRadioItem,
  DropdownMenuSelect as ContextMenuSelect,
  DropdownMenuSelectContent as ContextMenuSelectContent,
  DropdownMenuSelectItem as ContextMenuSelectItem,
  DropdownMenuSelectTrigger as ContextMenuSelectTrigger,
  DropdownMenuSeparator as ContextMenuSeparator,
  DropdownMenuShortcut as ContextMenuShortcut,
  DropdownMenuSub as ContextMenuSub,
  DropdownMenuSubContent as ContextMenuSubContent,
  DropdownMenuSubTrigger as ContextMenuSubTrigger,
  type DropdownMenuActionItemProps as ContextMenuActionItemProps,
  type DropdownMenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  type DropdownMenuContentProps as ContextMenuContentProps,
  type DropdownMenuItemProps as ContextMenuItemProps,
  type DropdownMenuPopupProps as ContextMenuPopupProps,
  type DropdownMenuPortalProps as ContextMenuPortalProps,
  type DropdownMenuPositionerProps as ContextMenuPositionerProps,
  type DropdownMenuRadioItemProps as ContextMenuRadioItemProps,
  type DropdownMenuSelectContentProps as ContextMenuSelectContentProps,
  type DropdownMenuSelectItemProps as ContextMenuSelectItemProps,
  type DropdownMenuSelectProps as ContextMenuSelectProps,
  type DropdownMenuSelectTriggerProps as ContextMenuSelectTriggerProps,
  type DropdownMenuSubTriggerProps as ContextMenuSubTriggerProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
