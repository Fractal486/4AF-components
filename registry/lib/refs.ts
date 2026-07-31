"use client";

import { useMemo, type Ref } from "react";

/**
 * Sends one element to every ref while preserving React 19 callback-ref cleanup.
 *
 * A callback ref that returns a cleanup owns its teardown. Older callback refs are
 * cleared with `null`, and object refs are reset directly.
 */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): Ref<T> {
  return (node: T | null) => {
    const cleanups: (() => void)[] = [];

    for (const ref of refs) {
      if (typeof ref === "function") {
        const cleanup = ref(node);
        cleanups.push(typeof cleanup === "function" ? cleanup : () => ref(null));
      } else if (ref != null) {
        ref.current = node;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }

    return () => {
      for (const cleanup of cleanups.reverse()) cleanup();
    };
  };
}

/** A stable composed ref for components that keep a local ref and forward another. */
export function useMergedRefs<T>(
  first: Ref<T> | undefined,
  second: Ref<T> | undefined,
): Ref<T> {
  return useMemo(() => composeRefs(first, second), [first, second]);
}
