import { cn } from "@/registry/lib/cn";
import { useAction, type ActionStatus } from "@/registry/lib/use-action";
import { LoadingIndicator } from "@/registry/lib/loader";
import { CheckboxMark } from "@/registry/ui/checkbox/checkbox";
import { checkboxVariants } from "@/registry/ui/checkbox/checkbox.variants";
import { Morph } from "@/registry/ui/morph/morph";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, TriangleAlert } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { DropdownMenuItem, type DropdownMenuItemProps } from "./dropdown-menu.menu";
import { DisabledReasonTooltip, INDICATOR_SLOT, itemBase } from "./dropdown-menu.shared";

/**
 * The checkbox a checkbox row shows: Checkbox's own box and mark — the same border, fill,
 * dark-mode well, and the tick that draws itself in — drawn rather than nested, because a
 * real Checkbox is a button and a button inside a menu item splits focus and is invalid
 * markup. Sized down to the row's 14px glyph slot.
 *
 * The mark's size is marked important: `itemBase` sizes every svg in the row, and its
 * `.row svg` would otherwise outrank a class here.
 */
function MenuCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      data-slot="dropdown-menu-checkbox"
      data-checked={checked ? "" : undefined}
      data-unchecked={checked ? undefined : ""}
      className={cn(checkboxVariants(), "size-3.5 cursor-default")}
    >
      <CheckboxMark checked={checked} className="size-[70%]!" />
    </span>
  );
}

/**
 * The 14px box a row's leading glyph sits in, so a Morph between glyphs centres where a plain
 * row icon sits. Without the box the loader — one narrow character against 14px icons — would
 * sit wherever its own advance width put it. The muting is here rather than from `itemBase`,
 * whose rule reaches a direct-child Morph and this one is a level down.
 */
const GLYPH_SLOT = "flex size-3.5 shrink-0 items-center justify-center text-muted-foreground";

