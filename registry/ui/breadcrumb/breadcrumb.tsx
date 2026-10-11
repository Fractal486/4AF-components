"use client";

import { ChevronRight, MoreHorizontal } from "lucide-react";
import {
  cloneElement,
  Component,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Slot, useSlotChild } from "@/registry/lib/slot";
import { breadcrumbListVariants, type BreadcrumbListVariants } from "./breadcrumb.variants";

/**
 * A breadcrumb trail.
 *
 * There is no behaviour primitive here because a breadcrumb has none to borrow: it is a
 * `nav` landmark, an ordered list, links, and `aria-current="page"` on the last crumb. The
 * one interactive piece is `BreadcrumbCollapse`, which hides a run of middle crumbs behind
 * an ellipsis button and reveals them in place.
 *
 * The reveal is a FLIP, not a width animation. Every crumb's box is read just before the
 * hidden ones appear (React's `getSnapshotBeforeUpdate`, so it works whether the collapse is
 * controlled or not), the DOM updates, and each crumb that was already visible slides from
 * its old position to its new one on `transform`. Revealed crumbs fade in out of a blur in
 * place. Nothing animates `width` or margins, so no frame relays out the line, and a trail
 * that wraps onto a second line moves correctly on both axes. Timing is read from the
 * `--duration-slow` and `--ease-out` tokens, so reduced motion collapses it to a jump.
 */

/* -- Collapse context ---------------------------------------------------------------- */

interface CollapseContextValue {
  group: string;
  open: boolean;
}

const CollapseContext = createContext<CollapseContextValue | null>(null);

/** Marks an item or separator as part of a collapse group, and hidden while it's closed. */
function useCollapseAttributes() {
  const collapse = useContext(CollapseContext);
  if (!collapse) return {};
  return {
    "data-breadcrumb-group": collapse.group,
    "data-collapsed": collapse.open ? undefined : "",
  };
}

/* -- Parts --------------------------------------------------------------------------- */

