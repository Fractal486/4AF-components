"use client";

import { Kbd, type KbdProps } from "@/registry/ui/kbd/kbd";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { LoaderProvider } from "@/registry/lib/loader";
import { dropdownMenuPopupVariants, dropdownMenuPositionerVariants } from "./dropdown-menu.variants";
import { CHECK_MARK, CHECK_SLOT, DisabledReasonTooltip, itemBase } from "./dropdown-menu.shared";

export interface DropdownMenuProps<Payload = unknown> extends BaseMenu.Root.Props<Payload> {
  loader?: ReactNode;
}

export function DropdownMenu<Payload>({ loader, ...props }: DropdownMenuProps<Payload>) {
  return (
    <LoaderProvider loader={loader}>
      <BaseMenu.Root {...props} />
    </LoaderProvider>
  );
}

export const DropdownMenuTrigger = BaseMenu.Trigger;
export const createDropdownMenuHandle = BaseMenu.createHandle;
export type DropdownMenuHandle<Payload = unknown> = BaseMenu.Handle<Payload>;
export type DropdownMenuTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload>;

export const DropdownMenuGroup = BaseMenu.Group;

export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;

/**
 * Moving from one open submenu to a sibling swaps the panels quickly — Base UI only marks that
 * case (`data-instant="group"`) for a menubar. Each panel keeps a registry of its submenus: one
 * opening while a sibling is open, or still fading out, takes a short, slight entrance and
 * shortens the sibling's exit. Ordinary opens and closes keep the full animation.
 */
const SWAP_WINDOW_MS = 300;

interface SubmenuSibling {
  open: boolean;
  closedAt: number;
  setSwapping: (swapping: boolean) => void;
}

const SubmenuSiblingsContext = createContext<Set<SubmenuSibling> | null>(null);
const SubmenuSwapContext = createContext(false);

export function DropdownMenuSub({
  highlightItemOnHover = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof BaseMenu.SubmenuRoot>) {
  const siblings = useContext(SubmenuSiblingsContext);
  const [swapping, setSwapping] = useState(false);
  const self = useRef<SubmenuSibling>(null);
  useEffect(() => {
    if (!siblings) return;
    const entry: SubmenuSibling = { open: false, closedAt: -Infinity, setSwapping };
    self.current = entry;
    siblings.add(entry);
    return () => {
      siblings.delete(entry);
    };
  }, [siblings]);

  return (
    <SubmenuSwapContext.Provider value={swapping}>
      <BaseMenu.SubmenuRoot
        highlightItemOnHover={highlightItemOnHover}
        onOpenChange={(open, details) => {
          const me = self.current;
          if (me && siblings) {
            const now = performance.now();
            if (open) {
              const others = [...siblings].filter(
                (other) => other !== me && (other.open || now - other.closedAt < SWAP_WINDOW_MS),
              );
              for (const other of others) other.setSwapping(true);
              setSwapping(others.length > 0);
            } else {
              // An ordinary close fades out; a sibling opening next will cut it short.
              me.closedAt = now;
              setSwapping(false);
            }
            me.open = open;
          }
          onOpenChange?.(open, details);
        }}
        {...props}
      />
    </SubmenuSwapContext.Provider>
  );
}


/**
 * The library scrollbar inside a menu panel. The viewport stays out of the tab order: the menu
 * scrolls its highlighted row into view, and Tab is not how a menu is moved through.
 */
function MenuScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollArea className="min-h-0" viewportClassName="p-1" viewportProps={{ tabIndex: -1 }}>
      {children}
    </ScrollArea>
  );
}

