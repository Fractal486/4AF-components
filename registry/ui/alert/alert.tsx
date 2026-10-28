import { Check, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { LoadingIndicator } from "@/registry/lib/loader";
import { alertVariants, type AlertVariants } from "./alert.variants";

/**
 * An inline status line — a glyph and a sentence, in the colour of what it's telling you.
 * Five of them: `error`, `warning`, `success`, `info`, and `loading`.
 *
 * It carries no surface of its own: no panel, no border, no padding beyond the space
 * above it. That's what lets the same component sit under a field, beside a save button,
 * at the foot of a form, or in a settings row without any of them having to make room for
 * a box. Reach for Badge when the status is a label on a row rather than a sentence.
 *
 * Under a field, point the control's `aria-describedby` at this (give it an `id`) so the
 * line is announced with the field. It renders nothing when there's no message, so
 * `{error && <Alert>{error}</Alert>}` and a bare `<Alert>{error}</Alert>` behave the same.
 *
 * **Only the error interrupts.** It's `role="alert"`, which is right for something that
 * has just stopped the user from continuing. Everything else is `role="status"`, the
 * polite one that waits for a pause in speech — a caution, a confirmation, a note or a
 * progress line has no business cutting across whatever the user was being told.
 *
 * The glyph is always the same 14px slot, so a line that moves through the states —
 * checking, then saved or failed — swaps its glyph without the text shifting sideways.
 * It sits in a box one line tall, so a message that wraps keeps the glyph on its first
 * line instead of centring it against the whole block.
 */

/**
 * Status glyphs use Lucide icons, and the loading indicator follows LoaderProvider.
 *
 * The loader uses the same 14px box as the other icons, which is what
 * keeps the sentence from stepping sideways when the state resolves.
 *
 * No `label` on it, deliberately. The line beside it is already the announcement, and its
 * own live region would have a screen reader say "Loading" over the sentence explaining
 * what's loading.
 */
const ICON_SLOT = "size-3.5 shrink-0";

const GLYPH: Record<NonNullable<AlertVariants["variant"]>, (loader?: ReactNode) => ReactNode> = {
  error: () => <OctagonAlert aria-hidden="true" className={ICON_SLOT} />,
  warning: () => <TriangleAlert aria-hidden="true" className={ICON_SLOT} />,
  success: () => <Check aria-hidden="true" className={ICON_SLOT} />,
  info: () => <Info aria-hidden="true" className={ICON_SLOT} />,
  loading: (loader) => <LoadingIndicator loader={loader} className={ICON_SLOT} />,
};

export interface AlertProps extends Omit<ComponentProps<"p">, "children">, AlertVariants {
  children?: ReactNode;
  loader?: ReactNode;
}

export function Alert({ className, variant, children, loader, ...props }: AlertProps) {
  if (children == null || children === "") return null;

  // CVA types a variant as nullable, so the default is resolved here rather than in the
  // destructure — `variant={null}` has to land on the same line as no variant at all.
  const resolved = variant ?? "error";

  return (
    <p
      role={resolved === "error" ? "alert" : "status"}
      data-variant={resolved}
      className={cn(alertVariants({ variant: resolved }), className)}
      {...props}
    >
      <span data-slot="alert-glyph" className="flex h-[1lh] shrink-0 items-center">
        {GLYPH[resolved](loader)}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * @deprecated Renamed to `Alert`. The component outgrew the name once it stopped being
 * only an error and only under a field. The alias keeps existing call sites working and
 * can go once they've been updated.
 */
export const FieldError = Alert;
/** @deprecated Renamed to `AlertProps`. */
export type FieldErrorProps = AlertProps;