export interface DropdownMenuActionItemProps
  extends Omit<DropdownMenuItemProps, "onClick" | "children"> {
  /** The work. Return a promise and the row waits for it. */
  action: () => void | Promise<unknown>;
  /** The resting label. */
  children?: ReactNode;
  /** The resting glyph. */
  icon?: ReactNode;
  /** Labels per state. Each falls back to the resting label. */
  labels?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /** Glyphs per state. Default to the spinner, a check, and the warning triangle. */
  icons?: { pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  loader?: ReactNode;
  /** How long the outcome holds before the row returns to idle, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold back `pending` for this long, so a near-instant action doesn't flash a
      spinner on its way to the check. @default 0 */
  pendingDelay?: number;
  /** Announced to screen readers. A state change they can't see is one they don't know
      about — and in a menu the row may be the only thing that changed. */
  announce?: { pending?: string; success?: string; error?: string };
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * A row that runs something, shows how it went, and puts itself back — the menu's
 * ActionButton. "Copy link" becoming "Copied" with a check for a beat is the whole case.
 *
 * It defaults to `closeOnClick={false}`, which is the part that's easy to miss: a menu
 * row closes the menu on click, so an outcome shown on a row the user can no longer see
 * is no outcome at all. Pass `closeOnClick` explicitly to override that — worth doing for
 * an action whose result is visible on the page behind the menu.
 *
 * The state machine is `useAction`, shared with ActionButton, so a copy row and a copy
 * button behave identically: the same double-submit guard, the same revert clock, the
 * same refusal to render a failure as a success.
 */
export function DropdownMenuActionItem({
  action,
  children,
  icon,
  labels,
  icons,
  loader,
  revertAfter,
  pendingDelay,
  announce,
  closeOnClick = false,
  disabled,
  onSuccess,
  onError,
  ...props
}: DropdownMenuActionItemProps) {
  const { status, run } = useAction({
    action,
    revertAfter,
    pendingDelay,
    onSuccess,
    onError,
  });

  const label = (override: ReactNode | undefined) => override ?? children;
  const glyph = (override: ReactNode | undefined, fallback: ReactNode) => override ?? fallback;

  return (
    <>
      <DropdownMenuItem
        closeOnClick={closeOnClick}
        onClick={run}
        // Not disabled while pending: a disabled item is skipped by the menu's roving
        // highlight, which would move focus off the row that is running. `useAction`'s ref
        // guard already refuses a re-entrant press.
        disabled={disabled}
        aria-busy={status === "pending" || undefined}
        data-status={status}
        {...props}
      >
        <span className={GLYPH_SLOT}>
          {/* Every state at once, so the slot never resizes as it moves through them. */}
          <Morph
            activeKey={status}
            items={{
              idle: icon,
              pending: glyph(icons?.pending, <LoadingIndicator loader={loader} />),
              success: glyph(icons?.success, <Check />),
              error: glyph(icons?.error, <TriangleAlert />),
            }}
          />
        </span>
        <Morph
          activeKey={status}
          items={{
            idle: children,
            pending: label(labels?.pending),
            success: label(labels?.success),
            error: label(labels?.error),
          }}
        />
      </DropdownMenuItem>

      {/* Politely, so it waits for a pause rather than interrupting — and outside the row,
          because a menu item's accessible name is built from its contents and an sr-only
          status in there would rename it to "Copy link Working" while it ran. */}
      <span aria-live="polite" className="sr-only">
        {status === "pending" && (announce?.pending ?? "Working")}
        {status === "success" && (announce?.success ?? "Done")}
        {status === "error" && (announce?.error ?? "Something went wrong")}
      </span>
    </>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends Omit<ComponentProps<typeof BaseMenu.CheckboxItem>, "render" | "children"> {
  loader?: ReactNode;
  /**
   * `children` may be a function of the checked state — return a different icon and label
   * for each, so a `menuitemcheckbox` can read as a toggle button (Mute ⇄ Unmute)
   * rather than a ticked row.
   *
   * It's also handed the action status, which only moves off `"idle"` when there's an
   * `action`, for a row that draws its own wait.
   */
  children?: ReactNode | ((checked: boolean, status: ActionStatus) => ReactNode);
  /**
   * The leading glyph, or one per checked state (Bell ⇄ BellOff), morphing between them.
   * With `indicator={false}` the glyph slot is also the status slot: a deferred row's
   * loader, and its failure triangle, take the icon's place until the work settles.
   */
  icon?: ReactNode | ((checked: boolean) => ReactNode);
  /**
   * The built-in left tick and its `pl-8` indent. Turn it off when the toggle state is
   * carried by the label/icon instead (the bookmark case).
   */
  indicator?: boolean;
  /**
   * Fill the item's icon when checked instead of morphing it — the same glyph, only its
   * weight changing (bookmark, star, heart). It's a `fill` transition on the one element
   * (no swap), which is the honest choice when there's nothing to morph *to*. This is the
   * Toggle's `fillIcon`. Pair with `indicator={false}` so the fill *is* the state.
   */
  fillIcon?: boolean;
  /**
   * Make the check conditional on work that has to succeed first — a setting that isn't
   * on until the server says so. It's handed the state being moved *to*.
   *
   * Without it the row is what it has always been: a synchronous checkbox that flips on
   * click. With it the row defers — the tick holds, the loader runs in its place, and
   * `onCheckedChange` fires only after the action succeeds. A failure needs no rollback
   * because nothing moved; it shows briefly and the row goes quiet.
   *
   * This is `ActionToggle` for a menu row, and it works the same way for the same reason:
   * a row that already shows a tick while a spinner insists it's still working is telling
   * the user two things at once, and one of them is a guess.
   */
  action?: (checked: boolean) => void | Promise<unknown>;
  /** How long a failure is shown before the row goes quiet, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold back the loader for this long, so a near-instant action doesn't flash it.
      @default 0 */
  pendingDelay?: number;
  /** Announced while deferred. `aria-checked` covers the landing; the wait and the
      failure are otherwise silent. */
  announce?: { pending?: string; error?: string };
  onError?: (error: unknown) => void;
  /** Explain why a disabled row is unavailable. Hovering the row shows the explanation. */
  disabledReason?: ReactNode;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  icon,
  indicator = true,
  fillIcon = false,
  action,
  checked,
  defaultChecked,
  onCheckedChange,
  revertAfter,
  pendingDelay,
  loader,
  announce,
  disabled,
  disabledReason,
  onError,
  ...props
}: DropdownMenuCheckboxItemProps) {
  const deferred = action !== undefined;
  const hasReason = disabled && disabledReason != null && disabledReason !== "";
  const [uncontrolled, setUncontrolled] = useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const current = isControlled ? checked : uncontrolled;
  const target = !current;

  const { status, run } = useAction({
    action: () => action?.(target),
    revertAfter,
    pendingDelay,
    onSuccess: () => {
      if (!isControlled) setUncontrolled(target);
      // Base UI hands its own callback an event details object. This change came from a
      // promise settling rather than from an event, so there is nothing truthful to pass.
      (onCheckedChange as ((next: boolean, details?: never) => void) | undefined)?.(target);
    },
    onError,
  });

  // Untouched when there's no `action`: the consumer's own checked/onCheckedChange go
  // straight to Base UI and the row stays the synchronous checkbox it always was.
  const control = deferred
    ? {
        checked: current,
        onCheckedChange: () => void run(),
        // Same as the action row: staying enabled keeps the highlight on this row.
        disabled,
        "aria-busy": status === "pending" || undefined,
        "data-status": status,
      }
    : { checked, defaultChecked, onCheckedChange, disabled };

  return (
    <>
      <BaseMenu.CheckboxItem
        className={cn(
          itemBase,
          indicator && "pr-2 pl-8",
          hasReason && "data-[disabled]:pointer-events-auto",
          fillIcon && [
            "[&_svg]:transition-[fill] [&_svg]:duration-(--duration-fast) [&_svg]:ease-out",
            "data-[checked]:[&_svg]:fill-current",
          ],
          className,
        )}
        // Render function to read `checked`: the tick can Morph in and out (draw itself
        // in, blur out) instead of snapping, and `children` can swap on it.
        render={(itemProps, state) => (
          <DisabledReasonTooltip disabled={disabled} reason={disabledReason}>
            <div {...itemProps}>
              {indicator && (
                <span className={INDICATOR_SLOT}>
                  {/* The tick slot doubles as the status slot: while the action is in
                      flight the loader sits exactly where the tick will land, which is
                      what makes the wait read as "not yet" rather than as "nothing
                      happened". Both extra keys are unreachable without an `action`.

                      No size on the glyphs: `itemBase` sizes every svg in the row, and its
                      `.row svg` beats a class on the element itself, so anything set here
                      would be a statement the CSS quietly overrules. */}
                  <Morph
                    activeKey={status === "pending" || status === "error" ? status : "box"}
                    items={{
                      box: <MenuCheckbox checked={state.checked} />,
                      pending: <LoadingIndicator loader={loader} />,
                      error: <TriangleAlert />,
                    }}
                  />
                </span>
              )}
              {icon !== undefined && (
                <span className={GLYPH_SLOT}>
                  {/* Every glyph at once, so the slot never resizes between them. The tick
                      slot reports status when there is one; otherwise this one does. */}
                  <Morph
                    activeKey={
                      !indicator && (status === "pending" || status === "error")
                        ? status
                        : typeof icon === "function"
                          ? state.checked ? "on" : "off"
                          : "icon"
                    }
                    items={{
                      icon: typeof icon === "function" ? undefined : icon,
                      on: typeof icon === "function" ? icon(true) : undefined,
                      off: typeof icon === "function" ? icon(false) : undefined,
                      pending: <LoadingIndicator loader={loader} />,
                      error: <TriangleAlert />,
                    }}
                  />
                </span>
              )}
              {typeof children === "function" ? children(state.checked, status) : children}
            </div>
          </DisabledReasonTooltip>
        )}
        {...control}
        {...props}
      />

      {/* Outside the row, not inside it: a menu item's accessible name is built from its
          contents, so an sr-only status in there would rename the row to "Mute Working"
          for as long as it ran. */}
      {deferred && (
        <span aria-live="polite" className="sr-only">
          {status === "pending" && (announce?.pending ?? "Working")}
          {status === "error" && (announce?.error ?? "Something went wrong")}
        </span>
      )}
    </>
  );
}
