import { cn } from "@/registry/lib/cn";
import { radioVariants } from "@/registry/ui/radio/radio.variants";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { LoaderProvider } from "@/registry/lib/loader";
import { DisabledReasonTooltip, INDICATOR_SLOT, itemBase } from "./dropdown-menu.shared";

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

export const DropdownMenuGroup = BaseMenu.Group;

export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;

export function DropdownMenuSub({
  highlightItemOnHover = false,
  ...props
}: ComponentProps<typeof BaseMenu.SubmenuRoot>) {
  return <BaseMenu.SubmenuRoot highlightItemOnHover={highlightItemOnHover} {...props} />;
}

const popupClassName = cn(
  // Same floating-panel material as the Select/Popover panels.
  "z-50 max-h-[var(--available-height)] min-w-50 overflow-y-auto rounded-md border border-border bg-surface p-1 text-foreground shadow-overlay-drop outline-none",
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
  // Scale-and-blur enter from the trigger edge; only these properties change, so only
  // these are named. Base UI unmounts on transitionend, which fires because it's set.
  //
  // The Select family's numbers exactly — 0.95 and 3px in, 0.97 and 2px out, over
  // `--duration-base`. A menu and a select panel are the same object to a user: a list of
  // choices hanging off a control, often sat next to each other in the same toolbar. Two
  // lists that open at different speeds is a difference you feel without being able to name.
  "origin-[var(--transform-origin)] blur-0",
  "transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
);

export interface DropdownMenuContentProps
  extends Omit<ComponentProps<typeof BaseMenu.Popup>, "className"> {
  className?: string;
  side?: ComponentProps<typeof BaseMenu.Positioner>["side"];
  align?: ComponentProps<typeof BaseMenu.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
  /** Keep the popup mounted while closed when its contents need to register state early. */
  keepMounted?: boolean;
}

export function DropdownMenuContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  keepMounted = false,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
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
      className={cn(
        itemBase,
        inset && "pl-8",
        hasReason && "data-[disabled]:pointer-events-auto",
        // Red ink only — the highlight stays the same neutral wash as any other row.
        variant === "destructive" && "text-destructive [&>svg]:text-destructive",
        className,
      )}
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
      className={cn(
        itemBase,
        "pr-2 pl-8",
        hasReason && "data-[disabled]:pointer-events-auto",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span className={INDICATOR_SLOT}>
        {/* Radio's own circle — the same recessed well — drawn rather than nested, as a real
            Radio is a button. Sized to the row's 14px slot. Its 1.5px border leaves 11px
            inside, and the dot is inset 2px on every side, making it 7px. Whole-pixel insets
            rather than `left-1/2` plus a translate: on an odd-sized dot that translate is
            half a pixel, which the scale animation draws sub-pixel and the resting dot snaps
            off, so the two disagreed on its size. */}
        <span
          data-slot="dropdown-menu-radio"
          className={cn(radioVariants({ size: "sm" }), "size-3.5 cursor-default")}
        >
          {/* Base UI's own indicator, styled like the standalone Radio's dot. `keepMounted`
              matters: without it the indicator is
              transition-status-gated and can miss the group's initial value on first paint,
              which is why it showed empty. It scales in when selected and out when not. */}
          <BaseMenu.RadioItemIndicator
            keepMounted
            className={cn(
              "absolute inset-[2px] rounded-full bg-primary",
              "scale-0 opacity-0 transition-[scale,opacity] duration-(--duration-fast) ease-out",
              "data-[checked]:scale-100 data-[checked]:opacity-100",
            )}
          />
        </span>
      </span>
      {children}
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
      className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", inset && "pl-8", className)}
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
      className={cn("-mx-1 my-1 h-0 border-t border-border", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        // The same keycap lift the command palette uses — 8% ink over whatever the row's
        // surface happens to be. Not `bg-muted`: that's the row highlight, so a shortcut
        // on a highlighted row would have disappeared into it.
        "ml-auto flex min-w-4 shrink-0 items-center justify-center rounded-xs bg-foreground/8 px-1 py-0.5 font-mono text-2xs text-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
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
      className={cn(itemBase, inset && "pl-8", className)}
      delay={delay}
      {...props}
    >
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
  sideOffset = 8,
  keepMounted = false,
  // Pull up by the popup's own top padding (`p-1`) so the first item lines up with the
  // trigger row rather than sitting a few pixels low.
  alignOffset = -4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
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
