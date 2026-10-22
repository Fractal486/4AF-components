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
import { duration, ease, overlayEnter, overlayExit, overlayVisible, spring } from "@/registry/lib/motion";
import { Button, type ButtonProps } from "@/registry/ui/button/button";

/**
 * A confirmation dialog that blocks backdrop dismissal. Escape and close controls dismiss it.
 *
 * Base UI supplies `role="alertdialog"`, focus management, and dismissal. Place
 * `AlertDialogCancel` first, or set `initialFocus`, when cancellation should receive
 * initial focus. Callers determine the order of the action and cancel controls.
 *
 * The surface uses Dialog's asymmetric Motion enter/exit. Base UI's `keepMounted`
 * delegates unmount timing to AnimatePresence so the exit finishes before removal.
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
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : duration.fast } }}
                transition={{ duration: reduceMotion ? 0 : duration.slow, ease: ease.out }}
                className={backdropClassName}
              />
            }
          />
          <BaseAlertDialog.Popup
            className={cn(
              // Centred with a translate; Motion scales on top (Tailwind v4 keeps
              // `translate` and Motion's `transform` as separate properties, so the two
              // compose and it stays centred while it scales).
              "fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-1/2 flex-col gap-4 rounded-md border border-border bg-surface-raised p-6 shadow-overlay-drop",
              className,
            )}
            render={
              <motion.div
                initial={
                  reduceMotion ? { opacity: 0 } : overlayEnter
                }
                animate={overlayVisible}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : overlayExit
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
 * Closes without acting. Place it first or set `initialFocus` when cancellation should
 * receive initial focus. Defaults to the neutral outline button.
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
