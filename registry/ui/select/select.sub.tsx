import { cn } from "@/registry/lib/cn";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronRight } from "lucide-react";
import {
  Children,
  Fragment,
  isValidElement,
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
  SelectContext,
  SelectSubContext,
  SelectSubItemContext,
  useSelectSubContext,
  type SelectSubItemContextValue,
} from "./select.context";
import { SelectItem, type SelectItemProps } from "./select.item";
import { preventBaseUIHandler } from "./select.utils";

/**
 * How long the pointer may rest on its way to a nested panel before the panel closes. A
 * pointer that stops over a sibling row has stopped heading for the panel.
 */
const SAFE_TRAVEL_REST_MS = 300;
/** Slack around the safe triangle, so a pointer grazing its edges doesn't drop the panel. */
const SAFE_TRAVEL_SLACK_PX = 4;

type Point = readonly [x: number, y: number];

/** Whether `p` lies inside the triangle `a`, `b`, `c` (either winding, edges included). */
function inTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const side = (from: Point, to: Point) =>
    (p[0] - to[0]) * (from[1] - to[1]) - (from[0] - to[0]) * (p[1] - to[1]);
  const ab = side(a, b);
  const bc = side(b, c);
  const ca = side(c, a);
  return !((ab < 0 || bc < 0 || ca < 0) && (ab > 0 || bc > 0 || ca > 0));
}

interface SelectSearchChildProps {
  value?: unknown;
  children?: ReactNode;
  searchValue?: string;
}

interface SelectSearchOption {
  value: unknown;
  text: string;
}

/**
 * Read the direct option elements of a nested panel before its popup mounts. Base UI keeps
 * closed select portals out of the tree, so the real items cannot register their search text
 * until the panel is opened. This lightweight pass only reads the public value/label props;
 * the mounted items still own all rendering and interaction.
 */
function collectSelectSearchOptions(children: ReactNode): SelectSearchOption[] {
  const options: SelectSearchOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const childProps = child.props as SelectSearchChildProps;

    if (child.type === Fragment) {
      options.push(...collectSelectSearchOptions(childProps.children));
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(childProps, "value")) return;

    options.push({
      value: childProps.value,
      text:
        childProps.searchValue ??
        (typeof childProps.children === "string"
          ? childProps.children
          : String(childProps.value)),
    });
  });

  return options;
}

/** Read a submenu's options synchronously so its trigger count is correct on first paint. */
function collectSelectSubOptions(children: ReactNode): SelectSearchOption[] {
  const options: SelectSearchOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const childProps = child.props as SelectSearchChildProps;
    if (child.type === Fragment) {
      options.push(...collectSelectSubOptions(childProps.children));
      return;
    }

    if (child.type === SelectSubContent) {
      options.push(...collectSelectSearchOptions(childProps.children));
    }
  });

  return options;
}

function focusNestedOption(
  items: Map<unknown, HTMLElement>,
  values: unknown[],
  multiple: boolean,
) {
  const isEnabled = (node: HTMLElement | undefined) =>
    Boolean(
      node &&
        node.isConnected &&
        !node.hidden &&
        node.getAttribute("aria-disabled") !== "true" &&
        !(node instanceof HTMLButtonElement && node.disabled),
    );
  const options = Array.from(items.values()).filter(isEnabled);
  const selected = multiple
    ? [...values].reverse().map((value) => items.get(value)).find(isEnabled)
    : items.get(values[0]);
  (isEnabled(selected) ? selected : options[0])?.focus();
}

type SelectSubOpenChange = NonNullable<
  ComponentProps<typeof BaseSelect.Root>["onOpenChange"]
>;

export interface SelectSubProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: SelectSubOpenChange;
}

