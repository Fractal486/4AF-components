import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import { useMergedRefs } from "@/registry/lib/refs";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Fragment, useContext, useEffect, type ComponentProps, type ReactNode } from "react";
import { SelectContext } from "./select.context";
import { SelectItemIcon, SIZE } from "./select.shared";
import {
  selectSortTriggerVariants,
  selectTriggerVariants,
  type SelectTriggerVariant,
} from "./select.variants";

export function SelectValue({
  className,
  children,
  placeholder,
  render,
  ...props
}: ComponentProps<typeof BaseSelect.Value>) {
  const { multiple, iconFor, size } = useContext(SelectContext);

  if (!multiple && render == null) {
    return (
      <BaseSelect.Value
        className={cn("truncate", className)}
        placeholder={placeholder}
        render={(valueProps, state) => (
          <span
            {...valueProps}
            className={cn("flex min-w-0 items-center gap-2 truncate", valueProps.className)}
          >
            <SelectItemIcon icon={iconFor(state.value)} size={size} />
            <span className="truncate">{valueProps.children}</span>
          </span>
        )}
        {...props}
      >
        {children}
      </BaseSelect.Value>
    );
  }

  return (
    <BaseSelect.Value
      className={cn("truncate", className)}
      placeholder={placeholder}
      render={render}
      {...props}
    >
      {children ?? ((value: unknown) => {
        const count = Array.isArray(value) ? value.length : 0;

        return count === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          `${count} selected`
        );
      })}
    </BaseSelect.Value>
  );
}

export interface SelectTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "className"> {
  className?: string;
  children?: ReactNode;
  /** Boxed field by default; `ghost` keeps its geometry with Button's ghost colors; `plain` removes the surface, border and horizontal padding. */
  variant?: SelectTriggerVariant;
  /** @deprecated Use `variant="plain"` or `variant="default"`. */
  outline?: boolean;
  /** Optional dimmed prefix shown before the selected value, e.g. "Fruit: Banana". */
  label?: ReactNode;
  /** The trailing chevron. */
  chevron?: boolean;
}

export function SelectTrigger({
  className,
  children,
  variant,
  outline,
  label,
  chevron = true,
  ref,
  ...props
}: SelectTriggerProps) {
  const { open, size, setTriggerSizing, setTriggerNode } = useContext(SelectContext);
  const triggerRef = useMergedRefs<HTMLButtonElement>(setTriggerNode, ref);
  const reduceMotion = useReducedMotion();
  const resolvedVariant = variant ?? (outline === false ? "plain" : "default");

  useEffect(() => {
    // `default` and `ghost` fill their row; `plain` is as wide as its text.
    setTriggerSizing(resolvedVariant === "plain" ? "content" : "field");
  }, [resolvedVariant, setTriggerSizing]);

  return (
    <BaseSelect.Trigger
      ref={triggerRef}
      data-variant={resolvedVariant}
      className={cn(
        // `md` (34px) matches Button's default and the Input — a select beside either in a
        // form row lines up with it. `sm` (30px, the default) is the compact toolbar size;
        // `xs` is the dense 24px control.
        SIZE[size].field,
        selectTriggerVariants({ variant: resolvedVariant }),
        SIZE[size].radius,
        className,
      )}
      {...props}
    >
      {label ? (
        <span className="flex min-w-0 items-center truncate">
          <span data-slot="select-label" className="shrink-0 text-muted-foreground">
            {label}: {"\u00a0\u00a0"}
          </span>
          {children}
        </span>
      ) : (
        children
      )}
      {chevron && (
        <motion.span
          aria-hidden
          className="shrink-0 text-muted-foreground"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : spring.chevron
          }
        >
          <ChevronDown className={SIZE[size].glyph} />
        </motion.span>
      )}
    </BaseSelect.Trigger>
  );
}

