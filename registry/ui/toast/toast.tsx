"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { Bell, Check, Info, LoaderCircle, X } from "lucide-react";
import type {
  ToastManager as BaseToastManager,
  ToastManagerAddOptions as BaseToastManagerAddOptions,
  ToastManagerPromiseOptions as BaseToastManagerPromiseOptions,
  ToastManagerUpdateOptions as BaseToastManagerUpdateOptions,
  ToastObject as BaseToastObject,
} from "@base-ui/react/toast";
import {
  useMemo,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button } from "@/registry/ui/button/button";
import { Morph } from "@/registry/ui/morph/morph";
import {
  toastIconVariants,
  toastVariants,
  type ToastType,
  type ToastVariant,
} from "./toast.variants";

export type { ToastVariant } from "./toast.variants";

/**
 * A stacking toast.
 *
 * Behaviour is Base UI's Toast: a queue with per-toast timers that pause on hover and
 * focus, a live region, keyboard focus into the stack (F6) and back, swipe-to-dismiss,
 * and a `limit` beyond which older toasts collapse away. The manager (`useToast`) fires
 * them imperatively from anywhere under the provider.
 *
 * Each toast uses the default title-and-description layout unless its `variant` is
 * `"title-only"`, which omits the description slot. Status remains independent in `type`.
 *
 * Two stacking modes, both driven by the custom properties Base UI publishes on each
 * toast — no per-toast Motion component, no layout runtime:
 *
 * - `list` (the beUI feel): every toast stays fanned out, one above the next. Base UI
 *   recomputes `--toast-offset-y` as toasts come and go, and the CSS transition on the
 *   transform turns each reflow into a spring-ish push.
 * - `collapse` (the Base UI feel): the stack sits as overlapping cards — older ones peek
 *   up and shrink, past the `limit` they hide — and fans open on hover/focus
 *   (`data-expanded`).
 *
 * The enter and exit are the beUI ones, expressed in CSS: it rises out of a blur, and
 * leaves by sliding off and blurring. They compose into the *same* stack transform via
 * `--enter-y` / `--exit-x` / `--io-scale`, so an exiting toast keeps its place in the
 * stack instead of snapping to the origin. Durations read from `--duration-*`, so reduced
 * motion collapses them with no JS; the loading spinner is the one looping exception.
 */

/**
 * The failure glyph — a filled hexagon with an alert bar, not Lucide's circled "!".
 * Sized by `className` (the chip passes `size-3.5`) and painted with `currentColor`.
 */
function HexagonAlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.30761 1.5L1.5 5.30761L1.5 10.6924L5.30761 14.5H10.6924L14.5 10.6924V5.30761L10.6924 1.5H5.30761ZM5.10051 0C4.83529 0 4.58094 0.105357 4.3934 0.292893L0.292893 4.3934C0.105357 4.58094 0 4.83529 0 5.10051V10.8995C0 11.1647 0.105357 11.4191 0.292894 11.6066L4.3934 15.7071C4.58094 15.8946 4.83529 16 5.10051 16H10.8995C11.1647 16 11.4191 15.8946 11.6066 15.7071L15.7071 11.6066C15.8946 11.4191 16 11.1647 16 10.8995V5.10051C16 4.83529 15.8946 4.58093 15.7071 4.3934L11.6066 0.292893C11.4191 0.105357 11.1647 0 10.8995 0H5.10051ZM8.75 3.75V4.5V8L8.75 8.75H7.25V8V4.5V3.75H8.75ZM8 12C8.55229 12 9 11.5523 9 11C9 10.4477 8.55229 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"
      />
    </svg>
  );
}

type IconComponent = ComponentType<{ className?: string }>;

const STATUS_ICON: Record<ToastType, IconComponent> = {
  neutral: Bell,
  info: Info,
  loading: LoaderCircle,
  success: Check,
  error: HexagonAlertIcon,
};

export type ToastPosition = "bottom-right" | "bottom-center";
export type ToastStack = "list" | "collapse";

/** Optional per-toast data. `morph` animates the title between states (loading → done). */
export interface ToastData {
  morph?: boolean;
}

