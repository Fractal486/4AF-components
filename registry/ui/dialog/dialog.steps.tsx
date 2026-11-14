"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion } from "motion/react";
import { Children, useCallback, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";

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
    transition: { duration: direction === 0 ? 0 : duration.slower, ease: ease.out },
  }),
};

/**
 * A phased dialog body with progress dots and previous/next controls.
 * Re-keying on `activeStep` replays the entrance; the outgoing phase unmounts immediately
 * without AnimatePresence so text cannot overlap. DialogContent resizes its frame around
 * the new phase from the shared centre, so the phase itself only slides sideways.
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
        key={activeStep}
        custom={travel}
        variants={stepVariants}
        initial={swapped ? "enter" : false}
        animate="active"
        className="min-w-0"
      >
        {phases[activeStep]}
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
    <nav
      aria-label="Dialog steps"
      data-dialog-edge="end"
      className="mt-6 grid grid-cols-3 items-center gap-3"
    >
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
        <BaseDialog.Close
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
