"use client";

import { useRender } from "@base-ui/react/use-render";
import { Check, ChevronRight, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn, mergeStateClassName } from "@/registry/lib/cn";
import { Slot, useSlotChild } from "@/registry/lib/slot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
} from "@/registry/ui/dropdown-menu/dropdown-menu";
import { breadcrumbListVariants, type BreadcrumbListVariants } from "./breadcrumb.variants";

/* -- Separator glyphs ---------------------------------------------------------------- */

export type BreadcrumbSeparatorKind = "slash" | "chevron" | "line" | "dot";

/** Same 24px grid and 2px stroke as the lucide chevron, so every glyph sizes from the list. */
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      {children}
    </svg>
  );
}

const separatorGlyphs: Record<BreadcrumbSeparatorKind, ReactNode> = {
  // An upright typographic slash, not lucide's 45-degree diagonal.
  slash: <Glyph><path d="M15 4 9 20" /></Glyph>,
  chevron: <ChevronRight className="rtl:-scale-x-100" />,
  line: <Glyph><path d="M12 5v14" /></Glyph>,
  dot: <Glyph><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></Glyph>,
};

const SeparatorContext = createContext<BreadcrumbSeparatorKind>("chevron");

/**
 * A breadcrumb trail.
 *
 * There is no behaviour primitive here because a breadcrumb has none to borrow: it is a
 * `nav` landmark, an ordered list, links, and `aria-current="page"` on the last crumb. The
 * one interactive piece is `BreadcrumbCollapse`, which hides a run of middle crumbs behind
 * an ellipsis button and reveals them in place.
 *
 * Collapsing retains outgoing crumbs until their width and opacity reach zero. Width and
 * inline margin intentionally animate here: neighboring crumbs need to reflow continuously
 * as space is released. Timing follows the motion tokens, with an immediate reduced-motion
 * path. Focus transfers only after the final layout settles.
 */

/* -- Collapse context ---------------------------------------------------------------- */

interface CollapseContextValue {
  group: string;
  open: boolean;
  settled: boolean;
}

const CollapseContext = createContext<CollapseContextValue | null>(null);

/** Set inside a `variant="menu"` collapse's panel, where crumbs render as menu rows. */
const InMenuContext = createContext(false);

/** Marks an item or separator as part of a collapse group, and hidden while it's closed. */
function useCollapseAttributes() {
  const collapse = useContext(CollapseContext);
  if (!collapse) return {};
  return {
    "data-breadcrumb-group": collapse.group,
    "data-collapsed": !collapse.open && collapse.settled ? "" : undefined,
  };
}

/* -- Parts --------------------------------------------------------------------------- */

export type BreadcrumbPartProps<E extends ElementType> = useRender.ComponentProps<E> & {
  /** Render onto the single child. Takes precedence over render. */
  asChild?: boolean;
};

export function Breadcrumb({
  "aria-label": ariaLabel = "Breadcrumb", className, asChild = false, render, ref, ...props
}: BreadcrumbPartProps<"nav">) {
  return useRender({
    defaultTagName: "nav",
    render: asChild ? <Slot /> : render,
    ref,
    props: { ...props, "aria-label": ariaLabel, "data-slot": "breadcrumb", className: cn("min-w-0", className) },
  });
}

export interface BreadcrumbListProps extends BreadcrumbPartProps<"ol">, BreadcrumbListVariants {
  /** The default glyph for every `BreadcrumbSeparator` without children. */
  separator?: BreadcrumbSeparatorKind;
}

export function BreadcrumbList({
  className, size, separator = "chevron", asChild = false, render, ref, ...props
}: BreadcrumbListProps) {
  const element = useRender({
    defaultTagName: "ol",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...props,
      "data-slot": "breadcrumb-list",
      "data-size": size ?? "md",
      "data-separator": separator,
      className: cn(breadcrumbListVariants({ size }), className),
    },
  });
  return <SeparatorContext.Provider value={separator}>{element}</SeparatorContext.Provider>;
}

