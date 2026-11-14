import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import styles from "./hero-component-preview.module.css";

/** The palette crowns the field; lower samples enter progressively later. */
export const PEAK_LIFT = 56;

export function enterDelay(lift: number) {
  return `${(PEAK_LIFT - lift) * 7}ms`;
}

export function Panel({ name, lift = 0, className, children }: {
  name: string;
  lift?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-preview-panel={name}
      className={cn(styles.panel, className)}
      style={{ "--lift": `${lift}px`, "--enter-delay": enterDelay(lift) } as CSSProperties}
    >
      {children}
    </div>
  );
}
