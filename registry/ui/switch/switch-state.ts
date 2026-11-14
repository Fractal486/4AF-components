"use client";

import { prefersReducedMotion } from "@/registry/lib/reduced-motion";
import type { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useEffect, useRef, useState, type RefObject } from "react";
import { duration } from "@/registry/lib/motion";

export type SwitchChangeHandler = (checked: boolean, details: BaseSwitch.Root.ChangeEventDetails) => void | PromiseLike<unknown>;

// A checked-value transaction: cancellation is synchronous, only the spinner is delayed,
// errors persist, and reset/unmount discard callbacks. useAction deliberately has different
// outcome timing and unmount semantics; see switch.mdx's saving implementation notes.
export function useSwitchState({ checked, defaultChecked = false, onCheckedChange, onError, pendingDelay = 400, rootRef, inputRef, form }: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: SwitchChangeHandler;
  onError?: (error: unknown) => void;
  pendingDelay?: number;
  rootRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  form?: string;
}) {
  const [internal, setInternal] = useState(defaultChecked);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const generation = useRef(0);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shake = useRef<Animation | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      shake.current?.cancel();
    };
  }, []);

  useEffect(() => {
    const ownerForm = inputRef.current?.form;
    const reset = (event: Event) => queueMicrotask(() => {
      if (event.defaultPrevented || !alive.current) return;
      generation.current++;
      running.current = false;
      clearTimeout(timer.current);
      shake.current?.cancel();
      setOptimistic(null);
      setSlow(false);
      setFailed(false);
      setInternal(defaultChecked);
    });
    ownerForm?.addEventListener("reset", reset);
    return () => ownerForm?.removeEventListener("reset", reset);
  }, [inputRef, form, defaultChecked]);

  const fail = (error: unknown) => {
    setFailed(true);
    const root = rootRef.current;
    if (root?.animate && !prefersReducedMotion(root.ownerDocument.defaultView)) {
      shake.current?.cancel();
      shake.current = root.animate(
        ["0px", "-3px", "3px", "-2px", "2px", "0px"].map((translate) => ({ translate })),
        { duration: duration.base * 1000, easing: "ease-out" },
      );
    }
    onError?.(error);
  };

  const change: SwitchChangeHandler = (next, details) => {
    if (running.current) { details.cancel(); return; }
    let result: ReturnType<SwitchChangeHandler>;
    try { result = onCheckedChange?.(next, details); }
    catch (error) { details.cancel(); fail(error); return; }
    if (details.isCanceled) {
      // A canceled callback may still have started work; consume its rejection.
      if (result != null) void Promise.resolve(result).catch(() => {});
      return;
    }
    shake.current?.cancel();
    setFailed(false);
    if (result == null || typeof result.then !== "function") {
      if (checked === undefined) setInternal(next);
      return;
    }
    const id = ++generation.current;
    running.current = true;
    setOptimistic(next);
    setSlow(false);
    const delay = Number.isFinite(pendingDelay) ? Math.max(0, pendingDelay) : 400;
    timer.current = setTimeout(() => { if (alive.current && generation.current === id) setSlow(true); }, delay);
    void Promise.resolve(result).then(() => {
      if (!alive.current || generation.current !== id) return;
      clearTimeout(timer.current);
      running.current = false;
      if (checked === undefined) setInternal(next);
      setOptimistic(null);
      setSlow(false);
    }, (error: unknown) => {
      if (!alive.current || generation.current !== id) return;
      clearTimeout(timer.current);
      running.current = false;
      setOptimistic(null);
      setSlow(false);
      fail(error);
    });
  };

  return { checked: optimistic ?? checked ?? internal, pending: optimistic !== null, slow, failed, change };
}