/** Groups a nested select panel and its trigger. */
export function SelectSub({
  children,
  open,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
}: SelectSubProps) {
  const select = useContext(SelectContext);
  const parentPanelOpen = useContext(SelectSubItemContext);
  const itemValues = useMemo(
    () => collectSelectSubOptions(children).map((option) => option.value),
    [children],
  );
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [triggerValue] = useState<symbol>(() => Symbol("select-sub-trigger"));
  const triggerRef = useRef<HTMLElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeDelayRef = useRef(100);
  const openedByHoverRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const stopSafeTravelRef = useRef<(() => void) | null>(null);
  const setPanelNode = useCallback((node: HTMLElement | null) => {
    panelRef.current = node;
  }, []);
  const setTriggerNode = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    setAnchor((current) => (current === node ? current : node));
  }, []);
  const parentPanelAvailable = parentPanelOpen === null || parentPanelOpen.open;
  const currentOpen =
    select.open && parentPanelAvailable && (isControlled ? Boolean(open) : uncontrolledOpen);
  const resolvedDisabled =
    disabled || select.disabled || select.readOnly || !parentPanelAvailable;

  const cancelOpen = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    stopSafeTravelRef.current?.();
  }, []);
  const setCloseDelay = useCallback((delay: number) => {
    closeDelayRef.current = delay;
  }, []);

  const handleOpenChange = useCallback<SelectSubOpenChange>(
    (nextOpen, details) => {
      cancelOpen();
      cancelClose();
      onOpenChange?.(nextOpen, details);
      if (!details?.isCanceled && !isControlled) setUncontrolledOpen(nextOpen);
      if (!nextOpen && !details?.isCanceled) {
        openedByHoverRef.current = false;
      }
    },
    [cancelClose, cancelOpen, isControlled, onOpenChange],
  );

  const setOpen = useCallback(
    (nextOpen: boolean, details?: unknown) => {
      cancelOpen();
      cancelClose();
      if (!nextOpen) openedByHoverRef.current = false;
      handleOpenChange(nextOpen, details as never);
    },
    [cancelClose, cancelOpen, handleOpenChange],
  );

  const openAndFocus = useCallback(() => {
    if (resolvedDisabled) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = false;
    handleOpenChange(true, undefined as never);
  }, [cancelClose, cancelOpen, handleOpenChange, resolvedDisabled]);

  const openFromHover = useCallback(() => {
    if (resolvedDisabled) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = true;
    handleOpenChange(true, undefined as never);
  }, [cancelClose, cancelOpen, handleOpenChange, resolvedDisabled]);

  const scheduleOpen = useCallback(
    (delay: number) => {
      if (resolvedDisabled || currentOpen) return;
      cancelClose();
      cancelOpen();
      if (delay <= 0) {
        openFromHover();
        return;
      }
      openTimerRef.current = setTimeout(openFromHover, delay);
    },
    [cancelClose, cancelOpen, currentOpen, openFromHover, resolvedDisabled],
  );

  const scheduleClose = useCallback(
    (delay = closeDelayRef.current) => {
      cancelOpen();
      if (!openedByHoverRef.current) return;
      cancelClose();
      const close = () => {
        closeTimerRef.current = null;
        openedByHoverRef.current = false;
        handleOpenChange(false, undefined as never);
      };
      if (delay <= 0) {
        close();
        return;
      }
      closeTimerRef.current = setTimeout(close, delay);
    },
    [cancelClose, cancelOpen, handleOpenChange],
  );

  /**
   * The safe triangle. Leaving the trigger for the panel beside it means crossing the rows
   * between them, and a straight-line timer can't tell that apart from moving to one of
   * those rows: too short and a diagonal path drops the panel, too long and the panel
   * lingers over the row you actually meant. So the leave point and the panel's near edge
   * make a triangle, and the panel stays while the pointer moves inside it. It closes the
   * moment the pointer strays out, or once it rests inside for `SAFE_TRAVEL_REST_MS`.
   *
   * Reaching the panel ends the tracking through `cancelClose`, as does coming back to the
   * trigger. With no panel to measure — not mounted, or not laid out — it falls back to the
   * plain close delay.
   */
  const leaveTowardPanel = useCallback(
    (x: number, y: number, fallbackDelay: number) => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!openedByHoverRef.current || !rect || rect.width === 0 || rect.height === 0) {
        scheduleClose(fallbackDelay);
        return;
      }
      cancelClose();
      const towardRight = rect.left >= x;
      const nearX = towardRight ? rect.left : rect.right;
      // The apex sits a little behind the leave point, so the first move after leaving
      // can't fall outside on rounding alone.
      const apex: Point = [x + (towardRight ? -SAFE_TRAVEL_SLACK_PX : SAFE_TRAVEL_SLACK_PX), y];
      const top: Point = [nearX, rect.top - SAFE_TRAVEL_SLACK_PX];
      const bottom: Point = [nearX, rect.bottom + SAFE_TRAVEL_SLACK_PX];

      let rest: ReturnType<typeof setTimeout> | undefined;
      const stop = () => {
        clearTimeout(rest);
        document.removeEventListener("pointermove", move, true);
        if (stopSafeTravelRef.current === stop) stopSafeTravelRef.current = null;
      };
      const closeNow = () => {
        stop();
        scheduleClose(0);
      };
      const restart = () => {
        clearTimeout(rest);
        rest = setTimeout(closeNow, SAFE_TRAVEL_REST_MS);
      };
      function move(event: PointerEvent) {
        if (event.pointerType !== "mouse") return;
        const point: Point = [event.clientX, event.clientY];
        if (inTriangle(point, apex, top, bottom)) restart();
        else closeNow();
      }
      document.addEventListener("pointermove", move, true);
      stopSafeTravelRef.current = stop;
      restart();
    },
    [cancelClose, scheduleClose],
  );

  const focusTrigger = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const [wasAvailable, setWasAvailable] = useState(select.open && parentPanelAvailable);
  const available = select.open && parentPanelAvailable;
  if (wasAvailable !== available) {
    setWasAvailable(available);
    if (!available) {
      if (!isControlled) setUncontrolledOpen(false);
    }
  }

  useEffect(
    () => () => {
      cancelOpen();
      cancelClose();
    },
    [cancelClose, cancelOpen],
  );

  useEffect(() => {
    if (available) return;
    cancelOpen();
    cancelClose();
    openedByHoverRef.current = false;
  }, [available, cancelClose, cancelOpen]);

  return (
    <SelectSubContext.Provider
      value={{
        open: currentOpen,
        disabled: resolvedDisabled,
        anchor,
        triggerValue,
        itemValues,
        focusTrigger,
        setTriggerNode,
        setOpen,
        openAndFocus,
        scheduleOpen,
        scheduleClose,
        cancelClose,
        setCloseDelay,
        leaveTowardPanel,
        setPanelNode,
      }}
    >
      {children}
    </SelectSubContext.Provider>
  );
}