function TrailItem({ className, asChild = false, render, ref, ...props }: BreadcrumbPartProps<"li">) {
  const collapseAttributes = useCollapseAttributes();
  return useRender({
    defaultTagName: "li",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...props,
      "data-slot": "breadcrumb-item",
      ...collapseAttributes,
      className: cn("inline-flex min-w-0 items-center gap-1 data-[collapsed]:hidden", className),
    },
  });
}

export type BreadcrumbLinkProps = BreadcrumbPartProps<"a">;

function TrailLink({ asChild = false, className, render, ref, ...props }: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...props,
      "data-slot": "breadcrumb-link",
      className: cn(
        // `-mx-1 px-1` gives the focus ring room without moving the text.
        "relative -mx-1 inline-flex min-w-0 items-center gap-1 rounded-[4px] px-1 outline-none",
        "transition-[color,box-shadow] duration-(--duration-fast) ease-out",
        "hover:text-foreground focus-visible:z-10 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        "[&>svg]:pointer-events-none [&>svg]:shrink-0",
        className,
      ),
    },
  });
}

function TrailPage({ className, asChild = false, render, ref, ...props }: BreadcrumbPartProps<"span">) {
  return useRender({
    defaultTagName: "span",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      "aria-current": "page",
      ...props,
      "data-slot": "breadcrumb-page",
      className: cn(
        "inline-flex min-w-0 items-center gap-1 font-normal text-foreground [&>svg]:pointer-events-none [&>svg]:shrink-0",
        className,
      ),
    },
  });
}

function TrailSeparator({ children, className, asChild = false, render, ref, ...props }: BreadcrumbPartProps<"li">) {
  const collapseAttributes = useCollapseAttributes();
  const kind = useContext(SeparatorContext);
  return useRender({
    defaultTagName: "li",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      role: "presentation",
      "aria-hidden": true,
      ...props,
      "data-slot": "breadcrumb-separator",
      ...collapseAttributes,
      "data-separator": children == null ? kind : undefined,
      children: children ?? separatorGlyphs[kind],
      className: cn(
        "inline-flex shrink-0 items-center text-subtle-foreground select-none [&>svg]:pointer-events-none",
        // Inside a closed collapse, a separator goes when the crumb after it goes. The last one
        // in the group stays: it sits between the ellipsis and the crumb that follows.
        "[&[data-collapsed]:has(+[data-collapsed])]:hidden",
        className,
      ),
    },
  });
}

/* -- Crumbs inside a menu collapse --------------------------------------------------- */

/*
 * A `variant="menu"` collapse renders its children in a Dropdown Menu panel. The same parts
 * then become menu rows: a link is a link row, a page a row marked current, and items and
 * separators drop their list markup. Sibling menus are omitted, since a row can't hold one.
 */

const menuRowClassName = "cursor-default";

function MenuLink({ asChild = false, render, className, children, ref, ...props }: BreadcrumbLinkProps) {
  const child = asChild && isValidElement(children) ? (children as ReactElement<{ children?: ReactNode }>) : null;
  const target = child
    ? cloneElement(child, { children: undefined })
    : isValidElement(render) ? cloneElement(render as ReactElement<object>, props) : <a {...props} />;
  return (
    <DropdownMenuItem
      ref={ref as never}
      render={target}
      data-slot="breadcrumb-link"
      className={cn(menuRowClassName, typeof className === "string" ? className : undefined)}
    >
      {child ? child.props.children : children}
    </DropdownMenuItem>
  );
}

function MenuPage({ children, className }: BreadcrumbPartProps<"span">) {
  return (
    <DropdownMenuItem aria-current="page" data-current="" data-slot="breadcrumb-page"
      className={cn(menuRowClassName, typeof className === "string" ? className : undefined)}>
      {children}
    </DropdownMenuItem>
  );
}

export function BreadcrumbItem(props: BreadcrumbPartProps<"li">) {
  return useContext(InMenuContext) ? <>{props.children}</> : <TrailItem {...props} />;
}

export function BreadcrumbLink(props: BreadcrumbLinkProps) {
  return useContext(InMenuContext) ? <MenuLink {...props} /> : <TrailLink {...props} />;
}