/** Props for one of up to three custom action buttons rendered in a toast. */
export type ToastActionProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children"
> & {
  children: ReactNode;
};

export type ToastObject<Data extends object = ToastData> = BaseToastObject<Data> & {
  /** Content layout. `title-only` omits the description slot. */
  variant?: ToastVariant;
  /** Custom actions rendered below the toast description. */
  actions?: ToastActionProps[];
};

export type ToastManagerAddOptions<Data extends object = ToastData> =
  BaseToastManagerAddOptions<Data> & {
    /** Content layout. `title-only` omits the description slot. */
    variant?: ToastVariant;
    /** Renders at most the first three custom actions. */
    actions?: ToastActionProps[];
  };

export type ToastManagerUpdateOptions<Data extends object = ToastData> =
  BaseToastManagerUpdateOptions<Data> & {
    /** Content layout. `title-only` omits the description slot. */
    variant?: ToastVariant;
    /** Renders at most the first three custom actions. */
    actions?: ToastActionProps[];
  };

export type ToastManagerPromiseOptions<Value, Data extends object = ToastData> = Omit<
  BaseToastManagerPromiseOptions<Value, Data>,
  "loading" | "success" | "error"
> & {
  loading: string | ToastManagerUpdateOptions<Data>;
  success:
    | string
    | ToastManagerUpdateOptions<Data>
    | ((result: Value) => string | ToastManagerUpdateOptions<Data>);
  error:
    | string
    | ToastManagerUpdateOptions<Data>
    | ((error: unknown) => string | ToastManagerUpdateOptions<Data>);
};

type ToastPromiseResult<Data extends object> = string | ToastManagerUpdateOptions<Data>;
type ToastPromiseOption<Value, Data extends object> =
  | ToastPromiseResult<Data>
  | ((value: Value) => ToastPromiseResult<Data>);

type ToastManagerMethods<Data extends object> = {
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  close: BaseToastManager<Data>["close"];
  update: <T extends Data = Data>(id: string, options: ToastManagerUpdateOptions<T>) => void;
  promise: <Value, T extends Data = Data>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, T>,
  ) => Promise<Value>;
};

export interface ToastManager<Data extends object = ToastData>
  extends Pick<BaseToastManager<Data>, " subscribe">,
    ToastManagerMethods<Data> {}

export interface ToastManagerState<Data extends object = ToastData> extends ToastManagerMethods<Data> {
  toasts: ToastObject<Data>[];
}

const MAX_TOAST_ACTIONS = 3;

function limitToastActions<T extends { actions?: ToastActionProps[] }>(options: T): T {
  if (!options.actions || options.actions.length <= MAX_TOAST_ACTIONS) return options;
  return { ...options, actions: options.actions.slice(0, MAX_TOAST_ACTIONS) };
}

function adaptToastPromiseOption<Value, Data extends object>(
  option: ToastPromiseOption<Value, Data>,
): string | BaseToastManagerUpdateOptions<Data> | ((value: Value) => string | BaseToastManagerUpdateOptions<Data>) {
  if (typeof option === "string") return option;
  if (typeof option === "function") {
    return (value) => {
      const result = option(value);
      return typeof result === "string"
        ? result
        : (limitToastActions(result) as BaseToastManagerUpdateOptions<Data>);
    };
  }
  return limitToastActions(option) as BaseToastManagerUpdateOptions<Data>;
}

function adaptToastMethods<Data extends object>(
  manager: Pick<BaseToastManager<Data>, "add" | "close" | "update" | "promise">,
): ToastManagerMethods<Data> {
  return {
    add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) =>
      manager.add(limitToastActions(options) as BaseToastManagerAddOptions<T>),
    close: manager.close,
    update: <T extends Data = Data>(id: string, options: ToastManagerUpdateOptions<T>) => {
      manager.update(id, limitToastActions(options) as BaseToastManagerUpdateOptions<T>);
    },
    promise: <Value, T extends Data = Data>(
      promiseValue: Promise<Value>,
      options: ToastManagerPromiseOptions<Value, T>,
    ) =>
      manager.promise(promiseValue, {
        ...options,
        loading: adaptToastPromiseOption(options.loading),
        success: adaptToastPromiseOption(options.success),
        error: adaptToastPromiseOption(options.error),
      } as BaseToastManagerPromiseOptions<Value, T>),
  };
}

