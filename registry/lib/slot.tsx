"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "./cn";
import { useMergedRefs } from "./refs";
import { useSlotChild } from "./slot-child";

// Re-exported so existing `@/registry/lib/slot` imports keep working.
export { useSlotChild };

/**
 * Renders its props onto its child instead of onto a wrapper element.
 *
 * This is what powers `asChild`. Without it, a Button that needs to be a link has
 * two bad options: a <button> inside an <a> (invalid, and a keyboard trap), or a
 * `<Button as="a">` polymorphic API that fights TypeScript forever. With it, the
 * child element *becomes* the button — correct semantics, styles intact.
 *
 *   <Button asChild><a href="/docs">Docs</a></Button>  →  <a class="…button styles">
 */
export function Slot({
  children: childrenProp,
  ref,
  ...slotProps
}: HTMLAttributes<HTMLElement> & { children?: ReactNode; ref?: Ref<HTMLElement> }) {
  const children = useSlotChild(childrenProp);
  const child = isValidElement(children) ? children as ReactElement<Record<string, unknown>> : null;
  // Keep both refs attached through ordinary rerenders. The hook must also run when
  // the child is absent, since `asChild` content can appear on a later render.
  const mergedRef = useMergedRefs(ref, child?.props.ref as Ref<HTMLElement> | undefined);
  if (!child) {
    if (Children.count(children) > 1) {
      throw new Error("Slot expects a single React element child when using `asChild`.");
    }
    return null;
  }

  return cloneElement(child, { ...mergeProps(slotProps, child.props), ref: mergedRef });
}

/**
 * The child wins on plain values — if you write `<a className="x">`, you meant it.
 * Handlers are the exception: both need to run, or the child's onClick silently
 * eats the Button's. Same for className/style, which compose rather than replace.
 */
function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    const isHandler = /^on[A-Z]/.test(key);
    if (isHandler) {
      if (typeof slotValue === "function" && typeof childValue === "function") {
        merged[key] = (...args: unknown[]) => {
          (childValue as (...a: unknown[]) => unknown)(...args);
          const event = args[0];
          const prevented =
            event != null &&
            typeof event === "object" &&
            "defaultPrevented" in event &&
            event.defaultPrevented === true;
          if (!prevented) (slotValue as (...a: unknown[]) => unknown)(...args);
        };
      } else if (typeof slotValue === "function") {
        merged[key] = slotValue;
      }
    } else if (key === "className") {
      merged[key] = cn(slotValue as string, childValue as string);
    } else if (key === "style") {
      merged[key] = { ...(slotValue as CSSProperties), ...(childValue as CSSProperties) };
    }
  }

  return merged;
}
