"use client";

import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { CheckMark } from "@/registry/lib/check-mark";
import { Select as BaseSelect } from "@base-ui/react/select";
import {
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { SELECT_CLEAR_ACTION, SelectActiveItemContext, SelectContext, SelectSearchContext, SelectPanelDormantContext, SelectSubItemContext } from "./select.context";
import { SIZE, SelectItemIcon } from "./select.shared";
import { setForwardedRef } from "./select.utils";

/** The trailing slot a row's check sits in, reserved whether or not the row is selected. */
const CHECK_SLOT = "flex size-3.5 shrink-0 items-center justify-center text-foreground";

/** Accessible section; filtering hides its heading when no visible options remain. */
export function SelectGroup({ className, ...props }: ComponentProps<typeof BaseSelect.Group>) {
  return <BaseSelect.Group data-slot="select-group"
    className={mergeStateClassName("flex flex-col [&:not(:has([role=option]:not([hidden])))]:hidden", className)} {...props} />;
}

export function SelectGroupLabel({ className, ...props }: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return <BaseSelect.GroupLabel data-slot="select-group-label"
    className={mergeStateClassName("px-2.5 pt-2 pb-1 text-[10px] font-medium text-subtle-foreground/70", className)} {...props} />;
}

export type SelectSeparatorProps = Omit<
  ComponentProps<typeof BaseSelect.Separator>,
  "orientation" | "ref"
> & {
  orientation?: ComponentProps<typeof BaseSelect.Separator>["orientation"];
};

/**
 * A visual, non-selectable divider between groups of options.
 *
 * This is Base UI's own Select separator, so it remains a list part rather than pretending
 * to be an option. It carries `role="presentation"` and is skipped by option highlighting and
 * keyboard selection. The default line reaches the panel edges inside the list's padding;
 * pass `className` to adjust the inset when a different grouping treatment is wanted.
 */
export const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(
  function SelectSeparator({ className, orientation = "horizontal", ...props }, forwardedRef) {
    return (
      <BaseSelect.Separator
        ref={forwardedRef}
        data-slot="select-separator"
        orientation={orientation}
        className={mergeStateClassName(cn(
          // A border rather than a one-pixel filled box, which is how every other rule in
          // the panel is drawn — the search field's included. The two are the same pixel
          // on paper, but a background box lands wherever the box lands: at a fractional
          // offset it paints across two device rows and reads heavier than the border it
          // sits opposite. A border snaps.
          "shrink-0 border-border",
          orientation === "horizontal"
            ? "-mx-1 my-1 h-0 w-auto border-t"
            : "mx-1 h-full w-0 border-l"), className)}
        {...props}
      />
    );
  },
);

export type SelectItemProps = Omit<
  ComponentProps<typeof BaseSelect.Item>,
  "disabled"
> & {
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  /** Optional trailing content in place of the selection indicator. */
  end?: ReactNode;
  /**
   * Show a checkbox in a multiple panel or a trailing tick in a single panel.
   * Set false to hide the glyph; this does not prevent selection.
   */
  indicator?: boolean;
  /** Optional element id. */
  id?: string;
  /** Text used by an ancestor searchable `SelectContent` to match this option. */
  searchValue?: string;
};

export const SelectItem = forwardRef<HTMLElement, SelectItemProps>(function SelectItem(props, ref) {
  const activeItem = useContext(SelectActiveItemContext);
  const { matchesQuery, hasMatchingDescendant } = useContext(SelectSearchContext);
  const optionText = props.searchValue ?? (typeof props.children === "string" ? props.children : String(props.value));
  return <SelectItemRow {...props} ref={ref}
    active={Object.is(activeItem, props.value)}
    clearActionActive={Object.is(activeItem, SELECT_CLEAR_ACTION)}
    hiddenBySearch={!matchesQuery(optionText) && !hasMatchingDescendant(props.value)} />;
});

// Context readers still evaluate filtering for each option. The Base UI row, its icons,
// and registration effects only render when that option's result or own props change.
const SelectItemRow = memo(forwardRef<HTMLElement, SelectItemProps & {
  active: boolean;
  clearActionActive: boolean;
  hiddenBySearch: boolean;
}>(function SelectItemRow(
  {
    active,
    clearActionActive,
    hiddenBySearch,
    className,
    icon,
    children,
    value,
    disabled = false,
    indicator = true,
    end,
    searchValue,
    onClick: onClickProp,
    onFocusCapture,
    onMouseDown: onMouseDownProp,
    onMouseUp: onMouseUpProp,
    onPointerCancel: onPointerCancelProp,
    onPointerDown: onPointerDownProp,
    render: renderProp,
    ...props
  },
  forwardedRef,
) {
  const {
    multiple,
    size,
    registerIcon,
    unregisterIcon,
    registerLabel,
    unregisterLabel,
    open,
    panelSearch,
    setActiveItem,
    registerOptionText,
    unregisterOptionText,
  } = useContext(SelectContext);
  const nestedPanelContext = useContext(SelectSubItemContext);
  const nestedPanel = nestedPanelContext !== null;
  const nestedPanelOpen = nestedPanelContext?.open ?? false;
  const parentValue = nestedPanelContext?.parentValue;
  const optionText = searchValue ?? (typeof children === "string" ? children : String(value));
  const itemDisabled = disabled || hiddenBySearch || (nestedPanel && !nestedPanelOpen);
  const pointerStartedRef = useRef(false);
  const bridgingPointerDownRef = useRef(false);
  const itemNode = useRef<HTMLElement | null>(null);
  const itemRef = useCallback(
    (node: HTMLElement | null) => {
      itemNode.current = node;
      setForwardedRef(forwardedRef, node);
      nestedPanelContext?.registerItem(value, node);
    },
    [forwardedRef, nestedPanelContext, value],
  );

  // Before paint, not after. `SelectContent` derives `noResults` from this registry, so a row
  // whose searchable text tracks the query — "Create …" over a filtered list — would
  // otherwise spend one painted frame registered under the previous keystroke, and the
  // panel would read that as "nothing matches" and swap the list for the empty message.
  // Once per character typed. The option set is what the panel lays itself out from, so
  // settling it belongs in the pass before the browser draws.
  useLayoutEffect(() => {
    registerOptionText(value, optionText, parentValue, disabled, itemNode.current);
    return () => unregisterOptionText(value);
  }, [disabled, optionText, parentValue, registerOptionText, unregisterOptionText, value]);
  const panelActive = open && active;
  // Kept for the arrow keys once the pointer has left, but no longer painted; with a footer
  // button active, no row paints. Nested panels paint by CSS hover and have nothing to keep.
  const rest = useContext(SelectPanelDormantContext);
  const panelDormant = ((rest === "pointer" && panelActive) || rest === "footer") && !nestedPanel;

  // Always register on effect setup, including StrictMode and Activity replays. The
  // parent's Map setter skips equivalent nodes, so inline JSX can safely re-register.
  // Keep removal separate: deleting before each write would defeat that deduplication.
  useEffect(() => {
    registerIcon(value, icon);
  }, [icon, registerIcon, value]);
  useEffect(() => () => { unregisterIcon(value); }, [unregisterIcon, value]);

  const bridgeMissingPointerDown = useCallback((target: HTMLElement) => {
    if (bridgingPointerDownRef.current || !target.isConnected) return;

    const view = target.ownerDocument.defaultView;
    if (!view) return;

    bridgingPointerDownRef.current = true;
    try {
      const event =
        typeof view.PointerEvent === "function"
          ? new view.PointerEvent("pointerdown", {
              bubbles: true,
              button: 0,
              isPrimary: true,
              pointerType: "mouse",
            })
          : new view.MouseEvent("pointerdown", { bubbles: true, button: 0 });
      target.dispatchEvent(event);
    } finally {
      bridgingPointerDownRef.current = false;
    }
  }, []);

  const handlePointerDown: NonNullable<SelectItemProps["onPointerDown"]> = (event) => {
    if (!bridgingPointerDownRef.current) onPointerDownProp?.(event);
    pointerStartedRef.current = true;
  };

  const handleMouseDown: NonNullable<SelectItemProps["onMouseDown"]> = (event) => {
    onMouseDownProp?.(event);
    if (
      !event.defaultPrevented &&
      nestedPanel &&
      !itemDisabled &&
      !pointerStartedRef.current &&
      event.button === 0
    ) {
      // Some haptic touchpads synthesize the mouse activation without a pointerdown. Base UI
      // uses pointerdown to arm its guarded click, so mirror that missing step for nested items.
      bridgeMissingPointerDown(event.currentTarget);
    }
  };

  const handleMouseUp: NonNullable<SelectItemProps["onMouseUp"]> = (event) => {
    onMouseUpProp?.(event);
    if (
      !event.defaultPrevented &&
      nestedPanel &&
      !itemDisabled &&
      !pointerStartedRef.current &&
      event.button === 0
    ) {
      // Keep the fallback working for devices that omit both pointerdown and mousedown.
      bridgeMissingPointerDown(event.currentTarget);
    }
    pointerStartedRef.current = false;
  };

  const handlePointerCancel: NonNullable<SelectItemProps["onPointerCancel"]> = (event) => {
    onPointerCancelProp?.(event);
    pointerStartedRef.current = false;
  };

  const handleClick: NonNullable<SelectItemProps["onClick"]> = (event) => {
    onClickProp?.(event);
    pointerStartedRef.current = false;
  };

  // As with icons, register on every setup and remove only when the value or lifecycle
  // changes. A retained ref must not skip registration after an effect cleanup.
  useEffect(() => {
    registerLabel(value, children);
  }, [children, registerLabel, value]);
  useEffect(() => () => { unregisterLabel(value); }, [unregisterLabel, value]);

  if (multiple) {
    return (
      <BaseSelect.Item
        ref={itemRef}
        value={value}
        disabled={itemDisabled}
        hidden={hiddenBySearch}
        render={renderProp}
        data-panel-active={panelActive || undefined}
        data-panel-dormant={panelDormant || undefined}
        onClick={handleClick}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        className={mergeStateClassName(cn(
          "flex items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
          SIZE[size].row,
          "text-muted-foreground",
          nestedPanel
            ? "hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
            : !panelSearch &&
              !clearActionActive &&
              "data-[highlighted]:not-data-[panel-dormant]:bg-muted data-[highlighted]:not-data-[panel-dormant]:text-foreground",
          "data-[panel-active]:not-data-[panel-dormant]:bg-muted data-[panel-active]:not-data-[panel-dormant]:text-foreground",
          "data-[selected]:text-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"), className)}
        {...props}
      >
        <SelectItemIcon icon={icon} size={size} />
        <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
        {/* Kept mounted so the slot is reserved and the tick draws in and rubs out as rows
            toggle while the panel stays open. `end` replaces it, as on single rows. */}
        {end ??
          (indicator ? (
            <BaseSelect.ItemIndicator
              keepMounted
              render={(indicatorProps, state) => (
                <span
                  {...indicatorProps}
                  data-slot="select-item-check"
                  data-selected={state.selected ? "" : undefined}
                  className={CHECK_SLOT}
                >
                  <CheckMark checked={state.selected} />
                </span>
              )}
            />
          ) : null)}
      </BaseSelect.Item>
    );
  }

  return (
    <BaseSelect.Item
      ref={itemRef}
      value={value}
      disabled={itemDisabled}
      hidden={hiddenBySearch}
      render={renderProp}
      data-panel-active={panelActive || undefined}
      data-panel-dormant={panelDormant || undefined}
      onClick={handleClick}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      className={mergeStateClassName(cn(
        "flex items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        // The main panel follows Base UI's keyboard highlight. Nested panels disable Base
        // UI's pointer-driven active row so their initial focus doesn't paint; CSS hover and
        // focus-visible keep actual pointer and keyboard movement visible.
        nestedPanel
          ? "hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
          : !panelSearch &&
            !clearActionActive &&
            "data-[highlighted]:not-data-[panel-dormant]:bg-muted data-[highlighted]:not-data-[panel-dormant]:text-foreground",
        "data-[panel-active]:not-data-[panel-dormant]:bg-muted data-[panel-active]:not-data-[panel-dormant]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"), className)}
      {...props}
    >
      <SelectItemIcon icon={icon} size={size} />
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A fixed check slot keeps ordinary selects stable; `end` replaces it for custom
          trailing content such as an action's keybind hint. */}
      {end ??
        (indicator ? (
          // Picking closes the panel, so a single row's tick is only ever seen drawn: the
          // indicator mounts with its row's selection, as before.
          <span className={CHECK_SLOT}>
            <BaseSelect.ItemIndicator className="flex">
              <CheckMark checked />
            </BaseSelect.ItemIndicator>
          </span>
        ) : null)}
    </BaseSelect.Item>
  );
}));
