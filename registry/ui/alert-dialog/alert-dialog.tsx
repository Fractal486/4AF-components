"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useCallback, useRef, type ComponentProps } from "react";
import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { Slot } from "@/registry/lib/slot";
// The ui/ui alias maps this sibling module to the flat installed UI directory.
import {
  DialogContent, DialogHeader, DialogPopup,
  type DialogContentProps, type DialogPopupProps,
} from "@/registry/ui/ui/dialog.shared";
import { useAlertDialog } from "./alert-dialog.root";
import { alertDialogHeaderVariants, alertDialogMediaVariants, type AlertDialogMediaVariants } from "./alert-dialog.variants";

export { AlertDialog, AlertDialogTrigger, createAlertDialogHandle } from "./alert-dialog.root";
export type { AlertDialogProps, AlertDialogHandle } from "./alert-dialog.root";
export { AlertDialogAction, AlertDialogCancel, AlertDialogClose } from "./alert-dialog.actions";
export type { AlertDialogActionProps } from "./alert-dialog.actions";
export { AlertDialogFooter, AlertDialogFooterItem } from "./alert-dialog.footer";
export {
  DialogBackdrop as AlertDialogBackdrop, DialogBody as AlertDialogBody,
  DialogDescription as AlertDialogDescription, DialogOverlay as AlertDialogOverlay,
  DialogPortal as AlertDialogPortal, DialogTitle as AlertDialogTitle,
} from "@/registry/ui/ui/dialog.shared";
export type {
  DialogBackdropProps as AlertDialogBackdropProps, DialogBodyProps as AlertDialogBodyProps,
  DialogPortalContainer as AlertDialogPortalContainer, DialogPortalProps as AlertDialogPortalProps,
} from "@/registry/ui/ui/dialog.shared";

export type AlertDialogPopupProps = Omit<DialogPopupProps, "showClose">;
export type AlertDialogContentProps = Omit<DialogContentProps, "showClose">;

function useConfirmationPopup({ ref, initialFocus, ...props }: AlertDialogPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(popupRef, ref);
  const { pendingId } = useAlertDialog();
  const focusCancel = useCallback(() => {
    const popup = popupRef.current;
    const cancel = Array.from(popup?.querySelectorAll<HTMLElement>('[data-slot="alert-dialog-cancel"]') ?? [])
      .find(node => node.closest('[data-slot="alert-dialog-content"]') === popup
        && !node.hasAttribute("disabled") && node.getAttribute("aria-disabled") !== "true");
    return cancel ?? true;
  }, []);
  return { ...props, ref: mergedRef, initialFocus: initialFocus === undefined ? focusCancel : initialFocus,
    role: "alertdialog", "aria-busy": pendingId !== null || props["aria-busy"], "data-pending": pendingId !== null ? "" : undefined };
}

export function AlertDialogPopup({ dir, ...props }: AlertDialogPopupProps) {
  const popupProps = useConfirmationPopup(props);
  const popup = <DialogPopup data-slot="alert-dialog-content" {...popupProps} dir={dir} showClose={false} />;
  return dir === "rtl" || dir === "ltr" ? <DirectionProvider direction={dir}>{popup}</DirectionProvider> : popup;
}
export function AlertDialogContent({ dir, ...props }: AlertDialogContentProps) {
  const popupProps = useConfirmationPopup(props);
  const popup = <DialogContent data-slot="alert-dialog-content" {...popupProps} dir={dir} showClose={false} />;
  return dir === "rtl" || dir === "ltr" ? <DirectionProvider direction={dir}>{popup}</DirectionProvider> : popup;
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <DialogHeader {...props} className={cn(alertDialogHeaderVariants(), className)} />;
}
export interface AlertDialogMediaProps extends ComponentProps<"div">, AlertDialogMediaVariants {
  asChild?: boolean;
}
export function AlertDialogMedia({ variant = "default", className, asChild, ...props }: AlertDialogMediaProps) {
  const Component = asChild ? Slot : "div";
  return <Component data-slot="alert-dialog-media" data-variant={variant} aria-hidden="true" {...props}
    className={cn(alertDialogMediaVariants({ variant }), className)} />;
}
