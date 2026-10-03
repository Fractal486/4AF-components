import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  type DropdownMenuContentProps,
} from "./dropdown-menu.menu";
import { DisabledReasonTooltip } from "./dropdown-menu.shared";

type DropdownMenuSelectValue<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value | null;

interface DropdownMenuSelectContextValue {
  disabled: boolean;
  multiple: boolean;
  values: unknown[];
  open: boolean;
  setOpen: (open: boolean) => void;
  selectSingle: (value: unknown) => void;
  toggleValue: (value: unknown, checked: boolean) => void;
  registerLabel: (value: unknown, label: ReactNode) => void;
  unregisterLabel: (value: unknown) => void;
  labelFor: (value: unknown) => ReactNode | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchesQuery: (text: string) => boolean;
  registerOptionText: (value: unknown, text: string) => void;
  unregisterOptionText: (value: unknown) => void;
  visibleOptionCount: number;
}

const DropdownMenuSelectContext = createContext<DropdownMenuSelectContextValue | null>(null);

function useDropdownMenuSelectContext() {
  const context = useContext(DropdownMenuSelectContext);

  if (!context) {
    throw new Error(
      "DropdownMenuSelectTrigger, DropdownMenuSelectContent, and DropdownMenuSelectItem must be used inside DropdownMenuSelect.",
    );
  }

  return context;
}

export interface DropdownMenuSelectProps<Value, Multiple extends boolean | undefined = false> {
  children: ReactNode;
  multiple?: Multiple;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  value?: DropdownMenuSelectValue<Value, Multiple>;
  defaultValue?: DropdownMenuSelectValue<Value, Multiple>;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: DropdownMenuSelectValue<Value, Multiple>) => void;
}

/**
 * A select panel that participates in the dropdown's real submenu tree.
 *
 * Using the menu submenu primitive here is important: it gives the nested select the same
 * safe hover path as every other submenu, so moving from the row to the panel doesn't close
 * it while the pointer crosses the gap.
 */