export interface SelectSubTriggerProps
  extends Omit<
    SelectItemProps,
    "children" | "value" | "className" | "disabled" | "label" | "render" | "end"
  > {
  children?: ReactNode;
  className?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
  /** Open the nested panel when the pointer enters this row. @default true */
  openOnHover?: boolean;
  /** Hover delay in milliseconds. @default 0 */
  delay?: number;
  /** Hover close delay in milliseconds. @default 100 */
  closeDelay?: number;
}

type SelectSubTriggerClickEvent = Parameters<
  NonNullable<SelectSubTriggerProps["onClick"]>
>[0];

type SelectSubTriggerKeyDownEvent = Parameters<
  NonNullable<SelectSubTriggerProps["onKeyDown"]>
>[0];

/** A select row that opens a nested panel. */
export function SelectSubTrigger({
  children,
  className,
  disabled = false,
  label,
  id,
  onClick: onClickProp,
  onKeyDown: onKeyDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerLeave: onPointerLeaveProp,
  openOnHover = true,
  delay = 0,
  closeDelay = 100,
  ...props
}: SelectSubTriggerProps) {
  const select = useContext(SelectContext);
  const {
    open: subOpen,
    disabled: subDisabled,
    triggerValue,
    itemValues,
    setOpen: setSubOpen,
    setTriggerNode,
    openAndFocus,
    scheduleOpen,
    scheduleClose,
    cancelClose,
    setCloseDelay,
    leaveTowardPanel,
  } = useSelectSubContext();
  const resolvedDisabled = disabled || subDisabled;
  const triggerLabel =
    typeof label === "string" ? label : typeof children === "string" ? children : undefined;
  const selectedItemCount = itemValues.filter((itemValue) =>
    select.values.some((selectedValue) => Object.is(itemValue, selectedValue)),
  ).length;

  useEffect(() => {
    setCloseDelay(closeDelay);
  }, [closeDelay, setCloseDelay]);

  const handleClick = (event: SelectSubTriggerClickEvent) => {
    onClickProp?.(event);
    if (event.defaultPrevented || resolvedDisabled) return;

    // This row uses a private sentinel value only to participate in the outer select's
    // composite list. It is a panel trigger, never a selectable value.
    preventBaseUIHandler(event);
    setSubOpen(true);
  };

  const handleKeyDown = (event: SelectSubTriggerKeyDownEvent) => {
    onKeyDownProp?.(event);
    if (event.defaultPrevented || resolvedDisabled) return;

    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      preventBaseUIHandler(event);
      openAndFocus();
    }
  };

  const handlePointerMove: NonNullable<SelectSubTriggerProps["onPointerMove"]> = (event) => {
    onPointerMoveProp?.(event);
    if (event.defaultPrevented || resolvedDisabled || !openOnHover) return;
    if (event.pointerType !== "mouse") return;
    cancelClose();
    scheduleOpen(delay);
  };

  const handlePointerLeave: NonNullable<SelectSubTriggerProps["onPointerLeave"]> = (event) => {
    onPointerLeaveProp?.(event);
    if (event.defaultPrevented || resolvedDisabled || !openOnHover) return;
    // A mouse may be on its way to the panel; see `leaveTowardPanel`.
    if (event.pointerType === "mouse") leaveTowardPanel(event.clientX, event.clientY, closeDelay);
    else scheduleClose(closeDelay);
  };

  return (
    <SelectItem
      {...props}
      ref={setTriggerNode}
      id={id}
      value={triggerValue}
      label={triggerLabel}
      disabled={resolvedDisabled}
      aria-haspopup="listbox"
      aria-expanded={subOpen}
      data-popup-open={subOpen || undefined}
      data-selected-count={select.multiple ? selectedItemCount : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("data-[popup-open]:bg-muted data-[popup-open]:text-foreground", className)}
      end={
        <span className="flex shrink-0 items-center gap-1.5">
          {select.multiple && (
            <span
              aria-hidden="true"
              data-slot="select-sub-count"
              className="tabular-nums text-muted-foreground/60"
            >
              {selectedItemCount}
            </span>
          )}
          <ChevronRight
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </span>
      }
    >
      {children}
    </SelectItem>
  );
}