export function Breadcrumb({ "aria-label": ariaLabel = "Breadcrumb", className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label={ariaLabel}
      data-slot="breadcrumb"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

export interface BreadcrumbListProps extends ComponentProps<"ol">, BreadcrumbListVariants {}

export function BreadcrumbList({ className, size, ...props }: BreadcrumbListProps) {
  return (
    <ol
      data-slot="breadcrumb-list"
      data-size={size ?? "md"}
      className={cn(breadcrumbListVariants({ size }), className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      {...useCollapseAttributes()}
      className={cn("inline-flex min-w-0 items-center gap-1 data-[collapsed]:hidden", className)}
      {...props}
    />
  );
}

export interface BreadcrumbLinkProps extends ComponentProps<"a"> {
  /** Render the styles onto the child element, e.g. a framework `<Link>`. */
  asChild?: boolean;
}

export function BreadcrumbLink({ asChild = false, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        // `-mx-1 px-1` gives the focus ring room without moving the text.
        "relative -mx-1 inline-flex min-w-0 items-center gap-1 rounded-[4px] px-1 outline-none",
        "transition-[color,box-shadow] duration-(--duration-fast) ease-out",
        "hover:text-foreground focus-visible:z-10 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        "[&>svg]:pointer-events-none [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      data-slot="breadcrumb-page"
      className={cn(
        "inline-flex min-w-0 items-center gap-1 font-normal text-foreground [&>svg]:pointer-events-none [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-separator"
      {...useCollapseAttributes()}
      className={cn(
        "inline-flex shrink-0 items-center text-subtle-foreground select-none [&>svg]:pointer-events-none",
        // Inside a closed collapse, a separator goes when the crumb after it goes. The last one
        // in the group stays: it sits between the ellipsis and the crumb that follows.
        "[&[data-collapsed]:has(+[data-collapsed])]:hidden",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronRight className="rtl:-scale-x-100" />}
    </li>
  );
}

const ellipsisClassName = cn(
  "relative inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] outline-none",
  "[&>svg]:pointer-events-none [&>svg]:shrink-0",
  // Interactive only when it is rendered onto a button or link (`asChild`, or a menu trigger's
  // `render`): then it takes a hover fill, a focus ring, an open state, and a 40px hit area.
  "[&:is(a,button)]:cursor-pointer",
  "[&:is(a,button)]:transition-[background-color,color,box-shadow] [&:is(a,button)]:duration-(--duration-fast) [&:is(a,button)]:ease-out",
  "[&:is(a,button)]:hover:bg-muted [&:is(a,button)]:hover:text-foreground",
  "[&:is(a,button)]:aria-expanded:bg-muted [&:is(a,button)]:aria-expanded:text-foreground",
  "[&:is(a,button)]:data-[popup-open]:bg-muted [&:is(a,button)]:data-[popup-open]:text-foreground",
  "[&:is(a,button)]:focus-visible:z-10 [&:is(a,button)]:focus-visible:text-foreground [&:is(a,button)]:focus-visible:ring-2 [&:is(a,button)]:focus-visible:ring-ring",
  "[&:is(a,button)]:after:absolute [&:is(a,button)]:after:top-1/2 [&:is(a,button)]:after:left-1/2 [&:is(a,button)]:after:size-10 [&:is(a,button)]:after:-translate-1/2",
);

export interface BreadcrumbEllipsisProps extends ComponentProps<"span"> {
  /**
   * Render onto the child element — a `<button>`, a link, or a menu trigger — making the
   * ellipsis interactive. A child with no content of its own gets the dots.
   */
  asChild?: boolean;
}

export function BreadcrumbEllipsis({
  asChild = false,
  className,
  children: childrenProp,
  ...props
}: BreadcrumbEllipsisProps) {
  const children = useSlotChild(childrenProp);
  const dots = <MoreHorizontal aria-hidden />;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ children?: ReactNode }>;
    const filled = child.props.children == null ? cloneElement(child, undefined, dots) : child;
    return (
      <Slot data-slot="breadcrumb-ellipsis" className={cn(ellipsisClassName, className)} {...props}>
        {filled}
      </Slot>
    );
  }

  // Decorative on its own: the crumbs it stands for are hidden from everyone, so there is
  // nothing for it to announce.
  return (
    <span
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-ellipsis"
      className={cn(ellipsisClassName, className)}
      {...props}
    >
      {children ?? dots}
    </span>
  );
}

/* -- Collapse ------------------------------------------------------------------------ */

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleRect(element: HTMLElement): DOMRect | null {
  return element.getClientRects().length > 0 ? element.getBoundingClientRect() : null;
}

function groupElements(list: Element, group: string): HTMLElement[] {
  return Array.from(list.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.dataset.breadcrumbGroup === group,
  );
}

/** The motion tokens as WAAPI wants them. Reduced motion has already collapsed the duration. */
function motionTiming(element: HTMLElement) {
  const style = getComputedStyle(element);
  const raw = style.getPropertyValue("--duration-slow").trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  const easing = style.getPropertyValue("--ease-out").trim() || "cubic-bezier(0.16, 1, 0.3, 1)";
  return { duration: Number.isFinite(ms) ? ms : 300, easing };
}

interface FlipProps {
  open: boolean;
  group: string;
  trigger: RefObject<HTMLLIElement | null>;
}

interface FlipSnapshot {
  rects: Map<HTMLElement, DOMRect | null>;
  /** Focus sat in something this change hides, so it has to be moved somewhere visible. */
  focusLost: boolean;
}

/**
 * The FLIP, as a class because `getSnapshotBeforeUpdate` is the one place React offers a read
 * of the DOM *before* a commit changes it. Renders nothing.
 */
class CollapseFlip extends Component<FlipProps> {
  private running: Animation[] = [];

  getSnapshotBeforeUpdate(previous: FlipProps): FlipSnapshot | null {
    const trigger = this.props.trigger.current;
    const list = trigger?.parentElement;
    if (previous.open === this.props.open || !trigger || !list) return null;

    // Read with any running animation still applied, so an interrupted move continues from
    // where it visibly is.
    const rects = new Map<HTMLElement, DOMRect | null>();
    for (const child of Array.from(list.children)) {
      if (child instanceof HTMLElement) rects.set(child, visibleRect(child));
    }

    const hiding = this.props.open ? [trigger] : groupElements(list, this.props.group);
    const active = document.activeElement;
    const focusLost = active != null && hiding.some((element) => element.contains(active));

    return { rects, focusLost };
  }

  componentDidUpdate(_previous: FlipProps, _state: unknown, snapshot: FlipSnapshot | null) {
    const trigger = this.props.trigger.current;
    const list = trigger?.parentElement;
    if (!snapshot || !trigger || !list) return;

    for (const animation of this.running) animation.cancel();
    this.running = [];

    if (typeof trigger.animate === "function") {
      const { duration, easing } = motionTiming(list);
      for (const [element, first] of snapshot.rects) {
        const last = visibleRect(element);
        if (!last) continue;
        const animation = first
          ? Math.abs(first.left - last.left) > 0.5 || Math.abs(first.top - last.top) > 0.5
            ? element.animate(
                [
                  { transform: `translate(${first.left - last.left}px, ${first.top - last.top}px)` },
                  { transform: "none" },
                ],
                { duration, easing },
              )
            : null
          : element.animate(
              [
                { opacity: 0, filter: "blur(4px)" },
                { opacity: 1, filter: "blur(0px)" },
              ],
              { duration, easing },
            );
        if (animation) this.running.push(animation);
      }
    }

    if (snapshot.focusLost) {
      const target = this.props.open
        ? groupElements(list, this.props.group)
            .map((element) => (element.matches(focusableSelector) ? element : element.querySelector<HTMLElement>(focusableSelector)))
            .find((element): element is HTMLElement => element != null)
        : trigger.querySelector<HTMLElement>(focusableSelector);
      target?.focus();
    }
  }

  componentWillUnmount() {
    for (const animation of this.running) animation.cancel();
  }

  render() {
    return null;
  }
}

export interface BreadcrumbCollapseProps {
  /** The hidden run: `BreadcrumbItem`s and `BreadcrumbSeparator`s, ending in a separator. */
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The ellipsis button's accessible name. */
  label?: string;
}

/**
 * Hides its children behind an ellipsis button until it's pressed. Place it inside a
 * `BreadcrumbList` where the hidden crumbs would sit, after the preceding separator; end the
 * group with a separator so one remains between the ellipsis and the crumb that follows.
 */
export function BreadcrumbCollapse({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Show full path",
}: BreadcrumbCollapseProps) {
  const group = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const triggerRef = useRef<HTMLLIElement>(null);
  const context = useMemo(() => ({ group, open }), [group, open]);

  return (
    <CollapseContext.Provider value={context}>
      <CollapseFlip open={open} group={group} trigger={triggerRef} />
      <li
        ref={triggerRef}
        data-slot="breadcrumb-collapse"
        data-state={open ? "open" : "closed"}
        data-collapsed={open ? "" : undefined}
        className="inline-flex shrink-0 items-center data-[collapsed]:hidden"
      >
        <BreadcrumbEllipsis asChild>
          <button
            type="button"
            aria-label={label}
            aria-expanded={open}
            onClick={() => {
              if (openProp === undefined) setUncontrolledOpen(true);
              onOpenChange?.(true);
            }}
          />
        </BreadcrumbEllipsis>
      </li>
      {children}
    </CollapseContext.Provider>
  );
}