export function BreadcrumbPage(props: BreadcrumbPartProps<"span">) {
  return useContext(InMenuContext) ? <MenuPage {...props} /> : <TrailPage {...props} />;
}

export function BreadcrumbSeparator(props: BreadcrumbPartProps<"li">) {
  return useContext(InMenuContext) ? null : <TrailSeparator {...props} />;
}

const ellipsisClassName = cn(
  "relative inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] outline-none",
  // The box is 4px taller than the text line at both sizes; the negative block margin keeps
  // it from setting the row height, so the trail doesn't move as the ellipsis comes and goes.
  "-my-0.5",
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

export interface BreadcrumbEllipsisProps extends BreadcrumbPartProps<"span"> {
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
  render,
  ref,
  ...props
}: BreadcrumbEllipsisProps) {
  let children = useSlotChild(childrenProp);
  const dots = <MoreHorizontal aria-hidden />;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ children?: ReactNode }>;
    children = child.props.children == null ? cloneElement(child, undefined, dots) : child;
  }

  return useRender({
    defaultTagName: "span",
    render: asChild ? <Slot /> : render,
    ref,
    props: {
      ...(!asChild && render === undefined ? { role: "presentation", "aria-hidden": true as const } : {}),
      ...props,
      "data-slot": "breadcrumb-ellipsis",
      className: cn(ellipsisClassName, className),
      children: children ?? dots,
    },
  });
}

/* -- Siblings ------------------------------------------------------------------------ */

/**
 * A breadcrumb menu opens on its `current` row, or the first enabled one. Base UI places its
 * own initial focus first; focusing the row a frame later makes it Base UI's highlight too.
 */
function useOpenOnActiveRow(open: boolean) {
  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const rows = Array.from(popupRef.current?.querySelectorAll<HTMLElement>(
        '[role^="menuitem"]:not([data-disabled])',
      ) ?? []);
      (rows.find((row) => row.hasAttribute("data-current")) ?? rows[0])?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return popupRef;
}

export interface BreadcrumbSiblingsProps {
  /** `BreadcrumbSibling` rows: the pages beside this crumb, itself included as `current`. */
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The trigger button's accessible name. */
  label?: string;
  /** Props for the menu panel: placement, classes, portal and positioner options. */
  contentProps?: Omit<DropdownMenuContentProps, "children">;
}

/**
 * A menu of sibling pages, opened from a small button after the crumb's link or page. Place
 * it inside a `BreadcrumbItem`. The panel opens on the `current` row, or the first one.
 */
function TrailSiblings({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Sibling pages",
  contentProps,
}: BreadcrumbSiblingsProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const popupRef = useOpenOnActiveRow(open);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (openProp === undefined) setUncontrolledOpen(next);
        onOpenChange?.(next);
      }}
    >
      <DropdownMenuTrigger
        aria-label={label}
        data-slot="breadcrumb-siblings-trigger"
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-[4px] outline-none",
          "transition-[background-color,color,box-shadow] duration-(--duration-fast) ease-out",
          "hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
          "focus-visible:z-10 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          "[&>svg]:pointer-events-none [&>svg]:shrink-0",
          // A 40px-tall hit area that doesn't reach sideways over the crumb's own link.
          "after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2",
        )}
      >
        <ChevronsUpDown aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent {...contentProps} ref={popupRef}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BreadcrumbSiblings(props: BreadcrumbSiblingsProps) {
  return useContext(InMenuContext) ? null : <TrailSiblings {...props} />;
}

export interface BreadcrumbSiblingProps extends DropdownMenuItemProps {
  href?: string;
  /** The page this crumb names: marked `aria-current="page"`, checked, and opened on. */
  current?: boolean;
}

/**
 * One sibling page. Renders an `<a href>`; `render` swaps in a framework link instead.
 */
