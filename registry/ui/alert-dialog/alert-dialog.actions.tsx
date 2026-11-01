"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useId, type ComponentProps } from "react";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { AlertDialogFooterItem, useAlertDialogFooter } from "./alert-dialog.footer";
import { useAlertDialog } from "./alert-dialog.root";

type ClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
export interface AlertDialogActionProps extends Omit<ButtonProps, "onClick"> {
  /** Promises automatically show loading and close only after success. */
  onClick?: (event: ClickEvent) => void | PromiseLike<unknown>;
  /** Receives a thrown error or rejected promise; the dialog stays open. */
  onError?: (error: unknown) => void;
}

export function AlertDialogAction({ variant = "primary", onClick, onError, disabled, loading, focusableWhenDisabled, ...props }: AlertDialogActionProps) {
  const id = useId();
  const { pendingId, execute } = useAlertDialog();
  const inFooter = useAlertDialogFooter();
  const busy = pendingId !== null;
  const ownPending = pendingId === id;
  const blocked = disabled || loading || busy;
  const focusable = busy || loading || focusableWhenDisabled;
  const button = <Button
    data-slot="alert-dialog-action" {...props} variant={variant}
    disabled={disabled || (busy && !ownPending)} loading={loading || ownPending}
    focusableWhenDisabled={focusable}
    onClick={(event) => {
      if (blocked) { event.preventDefault(); return; }
      execute(id, () => {
        const result = onClick?.(event);
        return { result, keepOpen: event.defaultPrevented };
      }, onError);
    }}
  />;
  return inFooter ? <AlertDialogFooterItem disabled={blocked} focusableWhenDisabled={focusable}>{button}</AlertDialogFooterItem> : button;
}

/** Cancel always carries its own marker so it can be focused independent of button order. */
export function AlertDialogCancel({ variant = "outline", children = "Cancel", onClick, disabled, loading, focusableWhenDisabled, ...props }: ButtonProps) {
  const { pendingId } = useAlertDialog();
  const inFooter = useAlertDialogFooter();
  const busy = pendingId !== null;
  const blocked = disabled || loading || busy;
  const focusable = busy || loading || focusableWhenDisabled;
  const button = <BaseDialog.Close
    disabled={blocked}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented) event.preventBaseUIHandler();
    }}
    render={<Button data-slot="alert-dialog-cancel" {...props} variant={variant} loading={loading} focusableWhenDisabled={focusable}>{children}</Button>}
  />;
  return inFooter ? <AlertDialogFooterItem disabled={blocked} focusableWhenDisabled={focusable}>{button}</AlertDialogFooterItem> : button;
}

/** Explicit close controls are subject to the same pending-action lock as Cancel. */
export function AlertDialogClose({ disabled, ...props }: ComponentProps<typeof BaseDialog.Close>) {
  const { pendingId } = useAlertDialog();
  const inFooter = useAlertDialogFooter();
  const blocked = disabled || pendingId !== null;
  const button = <BaseDialog.Close {...props} disabled={blocked} />;
  return inFooter ? <AlertDialogFooterItem disabled={blocked}>{button}</AlertDialogFooterItem> : button;
}
