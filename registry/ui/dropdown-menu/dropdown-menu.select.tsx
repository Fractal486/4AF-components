import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { Input } from "@/registry/ui/input/input";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { resumeFromActiveRow } from "@/registry/ui/ui/select.utils";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CheckMark } from "@/registry/lib/check-mark";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
import { CHECK_SLOT, DisabledReasonTooltip } from "./dropdown-menu.shared";

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
  registerOptionText: (value: unknown, text: string, node: HTMLElement | null) => void;
  options: Map<unknown, { text: string; node: HTMLElement | null }>;
  activeValue: { value: unknown } | null;
  activate: (value: unknown) => void;
  clearActive: () => void;
  unregisterOptionText: (value: unknown) => void;
  visibleOptionCount: number;
}

const DropdownMenuSelectContext = createContext<DropdownMenuSelectContextValue | null>(null);

/**
 * Whether the pointer has left a panel without a search field: its active row is kept for the
 * arrow keys to resume from, but stops painting, as a hover does when the pointer moves away.
 */
const DropdownMenuSelectDormantContext = createContext(false);

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

  const [optionTexts, setOptionTexts] = useState<Map<unknown, { text: string; node: HTMLElement | null }>>(() => new Map());
  const [activeValue, setActiveValue] = useState<{ value: unknown } | null>(null);
  const activate = useCallback((value: unknown) => {
    setActiveValue((current) => current && Object.is(current.value, value) ? current : { value });
  }, []);
  const clearActive = useCallback(() => setActiveValue(null), []);
  const registerOptionText = useCallback((valueToRegister: unknown, text: string, node: HTMLElement | null) => {
    setOptionTexts((current) => {
      if (current.get(valueToRegister)?.text === text && current.get(valueToRegister)?.node === node) return current;
      return new Map(current).set(valueToRegister, { text, node });
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
    () => Array.from(optionTexts.values()).filter(({ text }) => matchesQuery(text)).length,
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
      options: optionTexts,
      activeValue,
      activate,
      clearActive,
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
      optionTexts,
      activeValue,
      activate,
      clearActive,
    ],
  );

  return (
    <DropdownMenuSelectContext.Provider value={context}>
      <DropdownMenuSub highlightItemOnHover open={currentOpen} onOpenChange={setOpen} disabled={disabled}>
        {children}
      </DropdownMenuSub>
    </DropdownMenuSelectContext.Provider>
  );
}

const selectItemBase = cn(
  "relative flex min-w-0 items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-xs wrap-anywhere outline-none select-none",
  "text-muted-foreground data-[panel-active]:not-data-[panel-dormant]:bg-muted data-[panel-active]:not-data-[panel-dormant]:text-foreground",
  "data-[checked]:text-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
);

const selectItemIcon =
  "pointer-events-none flex size-3.5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

function enabledSelectItems(list: HTMLElement | null) {
  return Array.from(
    list?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitemcheckbox"]') ?? [],
  ).filter((item) => {
    // Hidden by a search inside the list, not by anything around it: Base UI can mark the
    // whole positioner `hidden` while its anchor has no size, and the rows are still the rows.
    const hidden = item.closest("[hidden]");
    return !(hidden && list?.contains(hidden)) && item.getAttribute("aria-disabled") !== "true";
  });
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
  className?: ComponentProps<typeof BaseMenu.SubmenuTrigger>["className"];
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
      className={mergeStateClassName("min-w-0", className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 wrap-anywhere text-foreground">{label ?? placeholder}</span>
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
  /** Activate the selected or first enabled row on open; focus search when present. */
  autoFocusFirstItem?: boolean;
}

/** The select panel opened by a `DropdownMenuSelectTrigger`, positioned as a submenu. */
export function DropdownMenuSelectContent({
  children,
  className,
  side = "right",
  align = "start",
  keepMounted,
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

  const { open, searchQuery, options, values, activate, clearActive } = context;

  // Without a search field the active row behaves like a hover once the pointer leaves:
  // unpainted, but kept for the arrows. A searchable panel keeps it lit for Enter.
  const [pointerLeft, setPointerLeft] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setPointerLeft(false);
  }
  const dormant = pointerLeft && !searchable;
  const previous = useRef({ open: false, query: "" });
  useEffect(() => {
    const opening = open && !previous.current.open;
    const queryChanged = searchQuery !== previous.current.query;
    if (!open) {
      previous.current = { open: false, query: "" };
      clearActive();
      return;
    }
    if (!autoFocusFirstItem) {
      previous.current = { open, query: searchQuery };
      return;
    }

    const prime = () => {
      // Portal visibility settles after the submenu opens. Read rows then, in DOM order.
      const rows = enabledSelectItems(listRef.current);
      const selected = [...values].reverse().map((value) => options.get(value)?.node)
        .find((node) => node != null && rows.includes(node));
      const current = rows.find((row) => row.hasAttribute("data-panel-active"));
      const row = queryChanged ? rows[0] : opening ? selected ?? rows[0] : current ?? selected ?? rows[0];
      const entry = [...options].find(([, option]) => option.node === row);
      if (entry) activate(entry[0]);
      else clearActive();
      // Mark opening as handled only after the registered rows are available.
      // A registration rerender can cancel an earlier scheduled frame.
      previous.current = { open, query: searchQuery };
      if (opening) {
        if (searchable) searchInputRef.current?.focus();
        else row?.focus();
      }
    };
    if (!opening) {
      prime();
      return;
    }
    const frame = requestAnimationFrame(prime);
    return () => cancelAnimationFrame(frame);
  }, [open, searchQuery, options, values, autoFocusFirstItem, searchable, activate, clearActive]);

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
    // the standalone Select's search inset and its 4px list + 10px row icon inset.
    // Stretch the Input wrapper so its h-full field fills the search strip.
    <div
      className={cn(
        "-mx-1 flex h-[38px] shrink-0 items-stretch gap-2 px-3.5",
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
            const rows = enabledSelectItems(listRef.current);
            const active = rows.find((row) => row.hasAttribute("data-panel-active"));
            (active ?? (event.key === "ArrowDown" ? rows[0] : rows.at(-1)))?.focus();
            return;
          }

          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            enabledSelectItems(listRef.current).find((row) => row.hasAttribute("data-panel-active"))?.click();
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
      keepMounted={keepMounted ?? props.portalProps?.keepMounted ?? true}
      className={mergeStateClassName(cn(searchable && "overflow-hidden"), className)}
      onFocus={(event) => {
        onFocus?.(event);
        if (searchable && autoFocusFirstItem && event.target === event.currentTarget) {
          searchInputRef.current?.focus();
        }
      }}
      onPointerLeave={(event) => {
        if (!searchable && event.pointerType !== "touch") setPointerLeft(true);
      }}
      onPointerMove={() => {
        if (pointerLeft) setPointerLeft(false);
      }}
      onKeyDownCapture={(event) => {
        if (searchable) return;
        if (pointerLeft) setPointerLeft(false);
        // Only when the panel itself holds focus, where Base UI parks it after the pointer
        // leaves. Keys from a nested panel bubble through here too, and are not ours.
        if (event.target === event.currentTarget && resumeFromActiveRow(
          listRef.current, event.key, '[role="menuitemradio"], [role="menuitemcheckbox"]',
        )) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      {...props}
    >
      {searchable && searchPosition === "top" && searchField}
      <ScrollArea
        viewportRef={listRef}
        viewportProps={{ tabIndex: -1 }}
        className={cn("max-h-[min(var(--available-height),18rem)]", noResults && "hidden")}
        // The menu panel already insets its content 4px, the same as its own rows, so the list
        // adds only the gap on the search field's side — where the field cancels that inset.
        viewportClassName={searchable ? (searchPosition === "bottom" ? "pb-1" : "pt-1") : undefined}
      >
        <DropdownMenuSelectDormantContext.Provider value={dormant}>{items}</DropdownMenuSelectDormantContext.Provider>
      </ScrollArea>
      {noResults && (
        // The same gap beside the field as the list's; `h-7` matches one select row, keeping
        // the full panel height identical to a single result.
        <div className={cn("flex h-7 items-center justify-center px-2.5 text-center text-xs text-muted-foreground", searchPosition === "bottom" ? "mb-1" : "mt-1")}>
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
  className?: ComponentProps<typeof BaseMenu.RadioItem>["className"];
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
  const itemRef = useRef<HTMLElement>(null);
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
  useLayoutEffect(() => {
    registerOptionText(value, optionText, itemRef.current);
    return () => unregisterOptionText(value);
  }, [optionText, registerOptionText, unregisterOptionText, value, isDisabled]);

  const panelActive = context.activeValue !== null && Object.is(context.activeValue.value, value);
  const panelDormant = useContext(DropdownMenuSelectDormantContext) && panelActive;
  const activationProps = {
    ref: itemRef,
    "data-panel-active": panelActive ? "" : undefined,
    "data-panel-dormant": panelDormant ? "" : undefined,
    onFocus: () => { if (!isDisabled && !hiddenBySearch) context.activate(value); },
  };

  if (context.multiple) {
    return (
      <BaseMenu.CheckboxItem
        {...activationProps}
        checked={checked}
        onCheckedChange={(nextChecked) => context.toggleValue(value, nextChecked)}
        disabled={isDisabled || hiddenBySearch}
        hidden={hiddenBySearch}
        label={itemLabel}
        className={mergeStateClassName(cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto"), className)}
        render={(itemProps, state) => (
          <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
            <div {...itemProps}>
              {icon && (
                <span aria-hidden="true" className={selectItemIcon}>
                  {icon}
                </span>
              )}
              <span className="min-w-0 flex-1 wrap-anywhere">{children}</span>
              <span
                data-slot="dropdown-menu-select-item-check"
                data-checked={state.checked ? "" : undefined}
                className={CHECK_SLOT}
              >
                <CheckMark checked={state.checked} />
              </span>
            </div>
          </DisabledReasonTooltip>
        )}
      />
    );
  }

  const item = (
    <BaseMenu.RadioItem
      {...activationProps}
      value={value}
      disabled={isDisabled || hiddenBySearch}
      hidden={hiddenBySearch}
      label={itemLabel}
      className={mergeStateClassName(cn(selectItemBase, hasReason && "data-[disabled]:pointer-events-auto"), className)}
    >
      {icon && (
        <span aria-hidden="true" className={selectItemIcon}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 wrap-anywhere">{children}</span>
      <BaseMenu.RadioItemIndicator
        keepMounted
        className="ml-auto flex size-3.5 shrink-0 items-center justify-center text-foreground"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <CheckMark checked={state.checked} />
          </span>
        )}
      />
    </BaseMenu.RadioItem>
  );

  return (
    <DisabledReasonTooltip disabled={isDisabled} reason={disabledReason}>
      {item}
    </DisabledReasonTooltip>
  );
}
