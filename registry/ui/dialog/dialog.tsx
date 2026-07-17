"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
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
import { Button } from "@/registry/ui/button/button";

/**
 * A dialog — a modal centred over the page.
 *
 * Behaviour is Base UI's Dialog: focus is trapped inside while open and returned to the
 * trigger on close, the page behind is scroll-locked and inert, Escape and an outside
 * click dismiss it, and title/description are wired to `aria-labelledby` /
 * `aria-describedby`.
 *
 * The enter and exit are Motion's, and deliberately asymmetric — which AnimatePresence
 * expresses directly. It arrives by scaling up out of a blur (a small move that earns the
 * attention a modal wants), but it leaves by simply fading and blurring, not by playing
 * that entrance backwards: an exit shouldn't demand the attention the enter does. Base
 * UI's `keepMounted` hands the unmount timing to AnimatePresence, so the exit finishes
 * before the DOM is torn down.
 */

const DialogOpenContext = createContext(false);

export interface DialogProps extends Omit<ComponentProps<typeof BaseDialog.Root>, "children"> {
  children: ReactNode;
}

export function Dialog({ open, defaultOpen, onOpenChange, children, ...props }: DialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  const handleOpenChange = useCallback<NonNullable<DialogProps["onOpenChange"]>>(
    (next, details) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next, details);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogOpenContext.Provider value={isOpen}>
      <BaseDialog.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </BaseDialog.Root>
    </DialogOpenContext.Provider>
  );
}

export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

const backdropClassName = "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm";

export interface DialogContentProps
  extends Omit<ComponentProps<typeof BaseDialog.Popup>, "className" | "render"> {
  className?: string;
  showClose?: boolean;
  children?: ReactNode;
}

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: DialogContentProps) {
  const open = useContext(DialogOpenContext);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        // keepMounted on the Portal keeps the subtree in the DOM so AnimatePresence, not
        // Base UI, owns when it's torn down.
        <BaseDialog.Portal keepMounted>
          <BaseDialog.Backdrop
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
          <BaseDialog.Popup
            className={cn(
              // Centred with a translate; Motion scales on top (Tailwind v4 keeps
              // `translate` and Motion's `transform` as separate properties, so the two
              // compose and it stays centred while it scales).
              "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-1/2 flex-col gap-4 overflow-y-auto rounded-md border border-border bg-background p-6 shadow-overlay-drop",
              // A thin custom scrollbar, shown only when the dialog is taller than the
              // viewport. Firefox uses the standard properties; WebKit the pseudo-elements.
              "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
              "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground",
              className,
            )}
            render={
              <motion.div
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, filter: "blur(4px)" }
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
            {showClose && (
              <BaseDialog.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    className="absolute top-4 right-4"
                  >
                    <X />
                  </Button>
                }
              />
            )}
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}
