import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Button, type ButtonProps } from "@/registry/ui/button/button";
import {
  buttonGroupItemVariants,
  buttonGroupVariants,
  type ButtonGroupItemVariants,
  type ButtonGroupVariants,
} from "./button-group.variants";

type ButtonVariant = NonNullable<ButtonProps["variant"]>;
type ButtonSize = NonNullable<ButtonProps["size"]>;

/** What the join between two adjacent buttons is made of, per variant. */
const SEAM: Record<ButtonVariant, NonNullable<ButtonGroupItemVariants["seam"]>> = {
  outline: "divider",
  primary: "tint",
  destructive: "tint",
  ghost: "none",
  plain: "none",
  link: "none",
};

/** The two sizes that round to 8px; xs and sm use the 6px tier. */
const LARGE_RADIUS: ButtonSize[] = ["md", "icon", "lg", "icon-lg"];

type ItemProps = {
  className?: string;
} & Pick<ButtonProps, "variant" | "size" | "pressScale" | "pressTarget">;

export interface ButtonGroupProps
  extends Omit<ComponentProps<"div">, "children">,
    Pick<ButtonGroupVariants, "orientation"> {
  /**
   * Variant for every Button in the group. Each child can still set its own — this is
   * a default, so the common case (a run of buttons that all look alike) doesn't
   * repeat itself five times.
   */
  variant?: ButtonProps["variant"];
  /** Size for every Button in the group. Same deal: a default, not an override. */
  size?: ButtonProps["size"];
  children?: ReactNode;
}

function flattenElements(children: ReactNode): ReactElement<ItemProps>[] {
  const items: ReactElement<ItemProps>[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      flattenElements((child.props as { children?: ReactNode }).children).forEach((item) =>
        items.push(item),
      );
      return;
    }
    items.push(child as ReactElement<ItemProps>);
  });

  return items;
}

/**
 * Two or more Buttons joined into one control.
 *
 * `role="group"` and nothing else: each button stays its own tab stop, because each
 * one still does its own thing. A group whose buttons *select* between options is a
 * different widget — that's Tabs, or a toggle group — and it's the one that wants a
 * roving tabindex, which is Base UI's job, not this file's.
 *
 * ```tsx
 * <ButtonGroup variant="outline" aria-label="Text alignment">
 *   <Button>Left</Button>
 *   <Button>Centre</Button>
 *   <Button>Right</Button>
 * </ButtonGroup>
 * ```
 *
 * Every variant looks exactly like its standalone Button, hover included: the group
 * adds geometry (which corners are round, where the hairline goes) and takes over the
 * outline, and touches no colour.
 *
 * Most of that is CSS handed to each child through `className`, but three things can't
 * be: the group has to know each child's *position* to flatten the right corners, it
 * wants to pass its `variant`/`size` down as defaults, and the press has to move to
 * the label — props, not classes. So the children are cloned. Only real `Button`s get
 * props injected; anything else in the group (a menu trigger, a `Tooltip`-wrapped
 * button) receives the class names and is otherwise left alone, because passing it
 * props it doesn't know about would land them on the DOM.
 */
export function ButtonGroup({
  className,
  orientation = "horizontal",
  variant,
  size,
  children,
  ...props
}: ButtonGroupProps) {
  // React treats a Fragment as one child during traversal, so flatten it recursively.
  // Falsy conditional branches are skipped and the visible buttons still receive the
  // correct first/middle/last geometry.
  const items = flattenElements(children);

  // The child's own variant wins over the group's, and Button's default (`primary`) is
  // the last word — the same resolution the child will do itself, so a seam is always
  // drawn against the fill it actually sits on.
  const variants = items.map((child) => child.props.variant ?? variant ?? "primary");
  const sizes = items.map((child) => child.props.size ?? size ?? "md");

  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        buttonGroupVariants({
          orientation,
          // Asked of the children rather than of the group's own prop, so
          // `<ButtonGroup><Button variant="outline" /></ButtonGroup>` is framed too.
          framed: variants.includes("outline"),
          radius: LARGE_RADIUS.includes(sizes[0] ?? "md") ? "lg" : "md",
        }),
        className,
      )}
      {...props}
    >
      {items.map((child, index) => {
        const position =
          items.length === 1
            ? "only"
            : index === 0
              ? "first"
              : index === items.length - 1
                ? "last"
                : "middle";

        return cloneElement(child, {
          // Group classes first, the child's own last, so a caller can still
          // override any of this on a single button.
          className: cn(
            buttonGroupItemVariants({
              orientation,
              position,
              seam: SEAM[variants[index] ?? "primary"],
            }),
            child.props.className,
          ),
          ...(child.type === Button && {
            variant: child.props.variant ?? variant,
            size: child.props.size ?? size,
            // The press moves to the label. Shrinking a joined button's box would
            // pull its edges away from its neighbours' and open a gap down both
            // seams; the label has no such neighbours, and carries the same spring.
            pressTarget: child.props.pressTarget ?? "content",
          }),
        });
      })}
    </div>
  );
}
