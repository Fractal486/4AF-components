"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/registry/lib/cn";
import { PRESS_SCALE, spring } from "@/registry/lib/motion";
import { buttonVariants, type ButtonVariants } from "./button.variants";

/**
 * These collide with Motion's own props of the same names, which are gesture and
 * animation callbacks rather than DOM events. Dropping them from the public type is
 * the standard cost of putting a motion component behind a native-looking API.
 */
export interface ButtonProps
  extends Omit<
      ComponentProps<typeof BaseButton>,
      "children" | "className" | "nativeButton" | "render"
    >,
    ButtonVariants {
  className?: string;
  /** Render the styles onto the child element instead of a <button>. */
  asChild?: boolean;
  /** Swaps in a spinner and blocks interaction, without changing the button's size. */
  loading?: boolean;
  /** Disable the tactile press scale. Defaults to `true`; useful for anchored triggers. */
  pressScale?: boolean;
  /**
   * Holds the button in its pressed state — e.g. while a popover or menu it triggers is
   * open, so the trigger reads as "held down" for as long as its surface is showing. It's
   * the same spring as the tap press, and it *replaces* the tap press while held (rather
   * than layering on top), so pressing an already-held button to dismiss doesn't compound
   * the scale or fight a second timing curve on the way back up.
   */
  pressed?: boolean;
  /** Announced while `loading`, since the visible label is hidden from sight. */
  loadingLabel?: string;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

// Created once at module scope: doing it inside the component would mint a new
// component type on every render and remount the child.
const MotionButton = motion.button;

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingLabel = "Loading",
  pressScale = true,
  pressed = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const icons = iconEdges(children, asChild);
  const reduceMotion = useReducedMotion();
  const innerContent =
    asChild && isValidElement<{ children?: ReactNode }>(children)
      ? children.props.children
      : children;
  const content = loading ? (
    <ButtonLoading label={loadingLabel}>{innerContent}</ButtonLoading>
  ) : (
    innerContent
  );

  if (asChild && !isValidElement(children)) {
    throw new Error("Button expects a single React element child when using `asChild`.");
  }

  const childElement = children as ReactElement<{
    children?: ReactNode;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    role?: string;
  }>;
  const child = asChild
    ? cloneElement(
        childElement,
        {
          // Base UI correctly guards the Button's own handler. The child's handler is
          // composed later, so suppress it here as well while disabled/loading.
          onClick: isDisabled ? (event) => event.preventDefault() : childElement.props.onClick,
          // `asChild` is visual composition: an anchor must remain a link, not be
          // announced as a button merely because it wears Button's styles.
          role: undefined,
        },
        content,
      )
    : null;

  return (
    <BaseButton
      {...props}
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        asChild &&
          pressScale &&
          "transition-[background-color,box-shadow,color,opacity,scale] active:scale-[0.95] motion-reduce:active:scale-100",
        // Held state for the CSS-press (`asChild`) path. `scale` is a single CSS
        // property, so this and `active:scale-[0.95]` resolve to one value (0.95) rather
        // than multiplying — no compounding when a held button is pressed to dismiss.
        asChild && pressScale && pressed && "scale-[0.95] motion-reduce:scale-100",
        className,
      )}
      disabled={isDisabled}
      nativeButton={!asChild}
      // State on the element, not just in the closure. Anything downstream — a
      // parent's CSS, a test, a screenshot diff — can now see what this button is
      // doing without reaching into React.
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      data-loading={loading || undefined}
      data-pressed={pressed || undefined}
      data-icon-start={icons.start || undefined}
      data-icon-end={icons.end || undefined}
      aria-busy={loading || undefined}
      render={asChild ? child! : (buttonProps) => {
        // Base UI owns the button semantics and disabled behavior. Motion only owns
        // the native button's press spring. `asChild` uses CSS press feedback because
        // Motion cannot wrap an arbitrary child without creating invalid nested DOM.
        const motionProps = buttonProps as HTMLMotionProps<"button">;
        const pressProps = {
          // While `pressed`, the tap is suppressed and the hold owns the scale — one
          // property (Motion's transform), one spring — so pressing to dismiss doesn't
          // stack a second 0.95 or hand the scale-back-up to a different timing curve.
          whileTap:
            reduceMotion || isDisabled || pressed || !pressScale
              ? undefined
              : { scale: PRESS_SCALE },
          animate: reduceMotion
            ? undefined
            : { scale: pressed && pressScale ? PRESS_SCALE : 1 },
          transition: spring.press,
        };

        return (
          <MotionButton {...motionProps} {...pressProps}>
            {content}
          </MotionButton>
        );
      }}
    />
  );
}

/**
 * Which edges of the button hold an icon, so the variants can shave 2px off that
 * side and optically re-centre the content.
 *
 * An element on an edge with something beside it is an icon; an element that's the
 * *only* thing there is an icon-only button, which wants its padding symmetric.
 * Fragments are flattened first, or `<>{cond && <Icon/>}{label}</>` — the shape
 * every conditional icon takes — would look like a single child.
 */
function iconEdges(children: ReactNode, asChild: boolean): { start: boolean; end: boolean } {
  // With `asChild` the icons live inside the child element, not beside it.
  const content =
    asChild && isValidElement<{ children?: ReactNode }>(children)
      ? children.props.children
      : children;

  const parts = flatten(content);
  if (parts.length < 2) return { start: false, end: false };

  return {
    start: isValidElement(parts[0]),
    end: isValidElement(parts[parts.length - 1]),
  };
}

function flatten(children: ReactNode): ReactNode[] {
  // Children.toArray already drops null/undefined/booleans, so an unrendered
  // conditional icon doesn't count as an edge.
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children)
      : [child],
  );
}

/**
 * The label keeps its place in the layout and fades out; the spinner is absolutely
 * positioned over it. Swapping the label *for* a spinner would resize the button
 * mid-click, moving the target out from under the cursor.
 *
 * `aria-hidden` on the faded label plus a live-region-free status text means a
 * screen reader hears "Loading", not the stale label it can no longer act on.
 */
function ButtonLoading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-[inherit] opacity-0 transition-[opacity] duration-(--duration-fast) ease-out"
      >
        {children}
      </span>
      <span className="absolute inset-0 inline-flex items-center justify-center">
        <Spinner />
        <span className="sr-only">{label}</span>
      </span>
    </>
  );
}

export function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      // Deliberately exempt from the reduced-motion rule. Collapsing a 1s spin to
      // ~0 produces a strobe, which is worse than the motion it was avoiding. A
      // spinner isn't a transition; it's a status, and it has to keep reading as one.
      className="animate-spin"
      style={{ animationDuration: "0.7s" }}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
