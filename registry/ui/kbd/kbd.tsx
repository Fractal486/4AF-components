"use client";

import { cloneElement, createContext, Fragment, isValidElement, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { Slot, useSlotChild } from "@/registry/lib/slot";
import { formatKbdKeys, parseKbdKeys, useAppleKeys } from "./kbd.keys";
import { kbdGroupVariants, kbdVariants } from "./kbd.variants";

export type KbdSize = "sm" | "md";
const KbdSizeContext = createContext<KbdSize | undefined>(undefined);

/** Keep a custom element while replacing its contents with generated key labels. */
function useKeyContent(children: ReactNode, content: ReactNode, asChild: boolean) {
  const child = useSlotChild(children);
  if (content === undefined) return child;
  if (!asChild) return content;
  return isValidElement(child) ? cloneElement(child, undefined, content) : child;
}

export interface KbdProps extends ComponentProps<"kbd"> {
  /** Compact shortcuts or slightly larger standalone keycaps. @default "sm" */
  size?: KbdSize;
  /** Key names joined by +. `mod` becomes Command on Apple devices and Ctrl elsewhere. */
  keys?: string;
  /** Apply the keycap's props and styles to a single child element. */
  asChild?: boolean;
}

/** A semantic keycap. The caller supplies the key label and handles the shortcut. */
export function Kbd({ className, size, keys, children, asChild = false, ...props }: KbdProps) {
  const groupSize = useContext(KbdSizeContext);
  const resolvedSize = size ?? groupSize ?? "sm";
  const apple = useAppleKeys();
  const content = useKeyContent(children, keys === undefined ? undefined : formatKbdKeys(keys, apple), asChild);
  const Component = asChild ? Slot : "kbd";
  return (
    <Component
      data-slot="kbd"
      data-size={resolvedSize}
      className={cn(kbdVariants({ size: resolvedSize }), className)}
      {...props}
    >{content}</Component>
  );
}

export interface KbdGroupProps extends ComponentProps<"kbd"> {
  /** Inherited by child keycaps unless they specify their own size. */
  size?: KbdSize;
  /** Generate one keycap per key. Spaces separate sequence steps, such as `g g`. */
  keys?: string;
  /** Content between sequence steps. @default "then" */
  separator?: ReactNode;
  asChild?: boolean;
}

/** Related keycaps, with optional generated combinations and sequences. */
export function KbdGroup({ className, size, keys, separator = "then", children, asChild = false, ...props }: KbdGroupProps) {
  const inheritedSize = useContext(KbdSizeContext);
  const resolvedSize = size ?? inheritedSize ?? "sm";
  const chords = keys === undefined ? undefined : parseKbdKeys(keys);
  const content = useKeyContent(children, chords?.map((chord, index) => (
    <Fragment key={index}>
      {index > 0 && separator != null && <span data-slot="kbd-separator" className="px-0.5 font-sans text-muted-foreground">{separator}</span>}
      {chord.map((key, keyIndex) => <Kbd key={keyIndex} keys={key} />)}
    </Fragment>
  )), asChild);
  const Component = asChild ? Slot : "kbd";
  return (
    <KbdSizeContext.Provider value={resolvedSize}>
      <Component data-slot="kbd-group" data-size={resolvedSize}
        className={cn(kbdGroupVariants({ size: resolvedSize }), className)} {...props}>
        {content}
      </Component>
    </KbdSizeContext.Provider>
  );
}
