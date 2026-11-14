"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  AnimatePresence,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { duration, ease, overlayExit, spring } from "@/registry/lib/motion";
import { Button } from "@/registry/ui/button/button";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { SheetOverlaySurface, SheetPanelSurface } from "./sheet.motion";
import {
  sheetBodyVariants,
  sheetContentVariants,
  sheetDescriptionVariants,
  sheetFooterVariants,
  sheetHeaderVariants,
  sheetOverlayVariants,
  sheetTitleVariants,
  type SheetContentVariants,
} from "./sheet.variants";

/**
 * A sheet — a dialog that slides in from an edge.
 *
 * Behaviour is Base UI's Dialog: focus is trapped inside while open and returned to the
 * trigger on close, the page behind is scroll-locked and inert, Escape and an
 * outside-click dismiss it, and title/description are wired to `aria-labelledby` /
 * `aria-describedby`.
 *
 * The enter and exit are Motion's, not CSS. Base UI's CSS-transition exit for Dialog is
 * unreliable in this version, and — more importantly — the two directions want to be
 * *asymmetric*, which AnimatePresence expresses directly: the panel slides in from its
 * edge (movement earns attention on arrival), but leaves by drifting a little and fading
 * with a blur, never sliding all the way back out. An exit shouldn't demand the attention
 * the enter does.
 *
 * Base UI's `keepMounted` lets AnimatePresence own the unmount timing, so the exit gets
 * to finish before the DOM is torn down.
 */

const SheetOpenContext = createContext(false);
const SheetContentContext = createContext({ showClose: true });
const sheetOpenAttribute = "data-4af-sheet-open";
let openSheetCount = 0;

export interface SheetProps extends Omit<ComponentProps<typeof BaseDialog.Root>, "children"> {
  children: ReactNode;
}

export function Sheet({ open, defaultOpen, onOpenChange, children, ...props }: SheetProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  useEffect(() => {
    if (!isOpen) return;

    openSheetCount += 1;
    document.documentElement.setAttribute(sheetOpenAttribute, "");

    return () => {
      openSheetCount = Math.max(0, openSheetCount - 1);
      if (openSheetCount === 0) document.documentElement.removeAttribute(sheetOpenAttribute);
    };
  }, [isOpen]);

  const handleOpenChange = useCallback<NonNullable<SheetProps["onOpenChange"]>>(
    (next, details) => {
      onOpenChange?.(next, details);
      if (!isControlled && !details.isCanceled) setUncontrolled(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SheetOpenContext.Provider value={isOpen}>
      <BaseDialog.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </BaseDialog.Root>
    </SheetOpenContext.Provider>
  );
}

export const SheetTrigger = BaseDialog.Trigger;
export const SheetClose = BaseDialog.Close;

type Side = NonNullable<SheetContentVariants["side"]>;

// Enter: off-screen at the edge, fully opaque — a pure slide.
const enterFrom: Record<Side, TargetAndTransition> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  top: { y: "-100%" },
  bottom: { y: "100%" },
};

// Exit: a small drift in the leaving direction, plus fade and a heavy blur. Not a
// slide-off — the drift is ~48px, enough to read as movement without pulling focus.
const exitTo: Record<Side, TargetAndTransition> = {
  right: { x: 48, opacity: 0, filter: "blur(14px)" },
  left: { x: -48, opacity: 0, filter: "blur(14px)" },
  top: { y: -48, opacity: 0, filter: "blur(14px)" },
  bottom: { y: 48, opacity: 0, filter: "blur(14px)" },
};

function mergeClassName<State>(base: string, className: string | ((state: State) => string | undefined) | undefined) {
  return typeof className === "function" ? (state: State) => cn(base, className(state)) : cn(base, className);
}

export function SheetPortal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="sheet-portal" {...props} />;
}

export type SheetOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function SheetOverlay({ className, render, ...props }: SheetOverlayProps) {
  const reduceMotion = useReducedMotion();
  return (
    <BaseDialog.Backdrop
      data-slot="sheet-overlay"
      className={mergeClassName(sheetOverlayVariants(), className)}
      render={(elementProps, state) => (
        <SheetOverlaySurface
          elementProps={elementProps}
          state={state}
          render={render}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : duration.fast } }}
          transition={{ duration: reduceMotion ? 0 : duration.slow, ease: ease.out }}
        />
      )}
      {...props}
    />
  );
}

export interface SheetContentProps
  extends ComponentProps<typeof BaseDialog.Popup>,
    SheetContentVariants {
  showClose?: boolean;
  /** Customize the built-in backdrop, including its classes, render element, and ref. */
  overlayProps?: SheetOverlayProps;
  /** Customize the portal or its container. Content owns mounting for exit animations. */
  portalProps?: Omit<ComponentProps<typeof BaseDialog.Portal>, "children" | "keepMounted">;
  /**
   * Fired once the exit animation has finished and the panel has left the DOM.
   *
   * For a caller that only knows whether the sheet should exist — a host driven by a
   * store rather than by a parent's state — this is when it is safe to forget it.
   * Without it such a host has to unmount the sheet on the press, which cuts the exit
   * off before it starts, or guess at a duration.
   */
  onExitComplete?: () => void;
  children?: ReactNode;
}

export function SheetContent({
  side = "right",
  className,
  render,
  children,
  showClose = true,
  overlayProps,
  portalProps,
  onExitComplete,
  ...props
}: SheetContentProps) {
  const open = useContext(SheetOpenContext);
  const reduceMotion = useReducedMotion();
  const resolvedSide: Side = side ?? "right";

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        // keepMounted on the Portal keeps the whole subtree in the DOM so
        // AnimatePresence, not Base UI, owns when it's torn down.
        <SheetPortal {...portalProps} keepMounted>
          <SheetOverlay {...overlayProps} />
          <BaseDialog.Popup
            data-slot="sheet-content"
            data-side={resolvedSide}
            className={mergeClassName(sheetContentVariants({ side: resolvedSide }), className)}
            render={(elementProps, state) => (
              <SheetPanelSurface
                elementProps={elementProps}
                state={state}
                render={render}
                initial={
                  reduceMotion ? { opacity: 0 } : { ...enterFrom[resolvedSide], opacity: 1 }
                }
                animate={{ x: 0, y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { ...exitTo[resolvedSide], transition: overlayExit.transition }
                }
                transition={reduceMotion ? { duration: 0 } : spring.smooth}
              />
            )}
            {...props}
          >
            <SheetContentContext.Provider value={{ showClose }}>
              {children}
            </SheetContentContext.Provider>
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
        </SheetPortal>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  const { showClose } = useContext(SheetContentContext);
  return <div data-slot="sheet-header" data-show-close={showClose ? "" : undefined} className={cn(sheetHeaderVariants(), className)} {...props} />;
}

/** The scrolling middle of a sheet. `className` styles the scrolling element itself. */
export function SheetBody({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <ScrollArea data-slot="sheet-body" className="min-h-0 min-w-0 flex-auto" viewportClassName={cn(sheetBodyVariants(), className)} {...props}>
      {children}
    </ScrollArea>
  );
}

export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(sheetFooterVariants(), className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="sheet-title"
      className={mergeClassName(sheetTitleVariants(), className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      data-slot="sheet-description"
      className={mergeClassName(sheetDescriptionVariants(), className)}
      {...props}
    />
  );
}
