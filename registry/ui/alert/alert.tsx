"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
import { Check, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { moveFocusOutside } from "@/registry/lib/move-focus-outside";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { LoadingIndicator } from "@/registry/lib/loader";
import {
  alertVariants, alertTitleVariants, alertDescriptionVariants,
  alertCloseVariants, type AlertVariants,
} from "./alert.variants";

const ICON_SLOT = "size-3.5 shrink-0";
const GLYPH: Record<NonNullable<AlertVariants["variant"]>, (loader?: ReactNode) => ReactNode> = {
  error: () => <OctagonAlert aria-hidden="true" className={ICON_SLOT} />,
  warning: () => <TriangleAlert aria-hidden="true" className={ICON_SLOT} />,
  success: () => <Check aria-hidden="true" className={ICON_SLOT} />,
  info: () => <Info aria-hidden="true" className={ICON_SLOT} />,
  loading: (loader) => <LoadingIndicator loader={loader} className={ICON_SLOT} />,
};

export interface AlertProps extends ComponentProps<typeof BaseCollapsible.Root>, AlertVariants {
  /** Overrides the loading glyph's LoaderProvider. */
  loader?: ReactNode;
  /** Omit for the status glyph; null or false removes its column. */
  icon?: ReactNode;
}

/** Inline status content, with Base UI owning visibility and the closing lifecycle. */
export function Alert({ className, variant, children, loader, icon, render, defaultOpen = true, ...props }: AlertProps) {
  if (children == null || children === "") return null;
  const resolved = variant ?? "error";
  const glyph = icon === undefined ? GLYPH[resolved](loader) : icon;

  return (
    <BaseCollapsible.Root
      role={resolved === "error" ? "alert" : "status"}
      data-slot="alert"
      data-variant={resolved}
      defaultOpen={defaultOpen}
      className={mergeStateClassName(alertVariants({ variant: resolved }), className)}
      {...props}
      render={(elementProps, state) => (
        <AlertSurface {...elementProps} state={state} render={render} />
      )}
    >
      {glyph != null && glyph !== false && (
        <span aria-hidden="true" data-slot="alert-glyph" className="flex h-[1lh] shrink-0 items-center [&_svg]:size-3.5">
          {glyph}
        </span>
      )}
      <div data-slot="alert-content" className="min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] [&:has(>[data-slot^=alert-])]:grid">
        {children}
      </div>
    </BaseCollapsible.Root>
  );
}

/** The root and panel share one DOM node, so inline alerts don't gain a layout wrapper. */
function AlertSurface({ state, render, ref, ...props }: ComponentProps<"div"> & {
  state: BaseCollapsible.Root.State;
  render: AlertProps["render"];
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!state.open && element) moveFocusOutside(element);
  }, [state.open]);

  return useRender({
    render: <BaseCollapsible.Panel render={render} />,
    ref: [ref ?? null, elementRef],
    props: {
      ...props,
      // Remove controls from keyboard navigation during the exit, not just afterwards.
      inert: !state.open || undefined,
      "aria-hidden": !state.open || undefined,
      "data-state": state.open ? "open" : "closed",
    },
  });
}

export type AlertTitleProps = useRender.ComponentProps<"div">;
export function AlertTitle({ render, ref, className, ...props }: AlertTitleProps) {
  return useRender({ defaultTagName: "div", render, ref, props: {
    "data-slot": "alert-title", ...props, className: cn(alertTitleVariants(), className),
  } });
}

export type AlertDescriptionProps = useRender.ComponentProps<"div">;
export function AlertDescription({ render, ref, className, ...props }: AlertDescriptionProps) {
  return useRender({ defaultTagName: "div", render, ref, props: {
    "data-slot": "alert-description", ...props, className: cn(alertDescriptionVariants(), className),
  } });
}

export type AlertCloseProps = ComponentProps<typeof BaseCollapsible.Trigger>;
export function AlertClose({ className, children, onClick, ...props }: AlertCloseProps) {
  return (
    <BaseCollapsible.Trigger
      aria-label="Dismiss"
      // A dismiss button is not a disclosure control.
      aria-expanded={undefined}
      aria-controls={undefined}
      data-slot="alert-close"
      className={mergeStateClassName(alertCloseVariants(), className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) event.preventBaseUIHandler();
      }}
    >
      {children ?? <X aria-hidden="true" className="size-3.5" />}
    </BaseCollapsible.Trigger>
  );
}

/** @deprecated Renamed to Alert. */
export const FieldError = Alert;
/** @deprecated Renamed to AlertProps. */
export type FieldErrorProps = AlertProps;