export function BreadcrumbSibling({ href, current = false, render, className, children, ...props }: BreadcrumbSiblingProps) {
  return (
    <DropdownMenuItem
      render={render ?? <a href={href} />}
      aria-current={current ? "page" : undefined}
      {...props}
      // A menu row, not an inline link: the default cursor, like every other menu row.
      className={mergeStateClassName("cursor-default", className)}
      data-slot="breadcrumb-sibling"
      data-current={current ? "" : undefined}
    >
      {children}
      {current ? <span className="ms-auto flex shrink-0"><Check aria-hidden /></span> : null}
    </DropdownMenuItem>
  );
}

/* -- Collapse ------------------------------------------------------------------------ */

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function groupElements(list: Element, group: string): HTMLElement[] {
  return Array.from(list.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.dataset.breadcrumbGroup === group,
  );
}

function togglesWithCollapse(element: HTMLElement, group: string) {
  // The last separator stays between the ellipsis and the following crumb.
  return element.dataset.slot !== "breadcrumb-separator" ||
    element.nextElementSibling?.getAttribute("data-breadcrumb-group") === group;
}

/** WAAPI reads the same tokens as CSS, and explicitly skips movement under reduced motion. */
function motionTiming(element: HTMLElement) {
  const style = getComputedStyle(element);
  const raw = style.getPropertyValue("--duration-slow").trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return {
    duration: reduced ? 0 : Number.isFinite(ms) ? Math.max(0, ms) : 300,
    easing: style.getPropertyValue("--ease-out").trim() || "cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

const temporaryProperties = ["overflow", "white-space", "min-width", "flex-shrink"] as const;

function prepareAnimation(element: HTMLElement) {
  const original = temporaryProperties.map((property) => ({
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
  element.style.overflow = "clip";
  element.style.whiteSpace = "nowrap";
  element.style.minWidth = "0px";
  element.style.flexShrink = "0";
  return () => {
    for (const { property, value, priority } of original) {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
  };
}

interface RunningAnimation {
  animation: Animation;
  restore: () => void;
}

export interface BreadcrumbCollapseProps {
  /** The hidden run: `BreadcrumbItem`s and `BreadcrumbSeparator`s, ending in a separator. */
  children?: ReactNode;
  /**
   * `expand` reveals the hidden crumbs in place; `menu` lists them in a dropdown from the
   * ellipsis. In `menu`, `open` is the menu's open state.
   */
  variant?: "expand" | "menu";
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
export function BreadcrumbCollapse({ variant = "expand", ...props }: BreadcrumbCollapseProps) {
  return variant === "menu" ? <CollapseMenu {...props} /> : <CollapseExpand {...props} />;
}

function CollapseMenu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Show full path",
}: Omit<BreadcrumbCollapseProps, "variant">) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const popupRef = useOpenOnActiveRow(open);

  return (
    <>
      <li data-slot="breadcrumb-collapse" data-variant="menu" data-state={open ? "open" : "closed"}
        className="inline-flex shrink-0 items-center">
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            if (openProp === undefined) setUncontrolledOpen(next);
            onOpenChange?.(next);
          }}
        >
          <BreadcrumbEllipsis asChild className="[&:is(a,button)]:cursor-default">
            <DropdownMenuTrigger aria-label={label} />
          </BreadcrumbEllipsis>
          <DropdownMenuContent ref={popupRef}>
            <InMenuContext.Provider value>{children}</InMenuContext.Provider>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      {/* The group's separators render as nothing in the panel; this one stays in the trail. */}
      <TrailSeparator />
    </>
  );
}

function CollapseExpand({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Show full path",
}: Omit<BreadcrumbCollapseProps, "variant">) {
  const group = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const [transition, setTransition] = useState({ open, settled: true });
  if (transition.open !== open) setTransition({ open, settled: false });
  const { settled } = transition;
  const triggerRef = useRef<HTMLLIElement>(null);
  const animationsRef = useRef(new Map<HTMLElement, RunningAnimation>());
  const runRef = useRef({ id: 0 });
  const focusOwnerRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const list = trigger?.parentElement;
    if (settled || !trigger || !list) return;

    const run = ++runRef.current.id;
    const animations = animationsRef.current;
    const toggled = [trigger, ...groupElements(list, group).filter((element) => togglesWithCollapse(element, group))];
    const active = document.activeElement;
    if (active && toggled.some((element) => element.contains(active))) focusOwnerRef.current = active;
    const finish = () => {
      if (runRef.current.id === run) setTransition({ open, settled: true });
    };
    const timing = motionTiming(list);
    if (typeof trigger.animate !== "function" || timing.duration <= 1) {
      finish();
      return;
    }

    // Read every running value before canceling any animation. CSS widths stay correct
    // under browser/CSS zoom, unlike getBoundingClientRect's scaled widths.
    const starts = new Map(toggled.map((element) => {
      const style = getComputedStyle(element);
      return [element, animations.has(element) ? {
        width: parseFloat(style.width) || 0,
        marginInlineEnd: parseFloat(style.marginInlineEnd) || 0,
        opacity: parseFloat(style.opacity),
      } : null] as const;
    }));
    for (const { animation, restore } of animations.values()) {
      animation.cancel();
      restore();
    }
    animations.clear();

    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const frames = toggled.map((element) => {
      const style = getComputedStyle(element);
      const width = parseFloat(style.width) || 0;
      const margin = parseFloat(style.marginInlineEnd) || 0;
      const opacity = parseFloat(style.opacity) || 0;
      const entering = element === trigger ? !open : open;
      const start = starts.get(element) ?? {
        width: entering ? 0 : width,
        marginInlineEnd: entering ? margin - gap : margin,
        opacity: entering ? 0 : opacity,
      };
      return { element, keyframes: [
        { width: `${start.width}px`, marginInlineEnd: `${start.marginInlineEnd}px`, opacity: start.opacity },
        { width: `${entering ? width : 0}px`, marginInlineEnd: `${entering ? margin : margin - gap}px`, opacity: entering ? opacity : 0 },
      ] };
    });
    const pending = frames.map(({ element, keyframes }) => {
      const restore = prepareAnimation(element);
      const animation = element.animate(keyframes, { ...timing, fill: "both" });
      animations.set(element, { animation, restore });
      return animation.finished;
    });
    // Cancellation of an older run cannot settle a newer one.
    void Promise.all(pending).then(finish, finish);
  }, [group, open, settled]);

  useLayoutEffect(() => {
    if (!settled) return;
    const animations = animationsRef.current;
    for (const { animation, restore } of animations.values()) {
      animation.cancel();
      restore();
    }
    animations.clear();

    const owner = focusOwnerRef.current;
    focusOwnerRef.current = null;
    const trigger = triggerRef.current;
    const list = trigger?.parentElement;
    if (!owner || !trigger || !list) return;
    // Tabbing or clicking elsewhere during the animation must not pull focus back.
    if (document.activeElement !== owner && document.activeElement !== document.body) return;
    const candidates = open ? groupElements(list, group) : [trigger];
    const target = candidates.flatMap((element) => [
      ...(element.matches(focusableSelector) ? [element] : []),
      ...element.querySelectorAll<HTMLElement>(focusableSelector),
    ]).find((element) => !element.checkVisibility || element.checkVisibility({ visibilityProperty: true }));
    target?.focus({ preventScroll: true });
  }, [group, open, settled]);

  useEffect(() => {
    const animations = animationsRef.current;
    const run = runRef.current;
    return () => {
      ++run.id;
      for (const { animation, restore } of animations.values()) {
        animation.cancel();
        restore();
      }
      animations.clear();
    };
  }, []);

  const context = useMemo(() => ({ group, open, settled }), [group, open, settled]);

  return (
    <CollapseContext.Provider value={context}>
      <li
        ref={triggerRef}
        data-slot="breadcrumb-collapse"
        data-variant="expand"
        data-state={open ? "open" : "closed"}
        data-collapsed={open && settled ? "" : undefined}
        data-transitioning={settled ? undefined : ""}
        className="inline-flex shrink-0 items-center data-[collapsed]:hidden"
      >
        <BreadcrumbEllipsis asChild>
          <button
            type="button"
            aria-label={label}
            aria-expanded={open}
            tabIndex={open ? -1 : undefined}
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