export function DropdownMenuSelect<Value, Multiple extends boolean | undefined = false>({
  children,
  multiple,
  disabled = false,
  open,
  defaultOpen = false,
  value,
  defaultValue,
  onOpenChange,
  onValueChange,
}: DropdownMenuSelectProps<Value, Multiple>) {
  const isMultiple = Boolean(multiple);
  const isValueControlled = value !== undefined;
  const isOpenControlled = open !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<Value | Value[] | null>(
    () => (defaultValue ?? (isMultiple ? [] : null)) as Value | Value[] | null,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const currentValue = isValueControlled ? value : uncontrolledValue;
  const currentOpen = isOpenControlled ? open : uncontrolledOpen;
  const [searchQuery, setSearchQuery] = useState("");
  const values = useMemo<unknown[]>(
    () =>
      isMultiple
        ? Array.isArray(currentValue)
          ? currentValue
          : []
        : currentValue == null
          ? []
          : [currentValue],
    [currentValue, isMultiple],
  );

  // Opening the panel always starts from the full set of choices. Adjusted during render
  // rather than in an effect: nothing external is being synchronised, so an effect would
  // just paint the stale query for a frame and then schedule a second render.
  const [wasOpen, setWasOpen] = useState(currentOpen);
  if (wasOpen !== currentOpen) {
    setWasOpen(currentOpen);
    if (currentOpen) setSearchQuery("");
  }

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  const setSelection = useCallback(
    (nextValue: Value | Value[] | null) => {
      if (!isValueControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue as DropdownMenuSelectValue<Value, Multiple>);
    },
    [isValueControlled, onValueChange],
  );

  const selectSingle = useCallback(
    (nextValue: unknown) => {
      setSelection(nextValue as Value);
      setOpen(false);
    },
    [setOpen, setSelection],
  );

  const toggleValue = useCallback(
    (nextValue: unknown, checked: boolean) => {
      const nextValues = checked
        ? [...values, nextValue]
        : values.filter((current) => !Object.is(current, nextValue));
      setSelection(nextValues as Value[]);
    },
    [setSelection, values],
  );

  const [labels, setLabels] = useState<Map<unknown, ReactNode>>(() => new Map());
  const registerLabel = useCallback((valueToRegister: unknown, label: ReactNode) => {
    setLabels((current) => {
      if (Object.is(current.get(valueToRegister), label)) return current;
      return new Map(current).set(valueToRegister, label);
    });
  }, []);
  const unregisterLabel = useCallback((valueToUnregister: unknown) => {
    setLabels((current) => {
      if (!current.has(valueToUnregister)) return current;
      const next = new Map(current);
      next.delete(valueToUnregister);
      return next;
    });
  }, []);
  const labelFor = useCallback((valueToRead: unknown) => labels.get(valueToRead), [labels]);

  const [optionTexts, setOptionTexts] = useState<Map<unknown, string>>(() => new Map());
  const registerOptionText = useCallback((valueToRegister: unknown, text: string) => {
    setOptionTexts((current) => {
      if (current.get(valueToRegister) === text) return current;
      return new Map(current).set(valueToRegister, text);
    });
  }, []);
  const unregisterOptionText = useCallback((valueToUnregister: unknown) => {
    setOptionTexts((current) => {
      if (!current.has(valueToUnregister)) return current;
      const next = new Map(current);
      next.delete(valueToUnregister);
      return next;
    });
  }, []);
  const matchesQuery = useCallback(
    (text: string) => {
      const query = searchQuery.trim().toLocaleLowerCase();
      return query === "" || text.toLocaleLowerCase().includes(query);
    },
    [searchQuery],
  );
  const visibleOptionCount = useMemo(
    () => Array.from(optionTexts.values()).filter(matchesQuery).length,
    [matchesQuery, optionTexts],
  );

  const context = useMemo<DropdownMenuSelectContextValue>(
    () => ({
      disabled,
      multiple: isMultiple,
      values,
      open: currentOpen,
      setOpen,
      selectSingle,
      toggleValue,
      registerLabel,
      unregisterLabel,
      labelFor,
      searchQuery,
      setSearchQuery,
      matchesQuery,
      registerOptionText,
      unregisterOptionText,
      visibleOptionCount,
    }),
    [
      currentOpen,
      disabled,
      isMultiple,
      labelFor,
      matchesQuery,
      registerLabel,
      registerOptionText,
      selectSingle,
      setOpen,
      searchQuery,
      setSearchQuery,
      toggleValue,
      unregisterLabel,
      unregisterOptionText,
      visibleOptionCount,
      values,
    ],
  );

  return (
    <DropdownMenuSelectContext.Provider value={context}>
      <DropdownMenuSub open={currentOpen} onOpenChange={setOpen} disabled={disabled}>
        {children}
      </DropdownMenuSub>
    </DropdownMenuSelectContext.Provider>
  );
}

const selectItemBase = cn(
  "relative flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-xs outline-none select-none",
  "text-muted-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground",
  "data-[checked]:text-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
);

const selectItemIcon =
  "pointer-events-none flex size-3.5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

function focusDropdownMenuSelectItem(
  list: HTMLElement | null,
  direction: "next" | "previous",
) {
  if (!list) return;

  const items = Array.from(
    list.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitemcheckbox"]'),
  ).filter(
    (item) =>
      !item.hidden &&
      !item.closest("[hidden]") &&
      item.getAttribute("aria-disabled") !== "true",
  );
  const item = direction === "next" ? items[0] : items.at(-1);
  item?.focus();
}

export interface DropdownMenuSelectTriggerProps
  extends Omit<
    ComponentProps<typeof BaseMenu.SubmenuTrigger>,
    "children" | "className" | "delay"
  > {
  /** An optional leading icon for the menu row. */
  icon?: ReactNode;
  /** The label shown on the left side of the trigger. */
  placeholder?: ReactNode;
  className?: string;
  /** Hover delay in milliseconds. @default 0 */
  delay?: number;
}

/**
 * The row that opens a select panel from inside a dropdown menu.
 *
 * It is a real submenu trigger for arrow-key navigation and hover-safe pointer movement.
 * The trigger keeps its label on the left and shows the selected value or count before
 * the chevron.
 */
export function DropdownMenuSelectTrigger({
  icon,
  placeholder = "Select",
  className,
  disabled,
  label,
  ...props
}: DropdownMenuSelectTriggerProps) {
  const context = useDropdownMenuSelectContext();
  const hasSelection = context.values.length > 0;
  const selectedValue = context.values[0];
  const summary = context.multiple
    ? hasSelection
      ? `${context.values.length} selected`
      : placeholder
    : hasSelection
      ? (context.labelFor(selectedValue) ?? placeholder)
      : placeholder;

  return (
    <DropdownMenuSubTrigger
      {...props}
      disabled={disabled || context.disabled}
      label={label ?? (typeof placeholder === "string" ? placeholder : undefined)}
      className={cn("min-w-0", className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-foreground">{label ?? placeholder}</span>
      {hasSelection && (
        <span className="ml-auto max-w-[50%] shrink-0 truncate text-muted-foreground">{summary}</span>
      )}
    </DropdownMenuSubTrigger>
  );
}

export interface DropdownMenuSelectContentProps extends DropdownMenuContentProps {
  /** Adds the same optional in-panel filter field as the standalone Select. */
  searchable?: boolean;
  /** Which end of the panel the filter field sits at. */
  searchPosition?: "top" | "bottom";
  /** Placeholder for the optional panel filter field. */
  searchPlaceholder?: string;
  /** Message shown when the filter has no matching options. */
  emptyMessage?: ReactNode;
  /** Focus the search field when the panel opens. */
  autoFocusFirstItem?: boolean;
}

/** The select panel opened by a `DropdownMenuSelectTrigger`, positioned as a submenu. */
export function DropdownMenuSelectContent({
  children,
  className,
  side = "right",
  align = "start",
  keepMounted = true,
  searchable = false,
  searchPosition = "top",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  autoFocusFirstItem = true,
  onFocus,
  ...props
}: DropdownMenuSelectContentProps) {
  const context = useDropdownMenuSelectContext();
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noResults =
    searchable && context.searchQuery.trim() !== "" && context.visibleOptionCount === 0;

  useEffect(() => {
    if (!searchable || !autoFocusFirstItem || !context.open) return;

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirstItem, context.open, searchable]);

  const items = context.multiple ? (
    children
  ) : (
    <DropdownMenuRadioGroup
      value={context.values[0] ?? null}
      onValueChange={context.selectSingle}
    >
      {children}
    </DropdownMenuRadioGroup>
  );

  const searchField = searchable ? (
    // A fixed 38px row, flush to the panel edge: the negative margins cancel the popup's
    // `p-1` so the strip runs from the panel's top edge to its separator line at exactly
    // 38px (the popup's `overflow-hidden` clips it to the rounded corners). `px-3.5` matches
    // the standalone Select's search inset and its 4px list + 10px row icon inset. Icon and
    // input are centred flex children rather than an absolute icon over a padded input.
    <div
      className={cn(
        "-mx-1 flex h-[38px] shrink-0 items-center gap-2 px-3.5",
        searchPosition === "bottom" ? "-mb-1 border-t border-border" : "-mt-1 border-b border-border",
      )}
    >
      <Input
        ref={searchInputRef}
        aria-label="Search options"
        variant="plain"
        value={context.searchQuery}
        onChange={(event) => context.setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            focusDropdownMenuSelectItem(
              listRef.current,
              event.key === "ArrowDown" ? "next" : "previous",
            );
            return;
          }

          if (!event.metaKey && !event.ctrlKey && event.key !== "Escape") {
            event.stopPropagation();
          }
        }}
        placeholder={searchPlaceholder}
        className="h-full border-0 p-0 text-xs"
      />
    </div>
  ) : null;

  return (
    <DropdownMenuSubContent
      side={side}
      align={align}
      keepMounted={keepMounted}
      className={cn(searchable && "overflow-hidden", className)}
      onFocus={(event) => {
        onFocus?.(event);
        if (searchable && event.target === event.currentTarget) {
          searchInputRef.current?.focus();
        }
      }}
      {...props}
    >
      {searchable && searchPosition === "top" && searchField}
      <div
        ref={listRef}
        className={cn(
          "max-h-[min(var(--available-height),18rem)] overflow-y-auto p-1",
          "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong",
          noResults && "hidden",
        )}
      >
        {items}
      </div>
      {noResults && (
        // `m-1` supplies the same 4px inset as the list's `p-1`; `h-7` matches one
        // select row, keeping the full panel height identical to a single result.
        <div className="m-1 flex h-7 items-center justify-center px-2.5 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {searchable && searchPosition === "bottom" && searchField}
    </DropdownMenuSubContent>
  );
}

export interface DropdownMenuSelectItemProps {
  value: unknown;
  children?: ReactNode;
  icon?: ReactNode;
  label?: string;
  disabled?: boolean;
  /** Explain why a disabled option is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
  className?: string;
  /** Text used by an ancestor searchable select panel to match this option. */
  searchValue?: string;
}

export function DropdownMenuSelectItem({
  value,
  children,
  icon,
  label,
  disabled,
  disabledReason,
  className,
  searchValue,
}: DropdownMenuSelectItemProps) {
  const context = useDropdownMenuSelectContext();
  const itemLabel = label ?? (typeof children === "string" ? children : String(value));
  const optionText = searchValue ?? (typeof children === "string" ? children : itemLabel);
  const hiddenBySearch = !context.matchesQuery(optionText);
  const isDisabled = disabled || context.disabled;
  const hasReason = isDisabled && disabledReason != null && disabledReason !== "";
  const checked = context.values.some((current) => Object.is(current, value));
  const {
    registerLabel,
    unregisterLabel,
    registerOptionText,
    unregisterOptionText,
  } = context;

  useEffect(() => {
    registerLabel(value, itemLabel);
    return () => unregisterLabel(value);
  }, [itemLabel, registerLabel, unregisterLabel, value]);
  useEffect(() => {
    registerOptionText(value, optionText);
    return () => unregisterOptionText(value);
  }, [optionText, registerOptionText, unregisterOptionText, value]);

  if (context.multiple) {
    return (
      <BaseMenu.CheckboxItem
        checked={checked}
        onCheckedChange={(nextChecked) => context.toggleValue(value, nextChecked)}
        disabled={isDisabled || hiddenBySearch}
        hidden={hiddenBySearch}
        label={itemLabel}
        className={cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto", className)}
        render={(itemProps, state) => (
          <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
            <div {...itemProps}>
              <Checkbox
                checked={state.checked}
                aria-hidden
                tabIndex={-1}
                className="pointer-events-none shrink-0"
              />
              {icon && (
                <span aria-hidden="true" className={selectItemIcon}>
                  {icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{children}</span>
            </div>
          </DisabledReasonTooltip>
        )}
      />
    );
  }

  const item = (
    <BaseMenu.RadioItem
      value={value}
      disabled={isDisabled || hiddenBySearch}
      hidden={hiddenBySearch}
      label={itemLabel}
      className={cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto", className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <BaseMenu.RadioItemIndicator
        keepMounted
        className={cn(
          "ml-auto flex size-3.5 shrink-0 items-center justify-center text-foreground",
          "scale-0 opacity-0 transition-[opacity,scale] duration-(--duration-fast) ease-out",
          "data-[checked]:scale-100 data-[checked]:opacity-100",
        )}
      >
        <Check className="size-3.5" />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );

  return (
    <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}
