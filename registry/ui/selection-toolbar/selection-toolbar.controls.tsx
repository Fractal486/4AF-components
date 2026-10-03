import { cn } from "@/registry/lib/cn";
import { ActionButton, type ActionButtonProps } from "@/registry/ui/action-button/action-button";
import { ActionToggle, type ActionToggleProps } from "@/registry/ui/action-toggle/action-toggle";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import { Toggle, type ToggleProps } from "@/registry/ui/toggle/toggle";
import { ToggleGroup as BaseToggleGroup, type ToggleGroupProps } from "@base-ui/react/toggle-group";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { ComponentProps } from "react";
import { useSelectionToolbar } from "./selection-toolbar.context";
import { selectionToolbarButtonVariants } from "./selection-toolbar.variants";

export interface SelectionToolbarButtonProps extends ButtonProps {
  /**
   * Runs with the selection as it was when the bar opened, then dismisses the bar. Use
   * this rather than `onClick` and `window.getSelection()`: by the time a click handler
   * runs, the live selection may already belong to something else.
   */
  onAction?: (text: string, range: Range | null) => void;
  /** Leave the bar up after the press — for an action that toggles rather than completes. */
  keepOpen?: boolean;
}

/**
 * One action. It's the library's ghost Button at `sm`, pulled in a notch by the toolbar's
 * own sizing and rendered as a Base UI toolbar item so it joins the roving tabindex.
 *
 * `variant="destructive"` is quieted to red ink on the neutral hover rather than the solid
 * red fill — see the `tone` note in the variants file.
 */
