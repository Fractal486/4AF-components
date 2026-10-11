import { cn } from "@/registry/lib/cn";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { SELECT_CLEAR_ACTION, SelectContext, SelectSubItemContext } from "./select.context";
import { SIZE, SelectItemIcon } from "./select.shared";
import { isEquivalentNode, setForwardedRef } from "./select.utils";

export type SelectSeparatorProps = Omit<
  ComponentProps<typeof BaseSelect.Separator>,
  "className" | "orientation" | "ref"
> & {
  className?: string;
  orientation?: ComponentProps<typeof BaseSelect.Separator>["orientation"];
};

/**
 * An accessible, non-selectable divider between groups of options.
 *
 * This is Base UI's own Select separator, so it remains a list part rather than pretending
 * to be an option. It carries `role="separator"` and is skipped by option highlighting and
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
        className={cn(
          // A border rather than a one-pixel filled box, which is how every other rule in
          // the panel is drawn — the search field's included. The two are the same pixel
          // on paper, but a background box lands wherever the box lands: at a fractional
          // offset it paints across two device rows and reads heavier than the border it
          // sits opposite. A border snaps.
          "shrink-0 border-border",
          orientation === "horizontal"
            ? "-mx-1 my-1 h-0 w-auto border-t"
            : "mx-1 h-full w-0 border-l",
          className,
        )}
        {...props}
      />
    );
  },
);

export type SelectItemProps = Omit<
  ComponentProps<typeof BaseSelect.Item>,
  "className" | "disabled"
> & {
  /** An optional leading icon. It is inert and hidden from assistive technology. */
  icon?: ReactNode;
  className?: string;
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

export const SelectItem = forwardRef<HTMLElement, SelectItemProps>(function SelectItem(
  {
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
    activeItem,
    panelSearch,
    setActiveItem,
    matchesQuery,
    registerOptionText,
    unregisterOptionText,
    hasMatchingDescendant,
  } = useContext(SelectContext);
  const nestedPanelContext = useContext(SelectSubItemContext);
  const nestedPanel = nestedPanelContext !== null;
  const nestedPanelOpen = nestedPanelContext?.open ?? false;
  const parentValue = nestedPanelContext?.parentValue;
  const optionText = searchValue ?? (typeof children === "string" ? children : String(value));
  const hiddenBySearch = !matchesQuery(optionText) && !hasMatchingDescendant(value);
  const itemDisabled = disabled || hiddenBySearch || (nestedPanel && !nestedPanelOpen);
  const clearActionActive = Object.is(activeItem, SELECT_CLEAR_ACTION);
  const pointerStartedRef = useRef(false);
  const bridgingPointerDownRef = useRef(false);
  const itemRef = useCallback(
    (node: HTMLElement | null) => {
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
    registerOptionText(value, optionText, parentValue, disabled);
    return () => unregisterOptionText(value);
  }, [disabled, optionText, parentValue, registerOptionText, unregisterOptionText, value]);
  const panelActive = open && Object.is(activeItem, value);

  // The same shape as the label registration below, and for the same reason: an `<Icon />`
  // written inline is a new object on every render.
  const registeredIcon = useRef<{ value: unknown; icon: ReactNode } | null>(null);
  useEffect(() => {
    const previous = registeredIcon.current;
    if (previous && Object.is(previous.value, value) && isEquivalentNode(previous.icon, icon)) {
      return;
    }
    registeredIcon.current = { value, icon };
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

  // Register the label so a chip trigger can render the selected value(s) by name.
  //
  // The node cannot be a dependency that *writes*: JSX rebuilds it every render, so an
  // effect keyed on its identity re-ran forever — its cleanup deleted the entry, the
  // registration put it back, and the provider re-rendered into another fresh node. The
  // effect still runs each render, but it only writes when the label says something
  // different, and the removal is its own effect so it fires on unmount or a new value
  // rather than on every pass.
  const registeredLabel = useRef<{ value: unknown; label: ReactNode } | null>(null);
  useEffect(() => {
    const previous = registeredLabel.current;
    if (previous && Object.is(previous.value, value) && isEquivalentNode(previous.label, children)) {
      return;
    }
    registeredLabel.current = { value, label: children };
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
        onClick={handleClick}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        className={cn(
          "flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 outline-none select-none",
          SIZE[size].row,
          "text-muted-foreground",
          nestedPanel
            ? "hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
            : !panelSearch &&
              !clearActionActive &&
              "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
          "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
          "data-[selected]:text-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className,
        )}
        {...props}
      >
        {end || !indicator ? (
          <>
            <SelectItemIcon icon={icon} size={size} />
            <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
            {end}
          </>
        ) : (
          <>
            <BaseSelect.ItemIndicator
              keepMounted
              className="shrink-0"
              render={(indicatorProps, state) => (
                <span {...indicatorProps}>
                  <Checkbox
                    checked={state.selected}
                    aria-hidden
                    tabIndex={-1}
                    className="pointer-events-none shrink-0"
                  />
                </span>
              )}
            />
            <SelectItemIcon icon={icon} size={size} />
            <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
          </>
        )}
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
      onClick={handleClick}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented && !nestedPanel) setActiveItem(value);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      className={cn(
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
            "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectItemIcon icon={icon} size={size} />
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A fixed check slot keeps ordinary selects stable; `end` replaces it for custom
          trailing content such as an action's keybind hint. */}
      {end ??
        (indicator ? (
          <span className="flex size-3.5 shrink-0 items-center justify-center">
            <BaseSelect.ItemIndicator className="text-foreground">
              <Check className="size-3.5" />
            </BaseSelect.ItemIndicator>
          </span>
        ) : null)}
    </BaseSelect.Item>
  );
});
