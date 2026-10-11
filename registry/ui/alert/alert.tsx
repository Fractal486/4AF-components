import { Check, Info, TriangleAlert } from "lucide-react";
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
 */

/** An octagonal alert icon. Painted with `currentColor`. */
function HexagonAlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.30761 1.5L1.5 5.30761L1.5 10.6924L5.30761 14.5H10.6924L14.5 10.6924V5.30761L10.6924 1.5H5.30761ZM5.10051 0C4.83529 0 4.58094 0.105357 4.3934 0.292893L0.292893 4.3934C0.105357 4.58094 0 4.83529 0 5.10051V10.8995C0 11.1647 0.105357 11.4191 0.292894 11.6066L4.3934 15.7071C4.58094 15.8946 4.83529 16 5.10051 16H10.8995C11.1647 16 11.4191 15.8946 11.6066 15.7071L15.7071 11.6066C15.8946 11.4191 16 11.1647 16 10.8995V5.10051C16 4.83529 15.8946 4.58093 15.7071 4.3934L11.6066 0.292893C11.4191 0.105357 11.1647 0 10.8995 0H5.10051ZM8.75 3.75V4.5V8L8.75 8.75H7.25V8V4.5V3.75H8.75ZM8 12C8.55229 12 9 11.5523 9 11C9 10.4477 8.55229 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"
      />
    </svg>
  );
}

/**
 * The other four glyphs ship with something else and are used exactly as they come:
 * Lucide's triangle, check and info are the ones Badge already shows for those statuses,
 * and the loading indicator follows LoaderProvider. The octagonal icon above is hand-drawn only
 * because Lucide has no equivalent.
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
  error: () => <HexagonAlertIcon className={ICON_SLOT} />,
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
      {GLYPH[resolved](loader)}
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
