"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { DialogLayer } from "./dialog.shared";

export {
  DialogBackdrop, DialogBody, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogOverlay, DialogPopup, DialogPortal, DialogTitle,
} from "./dialog.shared";
export type {
  DialogBackdropProps, DialogBodyProps, DialogContentProps, DialogFooterProps,
  DialogPopupProps, DialogPortalContainer, DialogPortalProps,
} from "./dialog.shared";
export { DialogStep, DialogSteps } from "./dialog.steps";
export type { DialogStepProps, DialogStepsProps, DialogStepValidationDirection } from "./dialog.steps";

export type DialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload>;
export type DialogHandle<Payload = unknown> = BaseDialog.Handle<Payload>;
export const createDialogHandle = BaseDialog.createHandle;
export const DialogTrigger = BaseDialog.Trigger;

/** Base UI owns visibility, trigger payloads, focus, dismissal, and presence. */
export function Dialog<Payload = unknown>(props: DialogProps<Payload>) {
  return <DialogLayer><BaseDialog.Root {...props} /></DialogLayer>;
}
