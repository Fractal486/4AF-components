"use client";

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

// Keep the installable component's public API at this entry point.
export {
  DropdownMenuActionItem,
  DropdownMenuCheckboxItem,
  type DropdownMenuActionItemProps,
  type DropdownMenuCheckboxItemProps,
} from "./dropdown-menu.actions";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSubTriggerProps,
} from "./dropdown-menu.menu";
export {
  DropdownMenuSelect,
  DropdownMenuSelectContent,
  DropdownMenuSelectItem,
  DropdownMenuSelectTrigger,
  type DropdownMenuSelectContentProps,
  type DropdownMenuSelectItemProps,
  type DropdownMenuSelectProps,
  type DropdownMenuSelectTriggerProps,
} from "./dropdown-menu.select";