export type DropdownMenuPortalProps = ComponentProps<typeof BaseMenu.Portal>;
export function DropdownMenuPortal(props: DropdownMenuPortalProps) {
  return <BaseMenu.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export type DropdownMenuPositionerProps = ComponentProps<typeof BaseMenu.Positioner>;
export function DropdownMenuPositioner({ className, sideOffset = 6, collisionPadding = 8, ...props }: DropdownMenuPositionerProps) {
  return <BaseMenu.Positioner data-slot="dropdown-menu-positioner" sideOffset={sideOffset}
    collisionPadding={collisionPadding} {...props}
    className={mergeStateClassName(dropdownMenuPositionerVariants(), className)} />;
}

export type DropdownMenuPopupProps = ComponentProps<typeof BaseMenu.Popup>;
export function DropdownMenuPopup({ className, children, ...props }: DropdownMenuPopupProps) {
  const submenus = useMemo(() => new Set<SubmenuSibling>(), []);
  return <BaseMenu.Popup data-slot="dropdown-menu-content" {...props}
    className={mergeStateClassName(dropdownMenuPopupVariants(), className)}>
    <SubmenuSiblingsContext.Provider value={submenus}>
      <MenuScroll>{children}</MenuScroll>
    </SubmenuSiblingsContext.Provider>
  </BaseMenu.Popup>;
}

export interface DropdownMenuContentProps extends DropdownMenuPopupProps {
  side?: DropdownMenuPositionerProps["side"];
  align?: DropdownMenuPositionerProps["align"];
  sideOffset?: DropdownMenuPositionerProps["sideOffset"];
  alignOffset?: DropdownMenuPositionerProps["alignOffset"];
  /** Legacy shorthand; when supplied, overrides portalProps.keepMounted. */
  keepMounted?: boolean;
  /** Portal container, mounting behavior, refs, and DOM props. */
  portalProps?: Omit<DropdownMenuPortalProps, "children">;
  /** Collision handling, custom anchor, sticky positioning, refs, and state classes. */
  positionerProps?: Omit<DropdownMenuPositionerProps, "side" | "align" | "sideOffset" | "alignOffset" | "children">;
}

/** Convenience composition. Its ref, render, classes, and DOM props belong to the popup. */
export function DropdownMenuContent({
  side = "bottom", align = "start", sideOffset = 6, alignOffset,
  keepMounted, portalProps, positionerProps, ...popupProps
}: DropdownMenuContentProps) {
  return <DropdownMenuPortal {...portalProps} keepMounted={keepMounted ?? portalProps?.keepMounted}>
    <DropdownMenuPositioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} {...positionerProps}>
      <DropdownMenuPopup {...popupProps} />
    </DropdownMenuPositioner>
  </DropdownMenuPortal>;
}

export interface DropdownMenuItemProps extends ComponentProps<typeof BaseMenu.Item> {
  variant?: "default" | "destructive";
  inset?: boolean;
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuItem({
  className,
  variant = "default",
  inset,
  children,
  disabled,
  disabledReason,
  ...props
}: DropdownMenuItemProps) {
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const item = (
    <BaseMenu.Item
      data-slot="dropdown-menu-item" data-variant={variant} data-inset={inset ? "" : undefined}
      className={mergeStateClassName(cn(
        itemBase,
        inset && "pl-8",
        hasReason && "data-[disabled]:pointer-events-auto",
        // Red ink only — the highlight stays the same neutral wash as any other row.
        variant === "destructive" && "text-destructive [&>svg]:text-destructive",
      ), className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  );

  return (
    <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}

export interface DropdownMenuRadioItemProps extends ComponentProps<typeof BaseMenu.RadioItem> {
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuRadioItem({
  className,
  children,
  disabled,
  disabledReason,
  ...props
}: DropdownMenuRadioItemProps) {
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const item = (
    <BaseMenu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={mergeStateClassName(cn(
        itemBase,
        hasReason && "data-[disabled]:pointer-events-auto",
      ), className)}
      disabled={disabled}
      {...props}
    >
      {children}
      {/* `keepMounted` so the slot is reserved while unselected and the check can scale out;
          without it the indicator is presence-gated and can miss the group's first value. */}
      <BaseMenu.RadioItemIndicator
        keepMounted
        data-slot="dropdown-menu-radio-check"
        className={cn(CHECK_SLOT, CHECK_MARK)}
      >
        <Check />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );

  return (
    <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
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
      className={cn("min-w-0 px-2 py-1.5 text-xs font-medium wrap-anywhere text-muted-foreground", inset && "pl-8", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  // A border rather than a one-pixel filled box: the box lands wherever layout puts it and
  // paints across two device rows at a fractional offset, which reads heavier than a border
  // beside it. `SelectSeparator` is drawn the same way, so the two panels agree.
  return (
    <BaseMenu.Separator
      className={mergeStateClassName("-mx-1 my-1 h-0 border-t border-border", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({ className, ...props }: KbdProps) {
  return <Kbd className={cn("ml-auto self-start", className)} {...props} />;
}

export interface DropdownMenuSubTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.SubmenuTrigger>, "children" | "delay"> {
  inset?: boolean;
  children?: ReactNode;
  /** Hover delay in milliseconds. @default 0 */
  delay?: number;
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  delay = 0,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={mergeStateClassName(cn(itemBase, inset && "pl-8"), className)}
      delay={delay}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  side = "right", align = "start", sideOffset = 8, alignOffset = -4, className, ...props
}: DropdownMenuContentProps) {
  // Swapped in from (or out for) a sibling submenu: a quick, slight entrance and exit instead
  // of the full one, so sweeping across sibling rows doesn't wait on each panel.
  const swapping = useContext(SubmenuSwapContext);
  return <DropdownMenuContent data-slot="dropdown-menu-sub-content" side={side} align={align}
    sideOffset={sideOffset} alignOffset={alignOffset} data-swap={swapping ? "" : undefined}
    className={mergeStateClassName(cn(
      "data-swap:duration-(--duration-fast) data-swap:data-[ending-style]:duration-(--duration-fast)",
      "data-swap:data-[starting-style]:scale-[0.98] data-swap:data-[starting-style]:blur-[1px]",
    ), className)} {...props} />;
}
