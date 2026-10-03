"use client";

import { cn } from "@/registry/lib/cn";
import { useMergedRefs } from "@/registry/lib/refs";
import { Slot } from "@/registry/lib/slot";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  SelectionToolbarContext,
  type SelectionToolbarContextValue,
} from "./selection-toolbar.context";
import { selectionToolbarVariants } from "./selection-toolbar.variants";

// Keep the installable component's public API at this entry point.
export {
  useSelectionToolbar,
  type SelectionToolbarContextValue,
} from "./selection-toolbar.context";
export {
  SelectionToolbarActionButton,
  SelectionToolbarActionToggle,
  SelectionToolbarButton,
  SelectionToolbarSeparator,
  SelectionToolbarToggle,
  SelectionToolbarToggleGroup,
  type SelectionToolbarActionButtonProps,
  type SelectionToolbarActionToggleProps,
  type SelectionToolbarButtonProps,
  type SelectionToolbarToggleProps,
} from "./selection-toolbar.controls";

/**
 * A toolbar that appears over selected text, offering actions on it.
 *
 * Two Base UI primitives, each doing the half it owns. **Popover** is the floating
 * surface: portal, collision-aware positioning, dismiss on Escape, and holding the popup
 * mounted through its exit transition. **Toolbar** is the row of actions: `role="toolbar"`,
 * and a roving tabindex so the whole bar is one tab stop and the arrow keys move between
 * the actions inside it. They're composed with `render` rather than nested, so there is
 * one element and one role, not a dialog wrapping a toolbar.
 *
 * What isn't in either primitive is the anchor, because there's no trigger element to
 * anchor to — the anchor is a *range of text*. Popover takes a virtual anchor, so the bar
 * is positioned against `Range.getBoundingClientRect()` and follows the selection while
 * the page scrolls. A multi-line selection measures as one box covering all its lines, so
 * the bar centres over the block rather than over the last line.
 *
 * Three details do all the work of making it behave, and each is easy to leave out:
 *
 * - **The bar swallows `mousedown`.** Pressing anywhere outside a selection collapses it,
 *   so without this the selection would be gone by the time the action ran — and the
 *   action is *about* the selection. Cancelling the default also stops the button taking
 *   focus, which is what keeps the browser's selection highlight live rather than greyed.
 * - **The captured text is handed to the action.** Even with the above, an action should
 *   never have to go back to `window.getSelection()` and hope. `onAction` receives the
 *   text and the range as they were when the bar opened.
 * - **Base UI's outside-press dismissal is declined**, because the trailing `mouseup` and
 *   `click` of the very drag that opened the bar count as one. See `onOpenChange` below;
 *   without it the bar closes in the frame after it opens and appears never to work.
 *
 * Opening waits for the gesture to finish — pointer up, or Shift released — or the bar
 * would appear on the first character of a drag and then chase the cursor. Closing is
 * immediate: the moment the selection is gone the bar has nothing to act on.
 */

/**
 * Keys that can change a selection, so releasing one is worth re-reading it for.
 *
 * The list exists so Escape *isn't* on it. Escape dismisses the bar while leaving the
 * selection intact, and a keyup handler that re-read the selection on every key would
 * reopen the bar on the way back up from the very press that dismissed it.
 */
const SELECTION_KEYS = new Set([
  "Shift",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "a",
  "A",
]);

export interface SelectionToolbarProps {
  /** The region whose selections are watched. Selections elsewhere on the page are ignored. */
  children: ReactNode;
  /** The bar's contents: `SelectionToolbarButton`s, separators, anything. */
  actions: ReactNode;
  /** Render the region onto the child element instead of a wrapping `<div>`. */
  asChild?: boolean;
  /** Stop watching, and close the bar if it's open. */
  disabled?: boolean;
  /** Announced when focus enters the bar. */
  label?: string;
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  /** Gap between the selection and the bar, in px. */
  sideOffset?: number;
  /** Class for the region. */
  className?: string;
  /** Class for the floating bar. */
  toolbarClassName?: string;
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;
}

