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
import { duration, ease, overlayEnter, overlayExit, overlayVisible, spring } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";

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

export type DialogPortalContainer = ComponentProps<typeof BaseDialog.Portal>["container"];

export interface DialogContentProps
  extends Omit<ComponentProps<typeof BaseDialog.Popup>, "className" | "render"> {
  className?: string;
  /** Extra classes for the scrolling body that holds the content: its padding and gap. */
  bodyClassName?: string;
  /** Optional extra classes for the backdrop (for image/full-screen dialogs). */
  backdropClassName?: string;
  /** Mount the dialog portal into a caller-owned surface instead of document.body. */
  portalContainer?: DialogPortalContainer;
  showClose?: boolean;
  children?: ReactNode;
}

export function DialogContent({
  className,
  bodyClassName,
  backdropClassName: customBackdropClassName,
  portalContainer,
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
        <BaseDialog.Portal container={portalContainer} keepMounted>
          <BaseDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : duration.fast } }}
                transition={{ duration: reduceMotion ? 0 : duration.slow, ease: ease.out }}
                className={cn(backdropClassName, customBackdropClassName)}
              />
            }
          />
          <BaseDialog.Popup
            className={cn(
              // Centred with a translate; Motion scales on top (Tailwind v4 keeps
              // `translate` and Motion's `transform` as separate properties, so the two
              // compose and it stays centred while it scales).
              // The popup clips; the body scrolls when the dialog is taller than the viewport,
              // so the close button stays put above it.
              "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-1/2 flex-col overflow-hidden rounded-md border border-border bg-surface-raised shadow-overlay-drop",
              className,
            )}
            render={
              <motion.div
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : overlayEnter
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
            <ScrollArea
              fade
              className="min-h-0"
              viewportClassName={cn("flex flex-col gap-4 p-6", bodyClassName)}
            >
              {children}
            </ScrollArea>
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
  /** Return false to block forward navigation or the final Done action. */
  validateStep?: (step: number, direction: DialogStepValidationDirection) => boolean;
  /** Accessible names for the dots. Defaults to “Step 1”, “Step 2”, and so on. */
  labels?: readonly string[];
}

/**
 * Distance an arriving phase travels, in pixels.
 */
const STEP_OFFSET = 24;

/**
 * `custom` is the travel direction: 1 forward, -1 back, 0 when motion is reduced.
 * Only the arriving phase animates. The outgoing phase unmounts immediately to avoid
 * overlapping text during a cross-fade or a blank interval between sequential transitions.
 */
const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * STEP_OFFSET,
    filter: direction === 0 ? "blur(0px)" : "blur(4px)",
  }),
  active: (direction: number) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: direction === 0 ? 0 : duration.slow, ease: ease.out },
  }),
};

/**
 * A phased dialog body with progress dots and previous/next controls.
 * Re-keying on `activeStep` replays the entrance; the outgoing phase unmounts immediately
 * without AnimatePresence so text cannot overlap. Motion's size layout projection uses
 * transforms while document layout updates immediately, without animating `height`.
 *
 * Compose inside DialogContent: Base UI owns modal focus, dismissal, and title/description
 * relationships.
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
  const reduceMotion = useReducedMotion();

  // Derived during render rather than set in `goToStep`, so a *controlled* step change
  // gets a direction too — the parent may move the step without going through us.
  const [seenStep, setSeenStep] = useState(activeStep);
  const [direction, setDirection] = useState(1);
  // The first phase must not animate: the dialog is already scaling itself in around it,
  // and two things arriving at once leaves the eye nowhere to land.
  const [swapped, setSwapped] = useState(false);
  if (seenStep !== activeStep) {
    setDirection(activeStep > seenStep ? 1 : -1);
    setSeenStep(activeStep);
    setSwapped(true);
  }
  const travel = reduceMotion ? 0 : direction;

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
    <div
      className={cn("min-w-0", className)}
      data-direction={direction > 0 ? "forward" : "back"}
      {...props}
    >
      <motion.div
        // Motion's layout projection uses transforms for the size transition; unlike an
        // explicit height animation, it does not force the browser to relayout every frame.
        layout={reduceMotion ? false : "size"}
        layoutDependency={activeStep}
        transition={{ duration: reduceMotion ? 0 : duration.slow, ease: ease.out }}
        className="min-w-0"
      >
        <motion.div
          key={activeStep}
          custom={travel}
          variants={stepVariants}
          initial={swapped ? "enter" : false}
          animate="active"
          className="min-w-0"
        >
          {phases[activeStep]}
        </motion.div>
      </motion.div>

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
              event.preventBaseUIHandler();
            }
          }}
          render={<Button size="sm" className="justify-self-end">Done</Button>}
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
