"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useMemo,
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
      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
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
                    variant="plain"
                    size="icon-sm"
                    pressScale={false}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
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

function clampStep(step: number, count: number) {
  const normalized = Number.isFinite(step) ? Math.trunc(step) : 0;
  return Math.min(Math.max(normalized, 0), Math.max(count - 1, 0));
}

export interface DialogStepProps extends ComponentProps<"div"> {
  children?: ReactNode;
}

/** A single phase passed as a child to `DialogSteps`. */
export function DialogStep({ className, ...props }: DialogStepProps) {
  return <div className={cn("min-w-0 space-y-4", className)} {...props} />;
}

export type DialogStepValidationDirection = "forward" | "submit";

export interface DialogStepsProps extends Omit<ComponentProps<"div">, "children"> {
  /** One child per phase. The active phase is the only one exposed in the dialog. */
  children: ReactNode;
  /** The active phase when the component is controlled. */
  step?: number;
  /** The initially active phase when the component is uncontrolled. */
  defaultStep?: number;
  /** Called whenever navigation changes the active phase. */
  onStepChange?: (step: number) => void;
  /** Return false to block forward navigation or the final Save action. */
  validateStep?: (step: number, direction: DialogStepValidationDirection) => boolean;
  /** Accessible names for the dots. Defaults to “Step 1”, “Step 2”, and so on. */
  labels?: readonly string[];
}

/**
 * A phased dialog body with clickable progress dots and previous/next arrows. The phases
 * swap instantly — no transition between them; only the dots and arrows react. It's a
 * composition inside DialogContent: Base UI still owns the modal focus trap, dismissal,
 * and title/description relationships.
 */
export function DialogSteps({
  children,
  step,
  defaultStep = 0,
  onStepChange,
  validateStep,
  labels,
  className,
  ...props
}: DialogStepsProps) {
  const phases = useMemo(() => Children.toArray(children), [children]);
  const [uncontrolledStep, setUncontrolledStep] = useState(() =>
    clampStep(defaultStep, phases.length),
  );
  const isControlled = step !== undefined;
  const activeStep = clampStep(isControlled ? step : uncontrolledStep, phases.length);

  const goToStep = useCallback(
    (nextStep: number) => {
      const next = clampStep(nextStep, phases.length);
      if (next === activeStep) return;

      if (next > activeStep && validateStep && !validateStep(activeStep, "forward")) {
        return;
      }

      if (!isControlled) setUncontrolledStep(next);
      onStepChange?.(next);
    },
    [activeStep, isControlled, onStepChange, phases.length, validateStep],
  );

  if (phases.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)} {...props}>
      {phases[activeStep]}

      <DialogStepsNavigation
        activeStep={activeStep}
        count={phases.length}
        labels={labels}
        onStepChange={goToStep}
        validateStep={validateStep}
      />
    </div>
  );
}

interface DialogStepsNavigationProps {
  activeStep: number;
  count: number;
  labels?: readonly string[];
  onStepChange: (step: number) => void;
  validateStep?: DialogStepsProps["validateStep"];
}

function DialogStepsNavigation({
  activeStep,
  count,
  labels,
  onStepChange,
  validateStep,
}: DialogStepsNavigationProps) {
  const labelFor = (index: number) => labels?.[index] ?? `Step ${index + 1}`;

  const isLast = activeStep === count - 1;

  return (
    // Three columns so the dots stay centred whatever width Back and Next take.
    <nav aria-label="Dialog steps" className="mt-6 grid grid-cols-3 items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="justify-self-start"
        onClick={() => onStepChange(activeStep - 1)}
        disabled={activeStep === 0}
      >
        Back
      </Button>

      <div
        role="group"
        className="flex items-center justify-center gap-1.5 justify-self-center"
        aria-label="Choose dialog step"
      >
        {Array.from({ length: count }, (_, index) => {
          const active = index === activeStep;
          const label = labelFor(index);

          return (
            <button
              key={label + index}
              type="button"
              className={cn(
                "block size-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-[background-color,scale] duration-(--duration-fast)",
                active
                  ? "bg-foreground"
                  : "bg-border-strong hover:scale-125 hover:bg-muted-foreground",
              )}
              onClick={() => onStepChange(index)}
              aria-label={`Go to ${label}`}
              aria-current={active ? "step" : undefined}
            />
          );
        })}
      </div>

      {isLast ? (
        <DialogClose
          onClick={(event) => {
            if (validateStep && !validateStep(activeStep, "submit")) {
              event.preventDefault();
            }
          }}
          render={<Button size="sm" className="justify-self-end">Save changes</Button>}
        />
      ) : (
        <Button
          size="sm"
          className="justify-self-end"
          onClick={() => onStepChange(activeStep + 1)}
        >
          Next
        </Button>
      )}
    </nav>
  );
}
