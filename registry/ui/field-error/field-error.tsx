import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

/**
 * A field error message — the hexagon alert glyph and the reason, in destructive red.
 *
 * Sits below the control it describes; point the control's `aria-describedby` at this
 * (give it an `id`) so the message is announced with the field. `role="alert"` makes it
 * announced the moment it appears, which is what you want when it's rendered on demand.
 * Renders nothing when there's no message, so `{error && <FieldError>{error}</FieldError>}`
 * and a bare `<FieldError>{error}</FieldError>` behave the same.
 */

/** The filled hexagon with an alert bar. Painted with `currentColor`. */
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

export interface FieldErrorProps extends Omit<ComponentProps<"p">, "children"> {
  children?: ReactNode;
}

export function FieldError({ className, children, ...props }: FieldErrorProps) {
  if (children == null || children === "") return null;

  return (
    <p
      role="alert"
      className={cn(
        "mt-1.5 flex items-center gap-1.5 text-sm text-destructive",
        className,
      )}
      {...props}
    >
      <HexagonAlertIcon className="size-3.5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
