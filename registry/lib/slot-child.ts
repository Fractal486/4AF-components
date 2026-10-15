import { use, type ReactNode } from "react";

const REACT_LAZY = Symbol.for("react.lazy");

/**
 * Unwraps a child that arrives as a lazy reference instead of an element.
 *
 * A Server Component that writes `<Button asChild><Link /></Button>` sends `Link` across
 * the RSC boundary, and React may hand it to the client component as a lazy node whose
 * payload is the pending element. `isValidElement` is false for that node, so every
 * `asChild` check would reject a perfectly good child. `use()` resolves the payload,
 * suspending until it arrives. Anything else passes through untouched.
 *
 * Kept out of `slot.tsx` because that module is client-only. A component that renders on
 * the server — ClassicLoader — can call this directly; it could only *render* `Slot`.
 */
export function useSlotChild(children: ReactNode): ReactNode {
  if (
    typeof children === "object" &&
    children !== null &&
    "$$typeof" in children &&
    children.$$typeof === REACT_LAZY &&
    "_payload" in children &&
    isPromiseLike(children._payload)
  ) {
    return use(children._payload as PromiseLike<ReactNode>);
  }
  return children;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}