export interface SelectSubContentProps
  extends Omit<ComponentProps<typeof BaseSelect.Popup>, "className"> {
  className?: string;
  children?: ReactNode;
  side?: ComponentProps<typeof BaseSelect.Positioner>["side"];
  align?: ComponentProps<typeof BaseSelect.Positioner>["align"];
  sideOffset?: number;
  alignOffset?: number;
  /** Keep the panel mounted so selected child labels remain available to the trigger. */
  keepMounted?: boolean;
}

type SelectSubContentKeyDownEvent = Parameters<
  NonNullable<SelectSubContentProps["onKeyDown"]>
>[0];

/** A nested select panel whose children are ordinary `SelectItem`s. */
export function SelectSubContent({
  className,
  children,
  side = "right",
  align = "start",
  sideOffset = 8,
  alignOffset = -4,
  keepMounted = true,
  role: roleProp,
  onKeyDown: onKeyDownProp,
  ...props
}: SelectSubContentProps) {
  const select = useContext(SelectContext);
  const { registerNestedPanel, registerOptionText, unregisterOptionText } = select;
  const {
    open: subOpen,
    anchor,
    triggerValue,
    setOpen: setSubOpen,
    focusTrigger,
    scheduleClose,
    cancelClose,
    setPanelNode,
  } = useSelectSubContext();
  const nestedSearchOptions = useMemo(
    () => collectSelectSearchOptions(children),
    [children],
  );
  const nestedValue = select.multiple ? select.values : (select.values[0] ?? null);
  const nestedItemsRef = useRef<Map<unknown, HTMLElement>>(new Map());
  const [nestedItemsVersion, setNestedItemsVersion] = useState(0);
  const registerItem = useCallback((value: unknown, node: HTMLElement | null) => {
    const current = nestedItemsRef.current.get(value);
    if (node) {
      if (current === node) return;
      nestedItemsRef.current.set(value, node);
    } else {
      if (!current) return;
      nestedItemsRef.current.delete(value);
    }
    setNestedItemsVersion((version) => version + 1);
  }, []);
  const nestedItemContext = useMemo<SelectSubItemContextValue>(
    () => ({ open: subOpen, parentValue: triggerValue, registerItem }),
    [registerItem, subOpen, triggerValue],
  );
  const [openingNestedValues, setOpeningNestedValues] = useState<unknown[]>(select.values);
  const [wasSubOpen, setWasSubOpen] = useState(subOpen);
  if (wasSubOpen !== subOpen) {
    setWasSubOpen(subOpen);
    if (subOpen) setOpeningNestedValues(select.values);
  }

  useEffect(() => {
    for (const option of nestedSearchOptions) {
      registerOptionText(option.value, option.text, triggerValue);
    }

    return () => {
      for (const option of nestedSearchOptions) {
        unregisterOptionText(option.value);
      }
    };
  }, [nestedSearchOptions, registerOptionText, triggerValue, unregisterOptionText]);

  useEffect(() => {
    if (!subOpen) return;

    // Base UI focuses the popup itself because nested select options are intentionally
    // non-tabbable until the composite gives one the active index. Choose the same row a
    // regular panel would open on, then Base UI owns all subsequent arrow-key navigation.
    const frame = requestAnimationFrame(() => {
      focusNestedOption(nestedItemsRef.current, openingNestedValues, select.multiple);
    });
    return () => cancelAnimationFrame(frame);
  }, [nestedItemsVersion, openingNestedValues, select.multiple, subOpen]);

  const handleNestedOpenChange: NonNullable<
    ComponentProps<typeof BaseSelect.Root>["onOpenChange"]
  > = (nextOpen, details) => {
    // The nested root owns the actual panel and its dismiss behaviour. An outside press closes
    // only this panel; a child item press also closes the parent in single-select mode.
    if (!nextOpen) {
      setSubOpen(false, details);
      if (!select.multiple && details.reason === "item-press") {
        select.setOpen(false, details);
      }
    }
  };

  const handleKeyDown = (event: SelectSubContentKeyDownEvent) => {
    onKeyDownProp?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setSubOpen(false);
      requestAnimationFrame(focusTrigger);
    }
  };

  const handlePointerEnter: NonNullable<SelectSubContentProps["onPointerEnter"]> = (event) => {
    props.onPointerEnter?.(event);
    if (!event.defaultPrevented) cancelClose();
  };

  const handlePointerLeave: NonNullable<SelectSubContentProps["onPointerLeave"]> = (event) => {
    props.onPointerLeave?.(event);
    if (!event.defaultPrevented) scheduleClose();
  };

  const setNestedPanelNode = useCallback(
    (node: HTMLElement | null) => registerNestedPanel(node),
    [registerNestedPanel],
  );

  const options = (
    <SelectSubItemContext.Provider value={nestedItemContext}>
      <BaseSelect.List
        data-select-sub-options
        aria-multiselectable={select.multiple || undefined}
        className="flex min-w-0 flex-col"
      >
        {children}
      </BaseSelect.List>
    </SelectSubItemContext.Provider>
  );

  return (
    <BaseSelect.Root
      open={subOpen}
      value={nestedValue as never}
      multiple={select.multiple}
      highlightItemOnHover={false}
      modal={false}
      readOnly={select.readOnly}
      onOpenChange={handleNestedOpenChange}
      onValueChange={(nextValue, details) => select.setValue(nextValue, details)}
    >
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          data-slot="select-sub-positioner"
          ref={setNestedPanelNode}
          anchor={anchor}
          positionMethod="fixed"
          side={side}
          align={align}
          alignItemWithTrigger={false}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            {...props}
            ref={setPanelNode}
            data-slot="select-sub-content"
            role={roleProp ?? "presentation"}
            onKeyDown={handleKeyDown}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "flex max-h-[min(var(--available-height),18rem)] w-max min-w-50 flex-col overflow-hidden rounded-md border border-border bg-surface text-foreground shadow-overlay-drop outline-none",
              "origin-[var(--transform-origin)] blur-0 transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
              "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
              className,
            )}
          >
            <ScrollArea fade className="min-h-0" viewportClassName="p-1" viewportProps={{ tabIndex: -1 }}>
              {keepMounted || subOpen ? options : null}
            </ScrollArea>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
