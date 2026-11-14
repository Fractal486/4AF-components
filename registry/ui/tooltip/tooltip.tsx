"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { createContext, useContext, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { mergeStateClassName } from "@/registry/lib/cn";
import { tooltipPopupVariants, tooltipPositionerVariants } from "./tooltip.variants";

export const TooltipProvider = BaseTooltip.Provider;
export const createTooltipHandle = BaseTooltip.createHandle;
export type TooltipRootProps<Payload = unknown> = BaseTooltip.Root.Props<Payload>;
export type TooltipHandle<Payload = unknown> = BaseTooltip.Handle<Payload>;

const TooltipGroupContext = createContext<BaseTooltip.Handle<ReactNode> | null>(null);
const isEmpty = (content: ReactNode) => content == null || content === "";

/** An independent root also isolates its triggers from any surrounding TooltipGroup. */
export function TooltipRoot<Payload = unknown>(props: TooltipRootProps<Payload>) {
  return <TooltipGroupContext.Provider value={null}><BaseTooltip.Root {...props} /></TooltipGroupContext.Provider>;
}

export type TooltipTriggerProps<Payload = unknown> = Omit<BaseTooltip.Trigger.Props<Payload>, "content"> & {
  /** Content for this trigger when it belongs to a TooltipGroup. */
  content?: ReactNode;
};

export function TooltipTrigger<Payload = unknown>({
  handle, payload, content, disabled, ...props
}: TooltipTriggerProps<Payload>) {
  const groupHandle = useContext(TooltipGroupContext);
  const grouped = handle === undefined && groupHandle !== null;

  return (
    <BaseTooltip.Trigger
      data-slot="tooltip-trigger"
      {...props}
      // The context owns ReactNode payloads; explicit handles keep their caller's payload type.
      handle={grouped ? groupHandle as BaseTooltip.Handle<Payload> : handle}
      payload={grouped ? content as Payload : payload}
      disabled={disabled || (grouped && isEmpty(content))}
    />
  );
}

export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
export function TooltipPortal(props: TooltipPortalProps) {
  return <BaseTooltip.Portal data-slot="tooltip-portal" {...props} />;
}

export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
export function TooltipPositioner({ className, sideOffset = 8, ...props }: TooltipPositionerProps) {
  return (
    <BaseTooltip.Positioner
      data-slot="tooltip-positioner"
      sideOffset={sideOffset}
      {...props}
      className={mergeStateClassName(tooltipPositionerVariants(), className)}
    />
  );
}

export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export function TooltipPopup({ className, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      data-slot="tooltip-content"
      {...props}
      className={mergeStateClassName(tooltipPopupVariants(), className)}
    />
  );
}

export interface TooltipContentProps extends TooltipPopupProps {
  side?: TooltipPositionerProps["side"];
  align?: TooltipPositionerProps["align"];
  sideOffset?: TooltipPositionerProps["sideOffset"];
  /** Portal container, mounting behavior, ref, and other portal props. */
  portalProps?: Omit<TooltipPortalProps, "children">;
  /** Positioning, collision behavior, ref, and state-aware positioner classes. */
  positionerProps?: Omit<TooltipPositionerProps, "side" | "align" | "sideOffset" | "children">;
}

/** Convenient portal + positioner + popup. Its ref and DOM props belong to the popup. */
export function TooltipContent({
  side = "top", align = "center", sideOffset = 8, portalProps, positionerProps, ...popupProps
}: TooltipContentProps) {
  return (
    <TooltipPortal {...portalProps}>
      <TooltipPositioner side={side} align={align} sideOffset={sideOffset} {...positionerProps}>
        <TooltipPopup {...popupProps} />
      </TooltipPositioner>
    </TooltipPortal>
  );
}

interface TooltipPresentationProps extends Pick<TooltipContentProps,
  "side" | "align" | "sideOffset" | "className" | "portalProps" | "positionerProps"
> {
  /** Popup ref, render element, DOM attributes, and event handlers. */
  popupProps?: Omit<TooltipPopupProps, "className" | "children">;
}

export interface TooltipProps extends Omit<BaseTooltip.Root.Props, "children">, TooltipPresentationProps {
  /** Empty content hides the popup without remounting the trigger. */
  content: ReactNode;
  children: ReactElement;
  delay?: number;
  closeOnClick?: boolean;
}

/** One trigger and its content. All visibility and cursor behavior belongs to Base UI. */
export function Tooltip({
  content, children, side, align, sideOffset, delay, closeOnClick = true,
  className, positionerProps, portalProps, popupProps, disabled = false, ...rootProps
}: TooltipProps) {
  const empty = isEmpty(content);

  return (
    <TooltipRoot {...rootProps} disabled={disabled || empty}>
      <TooltipTrigger render={children} delay={delay} closeOnClick={closeOnClick} />
      {!empty && (
        <TooltipContent
          {...popupProps}
          side={side} align={align} sideOffset={sideOffset} className={className}
          positionerProps={positionerProps} portalProps={portalProps}
        >
          {content}
        </TooltipContent>
      )}
    </TooltipRoot>
  );
}

export interface TooltipGroupProps extends Omit<BaseTooltip.Root.Props<ReactNode>, "children" | "handle">,
  TooltipPresentationProps, Pick<ComponentProps<typeof TooltipProvider>, "delay" | "closeDelay" | "timeout"> {
  children?: ReactNode;
}

/** Several TooltipTriggers supply their own content to one shared popup. */
export function TooltipGroup({
  children, delay, closeDelay, timeout, side, align, sideOffset, className,
  portalProps, positionerProps, popupProps, ...rootProps
}: TooltipGroupProps) {
  const [handle] = useState(() => createTooltipHandle<ReactNode>());

  return (
    <TooltipProvider delay={delay} closeDelay={closeDelay} timeout={timeout}>
      <TooltipGroupContext.Provider value={handle}>
        {children}
      </TooltipGroupContext.Provider>
      <TooltipRoot {...rootProps} handle={handle}>
        {({ payload }) => (
          <TooltipContent
            {...popupProps}
            side={side} align={align} sideOffset={sideOffset} className={className}
            portalProps={portalProps} positionerProps={positionerProps}
          >
            {payload}
          </TooltipContent>
        )}
      </TooltipRoot>
    </TooltipProvider>
  );
}
