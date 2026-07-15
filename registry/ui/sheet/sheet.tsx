"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react";
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
import { sheetContentVariants, type SheetContentVariants } from "./sheet.variants";

/**
 * A sheet — a dialog that slides in from an edge.
 *
 * Behaviour is Base UI's Dialog: focus is trapped inside while open and returned to the
 * trigger on close, the page behind is scroll-locked and inert, Escape and an
 * outside-click dismiss it, and title/description are wired to `aria-labelledby` /
 * `aria-describedby`.
 *
 * The enter and exit are Motion's, not CSS. Base UI's CSS-transition exit for Dialog is
 * unreliable in this version, and — more importantly — the two directions want to be
 * *asymmetric*, which AnimatePresence expresses directly: the panel slides in from its
 * edge (movement earns attention on arrival), but leaves by drifting a little and fading
 * with a blur, never sliding all the way back out. An exit shouldn't demand the attention
 * the enter does.
 *
 * Base UI's `keepMounted` lets AnimatePresence own the unmount timing, so the exit gets
 * to finish before the DOM is torn down.
 */

const SheetOpenContext = createContext(false);

export interface SheetProps extends Omit<ComponentProps<typeof BaseDialog.Root>, "children"> {
  children: ReactNode;
}

export function Sheet({ open, defaultOpen, onOpenChange, children, ...props }: SheetProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  const handleOpenChange = useCallback<NonNullable<SheetProps["onOpenChange"]>>(
    (next, details) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next, details);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SheetOpenContext.Provider value={isOpen}>
      <BaseDialog.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </BaseDialog.Root>
    </SheetOpenContext.Provider>
  );
}

export const SheetTrigger = BaseDialog.Trigger;
export const SheetClose = BaseDialog.Close;

type Side = NonNullable<SheetContentVariants["side"]>;

// Enter: off-screen at the edge, fully opaque — a pure slide.
const enterFrom: Record<Side, TargetAndTransition> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  top: { y: "-100%" },
  bottom: { y: "100%" },
};

// Exit: a small drift in the leaving direction, plus fade and a heavy blur. Not a
// slide-off — the drift is ~48px, enough to read as movement without pulling focus.
const exitTo: Record<Side, TargetAndTransition> = {
  right: { x: 48, opacity: 0, filter: "blur(14px)" },
  left: { x: -48, opacity: 0, filter: "blur(14px)" },
  top: { y: -48, opacity: 0, filter: "blur(14px)" },
  bottom: { y: 48, opacity: 0, filter: "blur(14px)" },
};

const backdropClassName = "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm";

export interface SheetContentProps
  extends Omit<ComponentProps<typeof BaseDialog.Popup>, "className" | "render">,
    SheetContentVariants {
  className?: string;
  showClose?: boolean;
  children?: ReactNode;
}

export function SheetContent({
  side = "right",
  className,
  children,
  showClose = true,
  ...props
}: SheetContentProps) {
  const open = useContext(SheetOpenContext);
  const reduceMotion = useReducedMotion();
  const resolvedSide: Side = side ?? "right";

  return (
    <AnimatePresence>
      {open && (
        // keepMounted on the Portal keeps the whole subtree in the DOM so
        // AnimatePresence, not Base UI, owns when it's torn down.
        <BaseDialog.Portal keepMounted>
          <BaseDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: ease.out }}
                className={backdropClassName}
              />
            }
          />
          <BaseDialog.Popup
            className={cn(sheetContentVariants({ side: resolvedSide }), className)}
            render={
              <motion.div
                initial={
                  reduceMotion ? { opacity: 0 } : { ...enterFrom[resolvedSide], opacity: 1 }
                }
                animate={{ x: 0, y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { ...exitTo[resolvedSide], transition: { duration: 0.4, ease: ease.out } }
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

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function SheetBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function SheetTitle({
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

export function SheetDescription({
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
