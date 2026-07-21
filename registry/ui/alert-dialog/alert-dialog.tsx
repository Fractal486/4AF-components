"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { ease, spring } from "@/registry/lib/motion";
import { Button, type ButtonProps } from "@/registry/ui/button/button";

/**
 * An alert dialog — a modal that interrupts to force a decision.
 *
 * It shares Dialog's surface and Motion enter/exit, but it is a different Base UI
 * primitive on purpose. `AlertDialog.Root` renders `role="alertdialog"` (assistive tech
 * announces it as an interruption demanding a response, not a passive panel) and — unlike
 * Dialog — it can't be dismissed by clicking the backdrop. You can't dodge the choice by
 * clicking away; you answer with a button. That's the whole reason it's separate: not
 * "a dialog with less content", but "a dialog you can't ignore".
 *
 * So there's deliberately no corner close button here — an ✕ would be exactly the dismiss
 * escape hatch the primitive removes. Provide `AlertDialogCancel` and `AlertDialogAction`;
 * Cancel comes first in the DOM, so focus lands on the safe choice by default.
 *
 * Enter and exit are Motion's and asymmetric, the same as Dialog: it scales up out of a
 * blur (a move that earns the attention an interruption wants) and leaves by simply fading
 * and blurring. Base UI's `keepMounted` hands unmount timing to AnimatePresence so the
 * exit finishes before the DOM is torn down.
 */

const AlertDialogOpenContext = createContext(false);

export interface AlertDialogProps
  extends Omit<ComponentProps<typeof BaseAlertDialog.Root>, "children"> {
  children: ReactNode;
}

export function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: AlertDialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  const handleOpenChange = useCallback<NonNullable<AlertDialogProps["onOpenChange"]>>(
    (next, details) => {
      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <AlertDialogOpenContext.Provider value={isOpen}>
      <BaseAlertDialog.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </BaseAlertDialog.Root>
    </AlertDialogOpenContext.Provider>
  );
}

export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

const backdropClassName = "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm";

export interface AlertDialogContentProps
  extends Omit<ComponentProps<typeof BaseAlertDialog.Popup>, "className" | "render"> {
  className?: string;
  children?: ReactNode;
}

export function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps) {
  const open = useContext(AlertDialogOpenContext);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        // keepMounted on the Portal keeps the subtree in the DOM so AnimatePresence, not
        // Base UI, owns when it's torn down.
        <BaseAlertDialog.Portal keepMounted>
          <BaseAlertDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: ease.out }}
                className={backdropClassName}
              />
            }
          />
          <BaseAlertDialog.Popup
            className={cn(
              // Centred with a translate; Motion scales on top (Tailwind v4 keeps
              // `translate` and Motion's `transform` as separate properties, so the two
              // compose and it stays centred while it scales).
              "fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-1/2 flex-col gap-4 rounded-md border border-border bg-background p-6 shadow-overlay-drop",
              className,
            )}
            render={
              <motion.div
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, filter: "blur(8px)", transition: { duration: 0.2, ease: ease.out } }
                }
                transition={reduceMotion ? { duration: 0 } : spring.smooth}
              />
            }
            {...props}
          >
            {children}
          </BaseAlertDialog.Popup>
        </BaseAlertDialog.Portal>
      )}
    </AnimatePresence>
  );
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Title>) {
  return (
    <BaseAlertDialog.Title
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Description>) {
  return (
    <BaseAlertDialog.Description
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * The safe choice. Closes without acting, and — being first in the DOM — is where focus
 * lands when the dialog opens. Defaults to the neutral outline button.
 */
export function AlertDialogCancel({ variant = "outline", children = "Cancel", ...props }: ButtonProps) {
  return (
    <BaseAlertDialog.Close render={<Button variant={variant} {...props}>{children}</Button>} />
  );
}

/**
 * The committing choice — confirm, or the destructive action. Closes on click; pass
 * `variant="destructive"` for a delete. Its `onClick` runs before the close.
 */
export function AlertDialogAction({ variant = "primary", children, ...props }: ButtonProps) {
  return (
    <BaseAlertDialog.Close render={<Button variant={variant} {...props}>{children}</Button>} />
  );
}