export function SelectionToolbar({
  children,
  actions,
  asChild = false,
  disabled = false,
  label = "Selection actions",
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
  toolbarClassName,
  onOpenChange,
  ref,
}: SelectionToolbarProps) {
  // The region is state rather than a ref because the anchor below needs it as a
  // `contextElement` — that's how Floating UI finds the scroll containers to watch, and a
  // virtual anchor has none of its own to offer.
  const [region, setRegion] = useState<HTMLDivElement | null>(null);
  const regionRef = useMergedRefs<HTMLDivElement>(ref, setRegion);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const [selection, setSelection] = useState<{ text: string; range: Range } | null>(null);
  // The same range the state above holds, kept in a ref as well because the two answer
  // different questions: the state is *the* selection and goes null the moment the bar
  // closes, while the ref is the *last* one and has to outlive that — the bar is still
  // being positioned against it while it animates out.
  const rangeRef = useRef<Range | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  // Set when the bar is dismissed on a selection that still exists — Escape, or an action
  // that ran. Without it the next stray pointer release would read the same selection and
  // pop the bar straight back up.
  const dismissedRef = useRef(false);
  // Which input made the selection. Only used to decide whether Tab should reach into the
  // bar; see the keydown handler.
  const sourceRef = useRef<"pointer" | "keyboard">("pointer");

  const open = selection !== null && !disabled;

  /** The current selection, if it's a real one inside the region. */
  const read = useCallback(() => {
    if (!region || disabled) return null;

    const current = document.getSelection();
    if (!current || current.isCollapsed || current.rangeCount === 0) return null;

    // `contains` counts a node as containing itself, which is what makes a selection of
    // the whole region — where the common ancestor *is* the region — count as inside it.
    const range = current.getRangeAt(0);
    if (!region.contains(range.commonAncestorContainer)) return null;

    const text = current.toString();
    return text.trim() ? { range, text } : null;
  }, [region, disabled]);

  const close = useCallback(() => {
    dismissedRef.current = true;
    setSelection(null);
  }, []);

  const settle = useCallback(
    (source: "pointer" | "keyboard") => {
      if (dismissedRef.current) return;

      const found = read();
      if (!found) {
        setSelection(null);
        return;
      }

      // Cloned: the live range is invalidated as soon as the selection changes, and this
      // one has to outlive it — it's what the bar is positioned against while it animates
      // out, and what the action is handed.
      const range = found.range.cloneRange();
      rangeRef.current = range;
      sourceRef.current = source;
      setSelection({ text: found.text, range });
    },
    [read],
  );

  // Turning the component off closes the bar, and does it here rather than in an effect:
  // this is a render caused by a prop change, and React would only have to throw the
  // render away and redo it if the reset arrived one commit later. Turning it back on
  // clears too — the selection it was showing is minutes old by then.
  const [wasDisabled, setWasDisabled] = useState(disabled);
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled);
    setSelection(null);
  }

  useEffect(() => {
    if (disabled) return;

    const onSelectionChange = () => {
      // A changed selection is a new one, so whatever was dismissed no longer applies.
      dismissedRef.current = false;
      if (!read()) setSelection(null);
    };

    const inBar = (target: EventTarget | null) =>
      target instanceof Node && popupRef.current?.contains(target) === true;

    const onPointerUp = (event: PointerEvent) => {
      // A release inside the bar is a press on an action, not the end of a drag. It would
      // otherwise re-open the bar the instant an action closed it, since the selection is
      // deliberately still there.
      if (inBar(event.target)) return;
      settle("pointer");
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!SELECTION_KEYS.has(event.key)) return;
      // Still extending: Shift is down and the arrows are doing the work. Waiting for it
      // to come up is what stops the bar hopping along with every character.
      if (event.shiftKey && event.key !== "Shift") return;
      settle("keyboard");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Tab reaches into the bar, but only for a selection that was made with the
      // keyboard. The bar is portalled, so it has no natural place in the tab order; and
      // for someone who selected with the mouse, Tab means the next field, not the thing
      // that just appeared. Once focus is inside, Base UI's Toolbar takes over: arrows
      // move between actions, Tab leaves.
      if (event.key !== "Tab" || event.shiftKey) return;
      if (!popupRef.current || sourceRef.current !== "keyboard") return;
      if (inBar(document.activeElement)) return;

      // The roving tabindex is the thing to aim at, not a slot name: Base UI's Toolbar puts
      // `0` on whichever item focus should land on and `-1` on the rest, so this finds the
      // right entry point whatever the items are — buttons, toggles, a group.
      const first = popupRef.current.querySelector<HTMLElement>('[tabindex="0"]');
      if (!first) return;

      event.preventDefault();
      first.focus();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled, read, settle]);

  const anchor = useMemo(
    () => ({
      contextElement: region ?? undefined,
      getBoundingClientRect: () => {
        const range = rangeRef.current;
        // Checked for, not assumed: jsdom implements Range but has no layout, so it has
        // no `getBoundingClientRect` at all. Without this, every unit test that renders a
        // page containing this component fails on an unhandled rejection from inside the
        // positioner rather than on anything the test was about.
        const rect =
          typeof range?.getBoundingClientRect === "function"
            ? range.getBoundingClientRect()
            : undefined;
        // A range measures zero once the nodes it spanned have been replaced — which is
        // exactly what an action like "highlight" does to them. Falling back to the last
        // rect we saw keeps the bar animating out where it was standing instead of
        // snapping to the top-left corner of the viewport on its way.
        if (rect && (rect.width > 0 || rect.height > 0)) {
          rectRef.current = rect;
          return rect;
        }
        return rectRef.current ?? new DOMRect();
      },
    }),
    [region],
  );

  const contextValue = useMemo<SelectionToolbarContextValue>(
    () => ({ text: selection?.text ?? "", range: selection?.range ?? null, close }),
    [selection, close],
  );

  const Region = asChild ? Slot : "div";

  return (
    <SelectionToolbarContext.Provider value={contextValue}>
      <Region ref={regionRef} data-slot="selection-toolbar-region" className={className}>
        {children}
      </Region>
      <BasePopover.Root
        open={open}
        onOpenChange={(next, details) => {
          // Outside-press dismissal is declined, and it has to be: the bar opens on
          // `pointerup`, and the `mouseup`/`click` that follow the *same* release land on
          // the text — outside the popup that appeared a moment ago. Base UI reads that as
          // an outside press and closes the bar in the frame after it opened, which looks
          // exactly like it never opened at all.
          //
          // Nothing is lost by declining it. A press outside the bar collapses the
          // selection, and a bar with no selection is closed by the `selectionchange`
          // handler above — that rule is the component's whole dismissal story, and Base
          // UI's version is a second closer with no case of its own.
          if (details.reason === "outside-press") {
            details.cancel();
            return;
          }

          // What's left is Escape and focus leaving. Every other close goes through
          // `close()` directly.
          if (!next) close();
          onOpenChange?.(next);
        }}
      >
        <BasePopover.Portal>
          <BasePopover.Positioner
            anchor={anchor}
            side={side}
            align={align}
            sideOffset={sideOffset}
            className="z-50 outline-none"
          >
            <BasePopover.Popup
              ref={popupRef}
              // The popup *is* the toolbar. Base UI's Popup would otherwise be a
              // `role="dialog"` wrapper around it, which is a second thing for a screen
              // reader to enter on the way to two buttons.
              render={<BaseToolbar.Root />}
              role="toolbar"
              aria-label={label}
              aria-orientation="horizontal"
              // Nothing in here is worth taking focus for on a pointer press, and taking
              // it is what would grey out the selection the bar is about. Keyboard users
              // arrive via Tab (above); on the way out, focus is left where it fell rather
              // than sent to a trigger that doesn't exist.
              initialFocus={false}
              finalFocus={false}
              onMouseDown={(event: MouseEvent) => event.preventDefault()}
              className={cn(selectionToolbarVariants(), toolbarClassName)}
            >
              {actions}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </SelectionToolbarContext.Provider>
  );
}
