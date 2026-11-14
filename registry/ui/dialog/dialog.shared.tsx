"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { ScrollArea, type ScrollAreaProps } from "@/registry/ui/scroll-area/scroll-area";
import { useDialogFrameHeight } from "./dialog.frame";
import {
  dialogBackdropVariants, dialogBodyContentVariants, dialogBodyVariants,
  dialogDescriptionVariants, dialogFooterVariants, dialogHeaderVariants,
  dialogLayoutVariants, dialogPopupVariants, dialogPortalVariants, dialogTitleVariants,
} from "./dialog.variants";

const DialogDepthContext = createContext(0);
const DialogContentContext = createContext({ showClose: false });

/** Shared across Dialog and AlertDialog, including mixed nested compositions. */
export function DialogLayer({ children }: { children: ReactNode }) {
  const depth = useContext(DialogDepthContext);
  return <DialogDepthContext.Provider value={depth + 1}>{children}</DialogDepthContext.Provider>;
}

export const DialogClose = BaseDialog.Close;
export type DialogPortalProps = ComponentProps<typeof BaseDialog.Portal>;
export type DialogPortalContainer = DialogPortalProps["container"];

export function DialogPortal({ className, ...props }: DialogPortalProps) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} className={cn(dialogPortalVariants(), className)} />;
}

export type DialogBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export function DialogBackdrop({ className, forceRender, ...props }: DialogBackdropProps) {
  const nested = useContext(DialogDepthContext) > 1;
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-backdrop"
      data-nested={nested ? "" : undefined}
      forceRender={forceRender ?? nested}
      {...props}
      className={mergeStateClassName(dialogBackdropVariants(), className)}
    />
  );
}

/** Alias for callers who use overlay terminology. */
export const DialogOverlay = DialogBackdrop;

export interface DialogPopupProps extends ComponentProps<typeof BaseDialog.Popup> {
  /** Padding and gaps around the header, body, and footer. */
  bodyClassName?: string;
  /** Measure and animate the content height. Disable for caller-controlled heights. @default true */
  autoSize?: boolean;
  /** Show the corner Close button. @default true */
  showClose?: boolean;
}

/** The styled popup and content layout, without a portal or backdrop. */
export function DialogPopup({
  className, bodyClassName, autoSize = true, showClose = true, children, ...props
}: DialogPopupProps) {
  const frameBodyRef = useDialogFrameHeight();
  return (
    <DialogContentContext.Provider value={{ showClose }}>
      <BaseDialog.Popup
        data-slot="dialog-content"
        data-dialog-frame=""
        {...props}
        className={mergeStateClassName(dialogPopupVariants(), className)}
      >
        {/* Legacy content keeps its natural height and centred resizing. A direct DialogBody
            makes this layer fill the frame so its header/footer stay outside that scroller. */}
        <div className="absolute inset-x-0 top-1/2 flex max-h-[calc(100dvh-2rem-2px)] min-h-full -translate-y-1/2 flex-col has-[[data-slot=dialog-content-body]>[data-slot=dialog-body]]:h-full">
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="flex flex-col justify-center-safe has-[>[data-slot=dialog-content-body]>[data-slot=dialog-body]]:overflow-hidden!"
          >
            <div
              ref={autoSize ? frameBodyRef : undefined}
              data-slot="dialog-content-body"
              className={cn(dialogLayoutVariants(), bodyClassName)}
            >
              {children}
            </div>
          </ScrollArea>
        </div>
        {showClose && (
          <DialogClose
            render={
              <Button variant="plain" size="icon-sm" pressScale={false} aria-label="Close"
                className="absolute top-4 end-4 text-muted-foreground hover:text-foreground">
                <X />
              </Button>
            }
          />
        )}
      </BaseDialog.Popup>
    </DialogContentContext.Provider>
  );
}

export interface DialogContentProps extends DialogPopupProps {
  /** Mount the portal into a caller-owned surface. */
  portalContainer?: DialogPortalContainer;
  backdropClassName?: DialogBackdropProps["className"];
  /** Portal ref, mounting behavior, and DOM props. */
  portalProps?: Omit<DialogPortalProps, "children">;
  /** Backdrop ref, render element, state classes, and DOM props. */
  backdropProps?: DialogBackdropProps;
}

/** Convenience composition. Its ref, render, events, and classes belong to the popup. */
export function DialogContent({
  portalContainer, portalProps, backdropClassName, backdropProps, ...popupProps
}: DialogContentProps) {
  return (
    <DialogPortal {...portalProps} container={portalContainer ?? portalProps?.container}>
      <DialogBackdrop {...backdropProps} className={backdropClassName ?? backdropProps?.className} />
      <DialogPopup {...popupProps} />
    </DialogPortal>
  );
}

export interface DialogBodyProps extends ScrollAreaProps {
  /** Classes for the natural-height content inside the scrolling viewport. */
  contentClassName?: string;
}

/** Place directly between DialogHeader and DialogFooter to scroll only the body. */
export function DialogBody({ className, contentClassName, children, ...props }: DialogBodyProps) {
  return (
    <ScrollArea data-slot="dialog-body" {...props} className={mergeStateClassName(dialogBodyVariants(), className)}>
      <div data-slot="dialog-body-content" className={cn(dialogBodyContentVariants(), contentClassName)}>
        {children}
      </div>
    </ScrollArea>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  const { showClose } = useContext(DialogContentContext);
  return <div data-slot="dialog-header" data-close={showClose ? "" : undefined} {...props} className={cn(dialogHeaderVariants(), className)} />;
}

export interface DialogFooterProps extends ComponentProps<"div"> {
  /** Append a built-in Close button. @default false */
  showCloseButton?: boolean;
  /** Label for the built-in Close button. @default "Close" */
  closeLabel?: ReactNode;
}

export function DialogFooter({ className, children, showCloseButton = false, closeLabel = "Close", ...props }: DialogFooterProps) {
  return (
    <div data-slot="dialog-footer" data-dialog-edge="end" {...props} className={cn(dialogFooterVariants(), className)}>
      {children}
      {showCloseButton && <DialogClose render={<Button variant="outline">{closeLabel}</Button>} />}
    </div>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title data-slot="dialog-title" {...props} className={mergeStateClassName(dialogTitleVariants(), className)} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description data-slot="dialog-description" {...props} className={mergeStateClassName(dialogDescriptionVariants(), className)} />;
}
