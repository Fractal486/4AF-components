"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { createContext, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DialogLayer } from "@/registry/ui/ui/dialog.shared";
import { AlertDialogFooterScope } from "./alert-dialog.footer";

interface AlertDialogContextValue {
  pendingId: string | null;
  execute: (id: string, action: () => { result: unknown; keepOpen: boolean }, onError?: (error: unknown) => void) => void;
}
const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);
export function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error("Alert Dialog parts must be inside AlertDialog.");
  return context;
}

export interface AlertDialogProps<Payload = unknown> extends BaseAlertDialog.Root.Props<Payload> {
  /** Prevent outside presses from closing the confirmation. @default true */
  disablePointerDismissal?: boolean;
}
export type AlertDialogHandle<Payload = unknown> = BaseAlertDialog.Handle<Payload>;
export const createAlertDialogHandle = BaseAlertDialog.createHandle;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;

/** Base AlertDialog hardcodes outside dismissal off. Its configurable Dialog root supplies
 * the same modal behavior; the shared popup explicitly retains role="alertdialog". */
export function AlertDialog<Payload = unknown>({
  open, defaultOpen = false, onOpenChange, actionsRef, disablePointerDismissal = true, ...props
}: AlertDialogProps<Payload>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [seenOpen, setSeenOpen] = useState(isOpen);
  if (seenOpen !== isOpen) {
    setSeenOpen(isOpen);
    if (!isOpen) setPendingId(null);
  }
  const pending = useRef<string | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const invoking = useRef(false);
  const localActions = useRef<BaseDialog.Root.Actions | null>(null);

  const reset = useCallback(() => {
    generation.current += 1;
    pending.current = null;
    setPendingId(null);
  }, []);
  useLayoutEffect(() => {
    if (!isOpen) { generation.current += 1; pending.current = null; }
  }, [isOpen]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; pending.current = null; };
  }, []);
  useImperativeHandle(actionsRef, () => ({
    close: () => localActions.current?.close(),
    unmount: () => localActions.current?.unmount(),
  }), []);

  const execute = useCallback<AlertDialogContextValue["execute"]>((id, action, onError) => {
    if (!mounted.current || pending.current || invoking.current) return;
    invoking.current = true;
    const request = ++generation.current;
    let outcome: ReturnType<typeof action>;
    try {
      outcome = action();
    } catch (error) {
      invoking.current = false;
      onError?.(error);
      return;
    }
    invoking.current = false;
    const result = outcome.result;
    let thenable: boolean;
    try {
      thenable = result != null && (typeof result === "object" || typeof result === "function")
        && typeof (result as PromiseLike<unknown>).then === "function";
    } catch (error) {
      onError?.(error);
      return;
    }
    if (!thenable) {
      if (!outcome.keepOpen) localActions.current?.close();
      return;
    }
    pending.current = id;
    setPendingId(id);
    Promise.resolve(result).then(
      () => {
        if (!mounted.current || generation.current !== request) return;
        pending.current = null;
        setPendingId(null);
        if (!outcome.keepOpen) localActions.current?.close();
      },
      (error: unknown) => {
        if (!mounted.current || generation.current !== request) return;
        pending.current = null;
        setPendingId(null);
        onError?.(error);
      },
    );
  }, []);
  const context = useMemo(() => ({ pendingId, execute }), [pendingId, execute]);

  return (
    <AlertDialogContext.Provider value={context}>
      <AlertDialogFooterScope>
      <DialogLayer>
        <BaseDialog.Root
          {...props}
          modal
          open={isOpen}
          actionsRef={localActions}
          disablePointerDismissal={disablePointerDismissal}
          onOpenChange={(next, details) => {
            if (!next && pending.current) { details.cancel(); return; }
            onOpenChange?.(next, details);
            if (details.isCanceled) return;
            if (!next) reset();
            if (open === undefined) setUncontrolledOpen(next);
          }}
        />
      </DialogLayer>
      </AlertDialogFooterScope>
    </AlertDialogContext.Provider>
  );
}
