"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
import { BadgeSurface } from "./badge.presence";
import { BadgeClose, BadgeDot, BadgeCount, BadgeContext } from "./badge.parts";
export { BadgeClose, BadgeDot, BadgeCount } from "./badge.parts";
export type { BadgeCloseProps, BadgeDotProps, BadgeCountProps } from "./badge.parts";
import { AlertTriangle, Check, Circle, Info, OctagonAlert } from "lucide-react";
import { useReducedMotion, type HTMLMotionProps } from "motion/react";
import {
  Children,
  useId,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { spring } from "@/registry/lib/motion";
import { Morph } from "@/registry/ui/morph/morph";
import { LoadingIndicator } from "@/registry/lib/loader";
import { badgeVariants, type BadgeVariants } from "./badge.variants";

/**
 * A status badge whose glyph and label morph when they change.
 *
 * On a status or content change the library Morph swaps the outgoing glyph and label for
 * the new ones, while the badge transitions to its new width. This is a real Motion case, not
 * decoration: the outgoing content has to keep animating after React would unmount it,
 * and text width follows Morph's measured `current` sizing, matching Action Button.
 *
 * Under reduced motion the movement is dropped for a plain swap. The shared loading
 * indicator retains its own loop timing, like every other spinner.
 */

const ICON_SIZE = { sm: "size-2.5", md: "size-3", lg: "size-3.5" } as const;

export type BadgeStatus = NonNullable<BadgeVariants["status"]>;
/** Glyphs by status. Missing (or `undefined`) entries fall through; `null` shows no icon. */
export type BadgeIcons = Partial<Record<BadgeStatus, ReactNode>>;

const STATUSES: readonly BadgeStatus[] = ["neutral", "info", "success", "warning", "danger", "loading"];

const BadgeIconsContext = createContext<BadgeIcons>({});

/**
 * Replaces status glyphs for every Badge in a subtree, including its portals. Only the
 * statuses you name change; nested providers layer over the ones above them.
 */
export function BadgeIconsProvider({ icons, children }: { icons: BadgeIcons; children?: ReactNode }) {
  const inherited = useContext(BadgeIconsContext);
  const value = useMemo(() => ({ ...inherited, ...icons }), [inherited, icons]);
  return <BadgeIconsContext.Provider value={value}>{children}</BadgeIconsContext.Provider>;
}

function iconFor(icons: BadgeIcons | undefined, status: BadgeStatus): ReactNode | undefined {
  return icons && status in icons ? icons[status] : undefined;
}

export interface BadgeProps
  // `color` is the legacy HTML attribute on the span; the badge takes the name for its fill.
  extends Omit<HTMLMotionProps<"span">, "children" | "color">,
    BadgeVariants {
  children?: ReactNode;
  /** Overrides the status glyph. Pass `null` with `showIcon` to render text only. */
  icon?: ReactNode;
  /**
   * Replaces the glyph for individual statuses on this badge, e.g. `{ danger: <CircleX /> }`.
   * Statuses not named keep the BadgeIconsProvider's glyph, then the default. `icon` wins
   * over this. For `loading`, an entry here also wins over `loader`.
   */
  icons?: BadgeIcons;
  /**
   * Any CSS colour, replacing the `solid` badge's status fill — e.g. `"oklch(0.7 0.15 250 /
   * 0.15)"` or `"var(--color-accent-500)"`. Used as given, so pass a translucent colour for
   * the default wash look. The text and glyph keep their `status` colour. `solid` only.
   */
  color?: string;
  showIcon?: boolean;
  loader?: ReactNode;
  /**
   * Show a small status-coloured circle on the left instead of the icon — the quiet,
   * dashboard-style indicator (available on every variant). Wins over `icon`/`showIcon`.
   */
  dot?: boolean;
  /** Forces a label roll when the text stays the same object but should re-animate. */
  contentKey?: string | number;
  /**
   * Animate text width with Morph and other size changes with layout projection. Only the
   * badge's own changes animate; a list reordering around it moves it without a slide.
   * @default true
   */
  animateLayout?: boolean;
  /**
   * Let a long label wrap onto as many lines as it needs, the badge capped at its
   * container's width and growing in height, instead of being clipped at the edge. For
   * sentences rather than labels. A wrapping label does not roll when it changes: the
   * roll keeps its text on one line, which is exactly what wrapping cannot have.
   */
  wrap?: boolean;
  /** Keep the label neutral while the icon/dot follows status (plain, solid and outline). */
  neutralText?: boolean;
  pulse?: boolean;
  render?: useRender.RenderProp<{ open: boolean }>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: Collapsible.Root.Props["onOpenChange"];
  onOpenChangeComplete?: (open: boolean) => void;
}

export function Badge({
  variant = "solid",
  status = "neutral",
  size = "sm",
  shape = "rounded",
  children,
  icon,
  icons,
  showIcon = true,
  loader,
  dot = false,
  contentKey,
  animateLayout = true,
  wrap = false,
  color,
  neutralText = false, pulse = false,
  render, ref, open, defaultOpen = true, onOpenChange, onOpenChangeComplete,
  className,
  style,
  ...rest
}: BadgeProps) {
  const reduce = useReducedMotion();
  const labelId = useId();
  const nodes = Children.toArray(children);
  const close = nodes.filter(node => isValidElement(node) && node.type === BadgeClose);
  const customDot = nodes.filter(node => isValidElement(node) && node.type === BadgeDot);
  const label = nodes.filter(node => !close.includes(node) && !customDot.includes(node));
  const textLabel = label.length === 1 && (typeof label[0] === "string" || typeof label[0] === "number") ? label[0] : null;
  const simpleLabel = textLabel !== null;
  const hasCount = label.some(node => isValidElement(node) && node.type === BadgeCount);
  const fitLabel = animateLayout && simpleLabel && !wrap;
  // Through a custom property rather than an inline `background-color`, so the class
  // keeps the badge's own colour transition and a caller's className can still win.
  const customFill = variant === "solid" && color != null && color !== "";
  const resolvedStatus = status ?? "neutral";
  const resolvedSize = size ?? "sm";
  const labelKey = String(
    contentKey ??
      (textLabel ?? resolvedStatus),
  );
  // The badge owns its glyph's geometry, which has to include the caller's. An icon passed
  // in is an `<Icon />` written inline, and a lucide icon with nothing said about its size
  // draws at 24px — several times the badge's own — so it arrived towering over the text.
  // The size goes on first and `cn` lets a caller who really means a different one say so.
  const sized = (glyph: ReactNode): ReactNode =>
    isValidElement<{ className?: string }>(glyph)
      ? cloneElement(glyph as ReactElement<{ className?: string }>, {
          className: cn(ICON_SIZE[resolvedSize], glyph.props.className),
        })
      : glyph;

  const providedIcons = useContext(BadgeIconsContext);
  const sizeClass = ICON_SIZE[resolvedSize];
  const defaults: Record<BadgeStatus, ReactNode> = {
    neutral: <Circle className={sizeClass} />,
    info: <Info className={sizeClass} />,
    success: <Check className={sizeClass} />,
    warning: <AlertTriangle className={sizeClass} />,
    danger: <OctagonAlert className={sizeClass} />,
    loading: <LoadingIndicator className={sizeClass} />,
  };
  // Most specific first: this badge's `icon`, its per-status `icons`, its `loader` (loading
  // only), then the provider's per-status glyph, then the default. Per-badge settings always
  // beat app-wide ones. Every status resolves, so Morph can roll between any two.
  const resolve = (key: BadgeStatus): ReactNode => {
    if (icon != null) return sized(icon);
    const own = iconFor(icons, key);
    if (own !== undefined) return sized(own);
    if (key === "loading" && loader !== undefined) {
      return <LoadingIndicator loader={loader} className={sizeClass} />;
    }
    const provided = iconFor(providedIcons, key);
    if (provided !== undefined) return sized(provided);
    return defaults[key];
  };
  const iconItems = Object.fromEntries(STATUSES.map((key) => [key, resolve(key)])) as Record<
    BadgeStatus,
    ReactNode
  >;

  return (
    <BadgeContext.Provider value={{ labelId }}>
    <Collapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}
      render={(rootProps) => <Collapsible.Panel {...rootProps} render={(panelProps, state) => (
        <BadgeSurface {...panelProps} panelRef={panelProps.ref} ref={ref} state={state} render={render}
          onOpenChangeComplete={onOpenChangeComplete}
          motionProps={{
            layout: animateLayout && !reduce && state.open,
            layoutDependency: `${variant}|${resolvedStatus}|${resolvedSize}|${shape}|${dot}|${showIcon}|${wrap}|${fitLabel ? "fitted-label" : labelKey}`,
            transition: reduce ? { duration: 0 } : spring.snappy,
          }}
          {...rest}
          data-slot="badge" data-variant={variant} data-status={resolvedStatus} data-size={resolvedSize}
          data-shape={shape} data-neutral-text={neutralText ? "" : undefined}
          data-wrap={wrap ? "" : undefined} data-truncate={!wrap ? "" : undefined}
          className={cn(
            badgeVariants({ variant, status, size, shape }),
            customFill && "bg-(--badge-fill)",
            wrap && "h-auto max-w-full items-start py-1 text-left whitespace-normal",
            className,
          )}
          style={(customFill ? { ...style, "--badge-fill": color } : style) as CSSProperties}
          data-color={customFill ? "" : undefined}
        />
      )} />}
    >
      {dot || customDot.length > 0 ? (
        customDot.length ? customDot : <BadgeDot pulse={pulse} className={wrap ? "mt-[calc((1lh_-_0.375rem)/2)]" : undefined} />
      ) : (
        showIcon &&
        icon !== null &&
        iconItems[resolvedStatus] !== null && (
          <span
            aria-hidden
            // One line tall when the label wraps, so the glyph centres on the first line
            // rather than on the whole block.
            data-slot="badge-icon" className={cn("relative z-10 inline-flex shrink-0 items-center justify-center overflow-hidden", wrap && "h-[1lh]")}
          >
            <Morph activeKey={resolvedStatus} items={iconItems} />
          </span>
        )
      )}

      {label.length > 0 && (
        <span id={labelId} data-slot="badge-label" className={cn("relative z-10 min-w-0", wrap ? "block" : "truncate")}>
          {wrap ? (
            <span data-slot="badge-text" className="block min-w-0 break-words">{label}</span>
          ) : !hasCount ? (
            <Morph activeKey={labelKey} sizing={fitLabel ? "current" : "widest"} items={{ [labelKey]: simpleLabel ? textLabel : label }} className="max-w-full [&>span]:block [&>span]:max-w-full [&>span]:truncate" />
          ) : label}
        </span>
      )}
      {close}
    </Collapsible.Root>
    </BadgeContext.Provider>
  );
}
