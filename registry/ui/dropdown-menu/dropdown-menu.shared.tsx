import { dropdownMenuItemVariants } from "./dropdown-menu.variants";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import type { ReactElement, ReactNode } from "react";

export const itemBase = dropdownMenuItemVariants();

/**
 * The tick/dot slot, and it holds the same 14px box a leading icon does — `left-2.5` and
 * `size-3.5` against the row's `px-2.5` padding, so both run 10px to 24px and share a
 * centre.
 *
 * It used to be `left-2 size-4`: 8px to 24px. The two boxes shared a right edge but not a
 * centre, so a ticked row's glyph sat a pixel left of an icon row's, which is exactly the
 * kind of drift you can see in a column of rows and can't name. The labels were always
 * fine — the row's `pl-8` is 10 + 14 + 8 — so only the glyph column was off.
 */
export const INDICATOR_SLOT =
  "pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center";

export function DisabledReasonTooltip({
  disabled,
  reason,
  children,
}: {
  disabled?: boolean;
  reason?: ReactNode;
  children: ReactElement;
}) {
  if (!disabled || reason == null || reason === "") return children;

  return (
    <Tooltip content={reason} side="right" sideOffset={6} delay={0}>
      {children}
    </Tooltip>
  );
}
