"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease, spring } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";

/** Site navigation owns its slide-out; the library Sheet keeps its standard exit. */
export function SiteNavigationContent({
  open,
  onExitComplete,
  children,
}: { open: boolean; onExitComplete: () => void; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <BaseDialog.Portal keepMounted>
          <BaseDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: ease.out }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />
            }
          />
          <BaseDialog.Popup
            className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-0 border-r border-border bg-surface-raised p-0 shadow-overlay-drop outline-none"
            render={
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { x: "-100%", opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : {
                        x: "-100%",
                        transition: { type: "tween", duration: duration.slow * 0.8, ease: ease.out },
                      }
                }
                transition={reduceMotion ? { duration: 0 } : spring.smooth}
              />
            }
          >
            {children}
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
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      )}
    </AnimatePresence>
  );
}