export interface SelectSortTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "className" | "children"> {
  className?: string;
  /** Chip by default; `ghost` keeps its geometry with Button's ghost colors; `plain` removes the surface, border and horizontal padding. */
  variant?: SelectTriggerVariant;
  /** @deprecated Use `variant="plain"` or `variant="default"`. */
  outline?: boolean;
  /** A leading icon. Optional — omit for a text-only chip. */
  icon?: ReactNode;
  /** A dimmed prefix, e.g. "Sort" or "Status", shown before the value(s). Optional. */
  label?: ReactNode;
  /** Append the selected value(s) after the label — "Status: Active, Paused". */
  showValue?: boolean;
  /** Shown (muted) in place of the value(s) while nothing is selected. */
  placeholder?: ReactNode;
}

/**
 * A sort / filter chip trigger — the toolbar counterpart to the full-width `SelectTrigger`.
 *
 * It sizes to its content and reads its own selection from context, so it can show the
 * picked value(s) after an optional label ("Status: Active, Paused"), and — while the
 * selection is empty (no active sort/filter) — dash its border to read as "unset". A
 * brighter fill marks the open panel. Every part is optional: with just `icon` and the
 * chevron and label/value off, it collapses to the plain icon button. Works in `multiple`
 * mode for filters, where the value list is what's shown.
 */
export function SelectSortTrigger({
  className,
  icon,
  label,
  variant,
  outline = true,
  showValue = true,
  placeholder = "Any",
  ref,
  ...props
}: SelectSortTriggerProps) {
  const { open, values, labelFor, size, setTriggerSizing, setTriggerNode } =
    useContext(SelectContext);
  const triggerRef = useMergedRefs<HTMLButtonElement>(setTriggerNode, ref);
  const reduceMotion = useReducedMotion();
  const resolvedVariant = variant ?? (outline === false ? "plain" : "default");

  useEffect(() => {
    // The chip sizes to its label and picks in every variant, so it is always content-sized.
    setTriggerSizing("content");
  }, [setTriggerSizing]);
  const selected = values.map((v) => labelFor(v) ?? (typeof v === "string" ? v : String(v)));
  const isUnset = selected.length === 0;
  // With no label and no value shown, the chip is a bare icon button — the chevron would
  // be the only text-ish thing, so drop it and let the icon stand alone.
  const iconOnly = !label && !showValue;
  const showChevron = !iconOnly;

  return (
    <BaseSelect.Trigger
      ref={triggerRef}
      data-variant={resolvedVariant}
      data-unset={isUnset || undefined}
      className={cn(
        // Square once the label and chevron are gone: the padded chip is sized for text,
        // so a glyph on its own comes out 38x30 and reads as a mistake in the row of
        // 30x30 icon buttons it stands in. Each tier matches Button's icon box.
        iconOnly ? SIZE[size].chipIconOnly : SIZE[size].chip,
        selectSortTriggerVariants({ variant: resolvedVariant }),
        SIZE[size].radius,
        resolvedVariant === "default" &&
          (isUnset
            ? "border-dashed border-border-strong bg-surface"
            : "border-border bg-muted"),
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            "shrink-0",
            size === "md" ? "[&>svg]:size-4" : "[&>svg]:size-3.5",
            // Icon-only chip: the glyph carries the state, so it brightens to the
            // foreground once something's selected. Otherwise it stays a muted adornment.
            iconOnly && !isUnset ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
      )}
      {(label || showValue) && (
        <span className="min-w-0 truncate">
          {label && (
            <span className="text-muted-foreground">
              {label}
            </span>
          )}
          {showValue &&
            (isUnset ? (
              <span className="text-muted-foreground">
                {label ? ":\u00a0\u00a0" : null}
                {placeholder}
              </span>
            ) : (
              <span className="text-foreground">
                {label ? <span className="text-muted-foreground">:{"\u00a0\u00a0"}</span> : null}
                {selected.map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 ? ", " : null}
                    {item}
                  </Fragment>
                ))}
              </span>
            ))}
        </span>
      )}
      {showChevron && (
        // Same Motion spring as `SelectTrigger`, so the two chevrons flip identically.
        <motion.span
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground",
            resolvedVariant === "plain" && "order-3",
          )}
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion ? { duration: 0 } : spring.chevron
          }
        >
          <ChevronDown className={SIZE[size].glyph} />
        </motion.span>
      )}
    </BaseSelect.Trigger>
  );
}