/** Fire, update, and dismiss toasts. Call from any component under `ToastProvider`. */
export function useToast<Data extends object = ToastData>(): ToastManagerState<Data> {
  const manager = BaseToast.useToastManager<Data>();
  const adapted = useMemo(() => adaptToastMethods<Data>(manager), [manager]);

  return useMemo(
    () => ({
      toasts: manager.toasts as ToastObject<Data>[],
      add: adapted.add,
      close: adapted.close,
      update: adapted.update,
      promise: adapted.promise,
    }),
    [adapted, manager.toasts],
  );
}

/** For firing toasts from outside React (event handlers, stores). Pass to the provider. */
export function createToastManager<Data extends object = ToastData>(): ToastManager<Data> {
  const manager = BaseToast.createToastManager<Data>();
  return {
    " subscribe": manager[" subscribe"],
    ...adaptToastMethods<Data>(manager),
  };
}

export interface ToastProviderProps extends ComponentProps<typeof BaseToast.Provider> {
  /** Which corner the stack anchors to. Both grow upward from the bottom. */
  position?: ToastPosition;
  /** `list` keeps every toast fanned out (beUI); `collapse` overlaps them and fans on hover. */
  stack?: ToastStack;
}

export function ToastProvider({
  position = "bottom-right",
  stack = "list",
  children,
  ...props
}: ToastProviderProps) {
  return (
    <BaseToast.Provider {...props}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          // Height tracks the front toast so the collapsed stack has a hover target;
          // fanned toasts overflow upward (no clipping) and sustain the hover themselves.
          style={{ height: "var(--toast-frontmost-height)" }}
          className={cn(
            "fixed bottom-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm outline-none",
            position === "bottom-center" ? "left-1/2 -translate-x-1/2" : "right-4",
          )}
        >
          <ToastList stack={stack} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

function ToastList({ stack }: { stack: ToastStack }) {
  const { toasts } = useToast();
  return toasts.map((toast) => <ToastItem key={toast.id} toast={toast} stack={stack} />);
}

// Both modes share one transform. The stack position lives in `--stack-y` / `--stack-scale`
// (set per mode below); the enter/exit nudges live in `--enter-y` / `--exit-x` / `--io-scale`
// (set by the starting/ending-style variants). Everything reads through here, so an exiting
// toast slides off *from* its stacked position rather than the origin.
const ROOT_TRANSFORM =
  "[transform:translateX(calc(var(--toast-swipe-movement-x,0px)_+_var(--exit-x,0px)))_translateY(calc(var(--stack-y,0px)_+_var(--toast-swipe-movement-y,0px)_+_var(--enter-y,0px)))_scale(calc(var(--stack-scale,1)_*_var(--io-scale,1)))]";

// Stack position, written as literal class strings (Tailwind only generates classes it can
// find verbatim in the source, so these can't be built up by concatenation).
//
// `list`: always fanned — lift by the real heights stacked in front, plus a gap per step.
const STACK_LIST =
  "[--stack-y:calc(var(--toast-offset-y,0px)*-1_+_min(var(--toast-index,0),10)*-0.75rem)] [--stack-scale:1]";
// `collapse`: overlapped cards peek up by a fraction of their own height and shrink going
// back; on hover/focus the viewport marks them expanded and they fan out to the list layout.
const STACK_COLLAPSE =
  "[--stack-y:calc(min(var(--toast-index,0),10)*-20%)] [--stack-scale:calc(max(0,1_-_min(var(--toast-index,0),10)*0.1))] data-[expanded]:[--stack-y:calc(var(--toast-offset-y,0px)*-1_+_min(var(--toast-index,0),10)*-0.75rem)] data-[expanded]:[--stack-scale:1]";

function ToastItem({ toast, stack }: { toast: ToastObject<ToastData>; stack: ToastStack }) {
  const type = (toast.type as ToastType) ?? "neutral";
  const variant = toast.variant ?? "default";
  const Icon = STATUS_ICON[type] ?? Bell;
  const shouldMorph = Boolean(toast.data?.morph);
  const hasCustomActions = toast.actions !== undefined;
  const customActions = toast.actions?.slice(0, MAX_TOAST_ACTIONS);
  // Explicit size (not the chip's `[&>svg]` rule) so it still applies when Morph nests the
  // icon a few levels down.
  const iconNode =
    type === "loading" ? (
      <LoaderCircle className="size-3.5 animate-spin" />
    ) : (
      <Icon className="size-3.5" />
    );

  return (
    <BaseToast.Root
      toast={toast}
      swipeDirection={["right", "down"]}
      data-variant={variant}
      className={cn(
        // Pinned to the bottom of the viewport; the transform fans them out from there.
        // `origin-bottom` keeps a scaled card's bottom edge aligned, which is the stack.
        "group absolute inset-x-0 bottom-0 w-full origin-bottom select-none opacity-100 blur-0",
        "rounded-lg border border-border bg-surface-raised p-3 shadow-overlay-drop",
        "[z-index:calc(1000_-_var(--toast-index,0))]",
        ROOT_TRANSFORM,
        // Stack position per mode. `list` is always fanned; `collapse` overlaps and only
        // fans when the viewport marks the stack expanded.
        stack === "list" ? STACK_LIST : STACK_COLLAPSE,
        toastVariants({ variant }),
        // Enter (beUI): rise out of a blur. Exit (beUI): slide off, shrink, blur, fade —
        // faster than the enter. Both keep the stacked position via the shared transform.
        "data-[starting-style]:[--enter-y:22px] data-[starting-style]:[--io-scale:0.96] data-[starting-style]:opacity-0 data-[starting-style]:blur-[10px]",
        "data-[ending-style]:[--exit-x:32px] data-[ending-style]:[--io-scale:0.96] data-[ending-style]:opacity-0 data-[ending-style]:blur-[8px] data-[ending-style]:duration-(--duration-base)",
        "data-[limited]:pointer-events-none data-[limited]:opacity-0",
        "transition-[transform,opacity,filter] duration-(--duration-slow) ease-out",
        // While the finger is down, the transform must track it 1:1 — no catch-up tween.
        "data-[swiping]:transition-none",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={toastIconVariants({ type })}>
          {/* Morph the glyph on a status change (spinner → check) rather than snapping. */}
          {shouldMorph ? <Morph activeKey={String(type)} items={{ [type]: iconNode }} /> : iconNode}
        </span>

        <div className={cn("min-w-0 flex-1", variant === "title-only" && "self-center")}>
          {shouldMorph ? (
            <BaseToast.Title
              // Morph animates the title between updates (e.g. "Uploading…" → "Upload
              // complete"). A single-item `items` is enough: AnimatePresence holds the
              // previously rendered text on screen to animate it out.
              render={<div className="text-sm leading-5 font-medium text-foreground" />}
            >
              <Morph activeKey={String(toast.title)} items={{ [String(toast.title)]: toast.title }} />
            </BaseToast.Title>
          ) : (
            <BaseToast.Title className="truncate text-sm leading-5 font-medium text-foreground" />
          )}
          {variant !== "title-only" && (
            <BaseToast.Description className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground" />
          )}
          {hasCustomActions ? (
            customActions &&
            customActions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {customActions.map((action, index) => {
                  const { className, ...props } = action;
                  return (
                    <Button
                      key={index}
                      {...props}
                      variant="outline"
                      size="sm"
                      className={className}
                    />
                  );
                })}
              </div>
            )
          ) : toast.actionProps ? (
            <BaseToast.Action render={<Button variant="outline" size="sm" className="mt-2" />} />
          ) : null}
        </div>

        <BaseToast.Close
          render={
            <Button
              variant="plain"
              size="icon-sm"
              pressScale={false}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground"
            >
              <X />
            </Button>
          }
        />
      </div>
    </BaseToast.Root>
  );
}
