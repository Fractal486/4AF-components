import { dropdownMenuItemVariants } from "./dropdown-menu.variants";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import type { ReactElement, ReactNode } from "react";

export const itemBase = dropdownMenuItemVariants();

/**
 * The trailing check slot shared by checkbox and radio rows. The leading edge belongs to
 * icons, so a selection mark there would push a checkable row's label past every icon row's.
 * The slot is always reserved so a label never shifts when its row is checked.
 *
 * A shortcut is `ml-auto` too, and two auto margins split the free space between them —
 * so after a shortcut the slot drops its own and sits at the row's edge, shortcuts aligned.
 */
export const CHECK_SLOT =
  "pointer-events-none ml-auto flex size-3.5 shrink-0 items-center justify-center text-foreground [[data-slot^=kbd]+&]:ml-0";

/** The check itself, scaling in on `data-checked` — the same mark the select rows use. */
export const CHECK_MARK =
  "flex size-3.5 items-center justify-center scale-0 opacity-0 transition-[opacity,scale] duration-(--duration-fast) ease-out data-[checked]:scale-100 data-[checked]:opacity-100";

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
