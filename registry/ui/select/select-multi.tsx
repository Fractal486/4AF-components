"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";

/**
 * A multi-select — pick several items, each with a checkbox. On Base UI's Select.
 *
 * Base UI's `multiple` mode does the real work: the value is an array, the panel stays
 * open as you toggle items, and the keyboard/typeahead/ARIA are the listbox multi-select
 * pattern. The row's tick is the actual `Checkbox` component (rendered inert — the row
 * owns the click), driven by whether this item is in the selected set, so it draws itself
 * on and rubs itself out exactly as it does everywhere else.
 *
 * The trigger, panel and fade match the Base UI single `select.tsx`; only the value
 * summary (a count) and the checkbox rows differ.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const FADE_HIDDEN = { opacity: 0, scale: 0.98, filter: "blur(4px)" };
const FADE_SHOW = { opacity: 1, scale: 1, filter: "blur(0px)" };

// A thin custom scrollbar, shown only when the list overflows. Firefox reads the first
// two properties; WebKit the pseudo-element rules.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

interface MultiContextValue {
  open: boolean;
  values: readonly string[];
}
const MultiSelectContext = createContext<MultiContextValue>({ open: false, values: [] });

export interface MultiSelectProps
  extends Omit<
    ComponentProps<typeof BaseSelect.Root<string, true>>,
    "children" | "multiple" | "value" | "defaultValue" | "onValueChange"
  > {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  children: ReactNode;
}

export function MultiSelect({
  open,
  defaultOpen,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: MultiSelectProps) {
  const [openU, setOpenU] = useState(defaultOpen ?? false);
  const isOpenControlled = open !== undefined;
  const isOpen = isOpenControlled ? open : openU;

  const [valueU, setValueU] = useState<string[]>(defaultValue ?? []);
  const isValueControlled = value !== undefined;
  const values = isValueControlled ? value : valueU;

  const handleOpenChange = useCallback<NonNullable<MultiSelectProps["onOpenChange"]>>(
    (next, details) => {
      if (!isOpenControlled) setOpenU(next);
      onOpenChange?.(next, details);
    },
    [isOpenControlled, onOpenChange],
  );

  const handleValueChange = useCallback(
    (next: string[]) => {
      if (!isValueControlled) setValueU(next);
      onValueChange?.(next);
    },
    [isValueControlled, onValueChange],
  );

  return (
    <MultiSelectContext.Provider value={{ open: isOpen, values }}>
      <BaseSelect.Root
        multiple
        open={isOpen}
        onOpenChange={handleOpenChange}
        value={values}
        onValueChange={handleValueChange as never}
        {...props}
      >
        {children}
      </BaseSelect.Root>
    </MultiSelectContext.Provider>
  );
}

export function MultiSelectValue({
  placeholder,
  className,
}: {
  placeholder?: ReactNode;
  className?: string;
}) {
  return (
    <BaseSelect.Value className={cn("truncate", className)}>
      {(value: string[]) =>
        !value || value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          `${value.length} selected`
        )
      }
    </BaseSelect.Value>
  );
}

export function MultiSelectTrigger({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Trigger>, "className"> & {
  className?: string;
  children?: ReactNode;
}) {
  const { open } = useContext(MultiSelectContext);
  const reduceMotion = useReducedMotion();

  return (
    <BaseSelect.Trigger
      className={cn(
        "group flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3.5 text-sm text-foreground",
        "cursor-pointer outline-none select-none",
        "transition-[background-color,border-color] duration-(--duration-base) ease-out",
        "hover:border-border-strong data-[popup-open]:border-border-strong",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <motion.span
        aria-hidden
        className="shrink-0 text-muted-foreground"
        animate={{ rotate: open ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
      >
        <ChevronDown className="size-4" />
      </motion.span>
    </BaseSelect.Trigger>
  );
}

export function MultiSelectContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> & {
  className?: string;
  children?: ReactNode;
  sideOffset?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { open } = useContext(MultiSelectContext);

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        side="bottom"
        className="z-50 w-[var(--anchor-width)] outline-none"
      >
        {/* Fade driven off `open` (not Motion's mount) so it replays every open — Base UI
            keeps the popup mounted after the first one. */}
        <BaseSelect.Popup
          className={cn(
            "overflow-hidden rounded-md border border-border bg-surface shadow-overlay-drop",
            className,
          )}
          render={
            <motion.div
              style={{ transformOrigin: "var(--transform-origin)" }}
              initial={reduceMotion ? { opacity: 0 } : FADE_HIDDEN}
              animate={
                reduceMotion ? { opacity: open ? 1 : 0 } : open ? FADE_SHOW : FADE_HIDDEN
              }
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            />
          }
          {...props}
        >
          <div
            className={cn(
              "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
              SCROLLBAR,
            )}
          >
            <BaseSelect.List>{children}</BaseSelect.List>
          </div>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function MultiSelectItem({
  value,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof BaseSelect.Item>, "className" | "value"> & {
  value: string;
  className?: string;
  children?: ReactNode;
}) {
  const { values } = useContext(MultiSelectContext);
  const selected = values.includes(value);

  return (
    <BaseSelect.Item
      value={value}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sm outline-none select-none",
        "text-muted-foreground",
        // Base UI moves this highlight with the keyboard as well as the pointer; it snaps
        // (no transition) so it keeps up with arrow-key navigation rather than lagging.
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {/* The real Checkbox, inert: the row owns the click and the ARIA, so the box is
          aria-hidden / non-focusable and just mirrors the selected state. */}
      <Checkbox
        checked={selected}
        size="sm"
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none shrink-0"
      />
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}