export function SelectionToolbarButton({
  onAction,
  keepOpen = false,
  onClick,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: SelectionToolbarButtonProps) {
  const { text, range, close } = useSelectionToolbar();

  return (
    <BaseToolbar.Button
      render={
        <Button
          data-slot="selection-toolbar-button"
          {...quiet(variant)}
          size={size}
          // Button appends its own `className` last, so the compact sizing lands after the
          // size variant it's trimming and a caller's class still lands after both.
          className={cn(selectionToolbarButtonVariants(quiet(variant)), className)}
          {...props}
        />
      }
      onClick={(event) => {
        onClick?.(event);
        // An action that calls `preventDefault` is saying it handled the press itself,
        // including whether the bar should stay.
        if (event.defaultPrevented) return;

        onAction?.(text, range);
        if (!keepOpen) close();
      }}
    />
  );
}

/**
 * Turns `destructive` into a ghost button carrying red ink, and leaves every other variant
 * alone. One function because four item kinds need the same answer, and a bar where the
 * destructive button is loud in one row and quiet in the next is worse than either.
 */
function quiet(variant: ButtonProps["variant"]): {
  variant: ButtonProps["variant"];
  tone: "default" | "destructive";
} {
  return variant === "destructive"
    ? { variant: "ghost", tone: "destructive" }
    : { variant, tone: "default" };
}

export interface SelectionToolbarActionButtonProps
  extends Omit<ActionButtonProps, "action"> {
  /** The work, handed the selection as it was when the bar opened. */
  action: (text: string, range: Range | null) => void | Promise<unknown>;
  /** Dismiss the bar once the action has succeeded, rather than leaving it up. */
  closeOnSuccess?: boolean;
}

/**
 * An action that takes a moment and says how it went, in place: the loader, then a check or
 * a warning, then back to the label. It's the library's ActionButton, so it's the same
 * `useAction` machine as the menu's action row and a Copy button on a page — the same
 * double-submit guard, the same revert clock, the same refusal to render a failure as a
 * success.
 *
 * Unlike a plain action it does **not** dismiss the bar, and it can't: the bar is where the
 * outcome is drawn, and an outcome shown on a surface that has already gone is no outcome
 * at all. Same reason the menu's action row defaults to `closeOnClick={false}`. Pass
 * `closeOnSuccess` for the case where the result is visible on the page behind the bar and
 * the confirmation would be a second one.
 */
export function SelectionToolbarActionButton({
  action,
  closeOnSuccess = false,
  className,
  variant = "ghost",
  size = "sm",
  onSuccess,
  ...props
}: SelectionToolbarActionButtonProps) {
  const { text, range, close } = useSelectionToolbar();

  return (
    <BaseToolbar.Button
      render={
        <ActionButton
          data-slot="selection-toolbar-button"
          action={() => action(text, range)}
          {...quiet(variant)}
          size={size}
          className={cn(selectionToolbarButtonVariants(quiet(variant)), className)}
          onSuccess={() => {
            onSuccess?.();
            if (closeOnSuccess) close();
          }}
          {...props}
        />
      }
    />
  );
}

export interface SelectionToolbarToggleProps extends ToggleProps {
  /** Runs after the flip, with the state moved to and the selection the bar opened on. */
  onAction?: (pressed: boolean, text: string, range: Range | null) => void;
}

/**
 * An action that holds a state — bold, italic, highlighted. The library's Toggle, so it
 * carries `aria-pressed` rather than merely looking depressed, and `fillIcon` is here for
 * the glyphs whose only difference is their weight.
 *
 * It never dismisses the bar. A toggle *is* something rather than doing something: you
 * press it to see the state change, and you'll often press its neighbour straight after.
 */
export function SelectionToolbarToggle({
  onAction,
  onPressedChange,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: SelectionToolbarToggleProps) {
  const { text, range } = useSelectionToolbar();

  return (
    <BaseToolbar.Button
      render={
        <Toggle
          data-slot="selection-toolbar-button"
          {...quiet(variant)}
          size={size}
          className={cn(selectionToolbarButtonVariants(quiet(variant)), className)}
          onPressedChange={(pressed, details) => {
            onPressedChange?.(pressed, details);
            onAction?.(pressed, text, range);
          }}
          {...props}
        />
      }
    />
  );
}

export interface SelectionToolbarActionToggleProps
  extends Omit<ActionToggleProps, "action"> {
  /** The work that has to succeed before the state is real, handed the state being moved
      to and the selection the bar opened on. */
  action: (pressed: boolean, text: string, range: Range | null) => void | Promise<unknown>;
}

/**
 * A toggle whose state has to be earned — a highlight that isn't real until the server has
 * it. The library's ActionToggle: the label holds, the loader runs in the glyph's place,
 * and the state moves only once the work has settled. A failure needs no rollback, because
 * nothing moved.
 */
export function SelectionToolbarActionToggle({
  action,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: SelectionToolbarActionToggleProps) {
  const { text, range } = useSelectionToolbar();

  return (
    <BaseToolbar.Button
      render={
        <ActionToggle
          data-slot="selection-toolbar-button"
          action={(pressed) => action(pressed, text, range)}
          {...quiet(variant)}
          size={size}
          className={cn(selectionToolbarButtonVariants(quiet(variant)), className)}
          {...props}
        />
      }
    />
  );
}

/**
 * An exclusive run of toggles — one highlight colour, one alignment, one heading level.
 * The toolbar's answer to a menu's radio group, and like that one it's the primitive's own
 * part: Base UI's ToggleGroup holds the value and unpresses the others, rendered as the
 * toolbar's group so the arrow keys still travel across the whole bar rather than being
 * trapped inside it.
 *
 * `multiple` turns it into a set rather than a choice, which is the bold/italic/underline
 * case: still one group for the keyboard, but each toggle independent.
 */
export function SelectionToolbarToggleGroup<Value extends string = string>({
  className,
  ...props
}: ToggleGroupProps<Value>) {
  return (
    <BaseToolbar.Group
      data-slot="selection-toolbar-group"
      render={<BaseToggleGroup<Value> {...props} />}
      className={cn("flex items-center gap-0.5", className)}
    />
  );
}

/**
 * A hairline between groups of actions — formatting on one side, "do something with this
 * text" on the other. Base UI's own toolbar separator, so it carries `role="separator"` and
 * the orientation perpendicular to the bar's rather than being a styled `<div>`.
 *
 * `h-4` against 24px actions, not their full height: a divider that matches the things it
 * divides competes with them. `bg-border`, a real filled hairline, because the job here is
 * separation and not elevation — `shadow-border` is for what needs to read as lifted.
 */
export function SelectionToolbarSeparator({
  className,
  ...props
}: ComponentProps<typeof BaseToolbar.Separator>) {
  return (
    <BaseToolbar.Separator
      data-slot="selection-toolbar-separator"
      className={cn("mx-0.5 h-4 w-px shrink-0 bg-border", className)}
      {...props}
    />
  );
}
