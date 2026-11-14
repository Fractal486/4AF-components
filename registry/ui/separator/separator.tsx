"use client";

import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { Children, Fragment, isValidElement, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { separatorLabelVariants, separatorLineVariants, separatorVariants } from "./separator.variants";

export type SeparatorAlign = "start" | "center" | "end";

export interface SeparatorProps extends ComponentProps<typeof BaseSeparator> {
  /** Text, icons, or other content in the divider. Takes precedence over children. */
  label?: ReactNode;
  /** Where the label sits along the divider. */
  align?: SeparatorAlign;
  /** Removes the separator announcement for a purely visual line. Labels remain readable. */
  decorative?: boolean;
}

function hasContent(content: ReactNode): boolean {
  return Children.toArray(content).some((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return hasContent(child.props.children);
    }
    return typeof child !== "string" || child.trim() !== "";
  });
}

/** Base UI owns the plain divider semantics; labeled dividers preserve their content's semantics. */
export function Separator({
  className,
  orientation = "horizontal",
  label,
  align = "center",
  decorative = false,
  children,
  ...props
}: SeparatorProps) {
  const content = label === undefined ? children : label;
  const labeled = hasContent(content);
  const baseClassName = separatorVariants({ orientation });
  const semantics = labeled
    ? { role: undefined, "aria-orientation": undefined }
    : decorative ? { role: "none", "aria-orientation": undefined } : {};

  return (
    <BaseSeparator
      orientation={orientation}
      data-slot="separator"
      data-labeled={labeled ? "" : undefined}
      data-align={labeled ? align : undefined}
      data-decorative={decorative ? "" : undefined}
      className={typeof className === "function"
        ? (state) => cn(baseClassName, className(state))
        : cn(baseClassName, className)}
      {...semantics}
      {...props}
    >
      {labeled ? (
        <>
          <span data-slot="separator-line" aria-hidden="true" className={separatorLineVariants({ side: "before" })} />
          <span data-slot="separator-label" className={separatorLabelVariants()}>{content}</span>
          <span data-slot="separator-line" aria-hidden="true" className={separatorLineVariants({ side: "after" })} />
        </>
      ) : null}
    </BaseSeparator>
  );
}
