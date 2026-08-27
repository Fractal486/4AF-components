"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { Input } from "@/registry/ui/input/input";
import {
  alignedSelectTriggerVariants,
  type AlignedSelectTriggerVariant,
} from "./select-aligned.variants";

/**
 * A select that opens **on** its trigger rather than below it.
 *
 * The default panel takes the trigger's width and is positioned so the selected row lands
 * exactly where the trigger's value was — press it and the current choice doesn't move, the
 * other options simply appear around it. A plain trigger instead lets the panel shrink-wrap to
 * its longest row plus the reserved check slot while keeping that same selected-row alignment.
 * It's the macOS pop-up button, and the reason to reach for it over the plain Select is that it
 * keeps the eye where it already is: nothing travels, so there's nothing to re-find.
 *
 * The positioning is Base UI's `alignItemWithTrigger`, not arithmetic here — which matters
 * for the two cases it handles that hand-rolled maths gets wrong. It applies to **pointer
 * input only**, and it switches itself off when there isn't room to overlap. Both are
 * deliberate: opened from the keyboard there is no pointer to keep still, and a panel
 * clamped against the viewport edge can't honour the alignment anyway. In either case it
 * falls back to an ordinary dropdown rather than fighting for it.
 *
 * The trigger's glyph is `ChevronsUpDown`, and that's the honest signal: a single
 * chevron-down promises the panel appears *below*, which here it doesn't. Two chevrons say
 * the list extends in both directions from where you are.
 *
 * The entrance scales from `--transform-origin`, which Base UI points at the anchor's centre
 * while the panel overlaps it — so the list opens *around* the selected row rather than over
 * it, and the row itself never moves.
 *
 * **The horizontal geometry is load-bearing.** The panel's `p-1` plus a row's `px-2.5`
 * comes to the trigger's `px-3.5`, which is what puts the selected label on top of the
 * trigger's value rather than a few pixels off it. Change one and change the others. The
 * check sits at the *end* of a row for the same reason: a leading check would push every
 * label right and break the alignment the component exists for.
 */

type AlignedSelectSize = "sm" | "md";

const SIZE: Record<AlignedSelectSize, { field: string; row: string; glyph: string }> = {
  sm: { field: "h-8 text-xs", row: "text-xs", glyph: "size-3.5" },
  md: { field: "h-9 text-sm", row: "text-sm", glyph: "size-4" },
};

interface AlignedSelectContextValue {
  size: AlignedSelectSize;
  triggerVariant: AlignedSelectTriggerVariant;
  setTriggerVariant: (variant: AlignedSelectTriggerVariant) => void;
  open: boolean;
  query: string;
  setQuery: (query: string) => void;
  matches: (text: string) => boolean;
  registerOption: (value: unknown, text: string, disabled: boolean) => void;
  unregisterOption: (value: unknown) => void;
  /** Whether any option still passes the query. `false` is what puts up the empty message. */
  hasMatches: boolean;
  /**
   * The row the panel opens ready on: the current selection while the list is whole, the
   * first selectable option once a query narrows it. Boxed so an option valued `null` or
   * `undefined` can still be it, and `null` for "none" — which a query matching only disabled
   * rows can produce.
   */
  openingItem: { value: unknown } | null;
}

const AlignedSelectContext = createContext<AlignedSelectContextValue>({
  size: "sm",
  triggerVariant: "default",
  setTriggerVariant: () => {},
  open: false,
  query: "",
  setQuery: () => {},
  matches: () => true,
  registerOption: () => {},
  unregisterOption: () => {},
  hasMatches: true,
  openingItem: null,
});

/**
 * The row the panel is offering — `data-panel-active`, the same active-row state the other
 * selects, the searchable menu and the palette carry. Provided by the content, because only
 * it knows whether the field still holds the keyboard; read by every option, so the row that
 * looks taken is the row Enter takes.
 */
const AlignedSelectActiveContext = createContext<{ value: unknown } | null>(null);

/** Moves that row, from whichever modality focused it. */
const AlignedSelectActivateContext = createContext<(value: unknown) => void>(() => {});

/** Moves focus out of the search field and into the list, where Base UI's roving takes over. */
function focusEdgeOption(list: HTMLElement | null, edge: "first" | "last") {
  const options = list?.querySelectorAll<HTMLElement>(
    '[role="option"]:not([data-disabled])',
  );
  if (!options?.length) return;
  (edge === "first" ? options[0] : options[options.length - 1])?.focus();
}

// The library's thin scrollbar, shared with the menu, dialog and the other select panels.
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground";

export interface AlignedSelectProps<Value>
  extends ComponentProps<typeof BaseSelect.Root<Value, false>> {
  /** Control height. `md` lines up with Button and Input in a form row. @default sm */
  size?: AlignedSelectSize;
}

interface RegisteredOption {
  text: string;
  disabled: boolean;
}

export function AlignedSelect<Value>({
  size = "sm",
  onOpenChange,
  onOpenChangeComplete,
  value,
  defaultValue,
  onValueChange,
  ...props
}: AlignedSelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [triggerVariant, setTriggerVariant] =
    useState<AlignedSelectTriggerVariant>("default");
  const [options, setOptions] = useState<Map<unknown, RegisteredOption>>(new Map());

  // The same shape the base Select uses: a Map in state whose setter bails out when nothing
  // changed, so an item re-registering its own unchanged text cannot loop.
  const registerOption = useCallback((value: unknown, text: string, disabled: boolean) => {
    setOptions((current) => {
      const existing = current.get(value);
      if (existing?.text === text && existing.disabled === disabled) return current;
      return new Map(current).set(value, { text, disabled });
    });
  }, []);

  const unregisterOption = useCallback((value: unknown) => {
    setOptions((current) => {
      if (!current.has(value)) return current;
      const next = new Map(current);
      next.delete(value);
      return next;
    });
  }, []);

  const matches = useCallback(
    (text: string) => {
      const needle = query.trim().toLocaleLowerCase();
      return needle === "" || text.toLocaleLowerCase().includes(needle);
    },
    [query],
  );

  // Base UI owns the value; this mirrors it only to work out which row the panel opens on.
  const [uncontrolledValue, setUncontrolledValue] = useState<unknown>(() => defaultValue ?? null);
  const selected = value !== undefined ? value : uncontrolledValue;

  // Registration order is mount order, so the first entry that survives the query is the top
  // row of the panel. Disabled rows count towards "the list isn't empty" but can't be offered.
  //
  // A select opens on its own answer: the current selection, which is also the row the panel
  // is physically sitting on. Only once a query narrows the list does the top match take over
  // — by then the selection may not even be in the list, and what was typed is the better
  // guess at what Enter should take.
  const { hasMatches, openingItem } = useMemo(() => {
    const searching = query.trim() !== "";
    let found = false;
    let first: { value: unknown } | null = null;
    let chosen: { value: unknown } | null = null;
    for (const [optionValue, option] of options) {
      if (!matches(option.text)) continue;
      found = true;
      if (option.disabled) continue;
      if (first === null) first = { value: optionValue };
      if (chosen === null && !searching && Object.is(optionValue, selected)) {
        chosen = { value: optionValue };
      }
    }
    return { hasMatches: found, openingItem: chosen ?? first };
  }, [matches, options, query, selected]);

  const context = useMemo<AlignedSelectContextValue>(
    () => ({
      size,
      triggerVariant,
      setTriggerVariant,
      open,
      query,
      setQuery,
      matches,
      registerOption,
      unregisterOption,
      hasMatches,
      openingItem,
    }),
    [
      size,
      triggerVariant,
      open,
      query,
      matches,
      registerOption,
      unregisterOption,
      hasMatches,
      openingItem,
    ],
  );

  return (
    <AlignedSelectContext.Provider value={context}>
      <BaseSelect.Root
        onOpenChange={(next, details) => {
          setOpen(next);
          onOpenChange?.(next, details);
        }}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          setUncontrolledValue(next);
          onValueChange?.(next, details);
        }}
        // A query belongs to one visit to the panel — but it is cleared *after* the exit, not
        // on the way into it. Clearing on close puts every filtered row back first, so the
        // panel springs to full height for a frame and then animates that away.
        onOpenChangeComplete={(next) => {
          if (!next) setQuery("");
          onOpenChangeComplete?.(next);
        }}
        {...props}
      />
    </AlignedSelectContext.Provider>
  );
}

export interface AlignedSelectTriggerProps
  extends Omit<ComponentProps<typeof BaseSelect.Trigger>, "children"> {
  /** Shown until something is selected. */
  placeholder?: ReactNode;
  /** Field by default; `plain` removes the surface, border and horizontal padding. */
  variant?: AlignedSelectTriggerVariant;
  /** @deprecated Use `variant="plain"` or `variant="default"`. */
  outline?: boolean;
}

export function AlignedSelectTrigger({
  className,
  placeholder,
  variant,
  outline,
  ...props
}: AlignedSelectTriggerProps) {
  const { size, setTriggerVariant } = useContext(AlignedSelectContext);
  const resolvedVariant = variant ?? (outline === false ? "plain" : "default");

  useEffect(() => {
    setTriggerVariant(resolvedVariant);
  }, [resolvedVariant, setTriggerVariant]);

  return (
    <BaseSelect.Trigger
      data-slot="aligned-select-trigger"
      data-variant={resolvedVariant}
      className={cn(
        SIZE[size].field,
        alignedSelectTriggerVariants({ variant: resolvedVariant }),
        className,
      )}
      {...props}
    >
      <BaseSelect.Value className="truncate" placeholder={placeholder} />
      {/* Not a rotating chevron: there is no direction to point at, because the panel opens
          where the trigger already is. A static pair reads as "there is more above and
          below this", which is exactly what happens. */}
      <BaseSelect.Icon className="shrink-0 text-muted-foreground">
        <ChevronsUpDown className={SIZE[size].glyph} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export interface AlignedSelectContentProps extends ComponentProps<typeof BaseSelect.Popup> {
  /**
   * `trigger` keeps the panel the trigger's width; `content` sizes it to the longest row plus
   * the reserved check slot. When omitted, this follows the trigger variant: `plain` uses
   * `content`, while `default` uses `trigger`.
   */
  width?: "trigger" | "content";
  /**
   * Pin a search field to the top of the panel and filter the rows as it is typed in.
   *
   * Worth knowing before turning it on: the panel is positioned by the *selected* row, so a
   * pinned header sits that far above the trigger. With a selection deep in a long list the
   * field can end up well up the screen — and where there is no room for that, Base UI drops
   * the overlap and opens an ordinary dropdown instead.
   */
  searchable?: boolean;
  /** Shown in place of the list when a query matches nothing. */
  emptyMessage?: ReactNode;
  /**
   * Make the first row active when a searchable panel opens, so Enter has an answer without
   * an arrow press. Turn it off for menu-like uses. @default true
   */
  autoFocusFirstItem?: boolean;
  /** Names the search field for screen readers. */
  searchLabel?: string;
  /** Placeholder for the search field. */
  searchPlaceholder?: string;
  /** Forwarded to Base UI's positioner (collision padding, sticky, and the rest). */
  positionerProps?: Omit<
    ComponentProps<typeof BaseSelect.Positioner>,
    "className" | "children" | "alignItemWithTrigger"
  >;
}

export function AlignedSelectContent({
  className,
  width: widthProp,
  searchable = false,
  emptyMessage = "No results.",
  autoFocusFirstItem = true,
  searchLabel = "Search options",
  searchPlaceholder = "Search…",
  positionerProps,
  children,
  ...props
}: AlignedSelectContentProps) {
  const { size, open, query, setQuery, hasMatches, openingItem, triggerVariant } =
    useContext(AlignedSelectContext);
  const width = widthProp ?? (triggerVariant === "plain" ? "content" : "trigger");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noResults = searchable && query.trim() !== "" && !hasMatches;

  // The panel owns its active row rather than reading Base UI's highlight, which is the same
  // arrangement the base Select uses and for the same reason: Base UI clears the highlight
  // when the pointer leaves the list, and Select — unlike Combobox — has no `keepHighlight`
  // to turn that off. Reading it would mean the row you last pointed at silently un-marks
  // itself the moment the cursor crosses the panel edge, and the mark snapping back to
  // whatever the panel opened on.
  //
  // The row moves on focus, which covers both modalities: this Select is roving-focus rather
  // than `aria-activedescendant`, so hovering a row focuses it and the arrows focus the next
  // one. Base UI's own highlight lands on the same row whenever it has one, so the two marks
  // can only ever coincide — ours simply outlives it.
  const [pointedItem, setPointedItem] = useState<{ value: unknown } | null>(null);
  const setActiveItem = useCallback((value: unknown) => setPointedItem({ value }), []);

  // A panel never sits with nothing ready: a row is active from the moment it opens, before
  // anything is typed, so Enter always has an answer and the arrows start somewhere visible.
  // See `openingItem` for which row that is. Adjusted during render rather than from an
  // effect — opening the panel and narrowing the list both re-offer a row, and an effect
  // would paint one frame with the previous visit's row still marked.
  const [lastOffered, setLastOffered] = useState(openingItem);
  if (lastOffered !== openingItem) {
    setLastOffered(openingItem);
    setPointedItem(null);
  }
  const activeItem = autoFocusFirstItem ? (pointedItem ?? openingItem) : pointedItem;

  // Base UI opens by focusing the selected row, which is right without a search field and
  // wrong with one — the caret has to be where the typing is going to go.
  useEffect(() => {
    if (!open || !searchable) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        data-slot="aligned-select-positioner"
        // The whole variant, in one prop. Base UI overlaps the trigger and offsets the
        // panel by the selected item's position inside it.
        alignItemWithTrigger
        className={cn(
          "z-50 outline-none",
          width === "trigger" ? "w-[var(--anchor-width)]" : "w-max",
        )}
        {...positionerProps}
      >
        <BaseSelect.Popup
          data-slot="aligned-select-content"
          className={cn(
            "overflow-hidden rounded-md border border-border bg-surface shadow-overlay-drop",
            // Grown out of the selected row, which is the one thing that must not move.
            //
            // Base UI publishes an origin for exactly this case: when the panel overlaps its
            // anchor it sets `--transform-origin` to the anchor's centre expressed *inside*
            // the panel — here, the row sitting on the trigger. Scaling from that point makes
            // the list visibly open around the current choice rather than materialise over
            // it, which is the whole premise of the variant stated in motion instead of by
            // position alone. A centre-origin scale would be wrong, and that difference is
            // the entire reason this reads as anchored.
            //
            // `--duration-base` rather than `fast`: a scale needs a little longer to register
            // than a bare fade, and selects budget 150–250ms.
            "origin-[var(--transform-origin)] blur-0",
            "transition-[opacity,scale,filter] duration-(--duration-base) ease-out",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:blur-[3px]",
            "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:blur-[2px]",
            className,
          )}
          // Base UI hands focus to the popup itself when a query leaves no row to land on.
          // Bounce it back, or the caret leaves the field mid-word.
          onFocus={(event) => {
            if (searchable && event.target === event.currentTarget) inputRef.current?.focus();
          }}
          {...props}
        >
          {searchable && (
            <div className="flex h-[38px] items-center border-b border-border px-3.5">
              <Input
                ref={inputRef}
                aria-label={searchLabel}
                variant="plain"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  // The arrows hand focus to the list and Base UI's roving takes it from
                  // there, so Enter lands on a row that genuinely has focus rather than one
                  // that merely looks highlighted.
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusEdgeOption(listRef.current, event.key === "ArrowDown" ? "first" : "last");
                    return;
                  }
                  // Enter without arrowing first takes the active row — read off the DOM by
                  // the attribute that paints it, so what the user sees offered and what gets
                  // taken can't come apart.
                  if (event.key === "Enter") {
                    const list = listRef.current;
                    const target =
                      list?.querySelector<HTMLElement>('[role="option"][data-panel-active]') ??
                      list?.querySelector<HTMLElement>('[role="option"]:not([data-disabled])');
                    if (target) {
                      event.preventDefault();
                      target.click();
                    }
                    return;
                  }
                  // Keep Select's typeahead from treating the field's keystrokes as option
                  // jumps — it listens on the popup, and without this it swallows the very
                  // characters being typed. Plain typing only: a modifier chord is never
                  // typeahead, and stopping it here would keep app-level shortcuts from
                  // reaching their listener while the field has focus.
                  if (event.key !== "Escape" && !event.metaKey && !event.ctrlKey) {
                    event.stopPropagation();
                  }
                }}
                placeholder={searchPlaceholder}
                className="h-full p-0"
              />
            </div>
          )}

          {/* Base UI needs these once the list is taller than the space it has: overlapping
              the trigger means the panel can't simply grow downward, so it scrolls, and
              these are how a pointer user reaches the ends of it. */}
          <BaseSelect.ScrollUpArrow className="flex h-5 items-center justify-center bg-surface text-muted-foreground">
            <ChevronUp className="size-3.5" />
          </BaseSelect.ScrollUpArrow>

          {/* The overflow belongs to the List, not to a wrapper around it. Base UI takes
              `Select.List || popup` as its scroller and scrolls it so the selected row lands
              on the trigger — with the scroll on a wrapper, the List has nothing to scroll,
              that step silently does nothing, and the panel gives up and opens beside the
              trigger instead. It only shows once the offset is large: a section heading or
              two above the selected row is enough.

              `--available-height` and not a fixed cap, for the same reason. In this mode Base
              UI computes a height for the panel and clears `max-height` on the positioner so
              its own number governs; an 18rem ceiling here would fight it. */}
          <BaseSelect.List
            ref={listRef}
            className={cn(
              "max-h-[var(--available-height)] overflow-y-auto overscroll-contain p-1",
              SCROLLBAR,
              noResults && "hidden",
            )}
          >
            <AlignedSelectActiveContext.Provider value={activeItem}>
              <AlignedSelectActivateContext.Provider value={setActiveItem}>
                {children}
              </AlignedSelectActivateContext.Provider>
            </AlignedSelectActiveContext.Provider>
          </BaseSelect.List>

          {noResults && (
            <div
              // One row tall, exactly — `m-1` mirrors the list's `p-1` and `py-1.5` is the
              // row's own vertical padding. See the note in `select.tsx`.
              className={cn(
                "m-1 flex items-center justify-center px-2.5 py-1.5 text-center text-muted-foreground",
                SIZE[size].row,
              )}
            >
              {emptyMessage}
            </div>
          )}

          <BaseSelect.ScrollDownArrow className="flex h-5 items-center justify-center bg-surface text-muted-foreground">
            <ChevronDown className="size-3.5" />
          </BaseSelect.ScrollDownArrow>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

/**
 * A section of the list. Base UI's own Group, so its label is tied to the options by
 * `aria-labelledby` rather than merely sitting above them.
 *
 * The section hides itself once a search has emptied it — asked of the DOM, because the rows
 * already carry `hidden` and the group is the element that knows which rows are its own.
 * A heading left standing over nothing is worse than no heading.
 */
export function AlignedSelectGroup({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Group>) {
  return (
    <BaseSelect.Group
      data-slot="aligned-select-group"
      className={cn('[&:not(:has([role=option]))]:hidden', className)}
      {...props}
    />
  );
}

/** The dimmed heading over a section, matching the one the command palette's groups use. */
export function AlignedSelectGroupLabel({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return (
    <BaseSelect.GroupLabel
      data-slot="aligned-select-group-label"
      className={cn(
        // 10px, below the type scale's `2xs` floor and deliberately so: at 11px a heading
        // still reads as a peer of a 12px row, and a section label is a caption for the rows
        // rather than one of them. Uppercase would separate it too, but costs legibility at
        // this size.
        //
        // `subtle-foreground` is already the quietest text token, so the last step down is an
        // alpha on it — which composites toward whichever surface it sits on and therefore
        // dims in both themes rather than only one.
        "px-2.5 pt-2 pb-1 text-[10px] font-medium text-subtle-foreground/70",
        className,
      )}
      {...props}
    />
  );
}

export interface AlignedSelectItemProps extends ComponentProps<typeof BaseSelect.Item> {
  /**
   * What the search matches against. Defaults to the row's text, which only works when the
   * children are a plain string — pass it explicitly for a row built out of elements.
   */
  searchValue?: string;
}

export function AlignedSelectItem({
  className,
  children,
  value,
  searchValue,
  disabled = false,
  onFocusCapture,
  ...props
}: AlignedSelectItemProps) {
  const { size, matches, registerOption, unregisterOption } = useContext(AlignedSelectContext);
  const activeItem = useContext(AlignedSelectActiveContext);
  const setActiveItem = useContext(AlignedSelectActivateContext);
  const text = searchValue ?? (typeof children === "string" ? children : String(value));
  const filteredOut = !matches(text);
  const panelActive = activeItem !== null && Object.is(activeItem.value, value);

  useEffect(() => {
    registerOption(value, text, disabled);
    return () => unregisterOption(value);
  }, [registerOption, unregisterOption, value, text, disabled]);

  // Unmounted rather than hidden, and the difference is the panel's height. In aligned mode
  // Base UI measures the list and writes an inline height so the selected row can sit on the
  // trigger — then clears it only when the *composite item map* changes. A hidden row is still
  // in that map, so a search would empty the list and leave the panel its original size, with
  // the rows gone and the space still there. Unmounting changes the map, and Base UI resizes.
  //
  // The component itself stays mounted and keeps registering its text, so a row that a query
  // excluded can come back when the query changes.
  if (filteredOut) return null;

  return (
    <BaseSelect.Item
      data-slot="aligned-select-item"
      value={value}
      disabled={disabled}
      // Base UI's `data-highlighted` belongs to the list's roving focus, which a panel whose
      // keyboard is in the search field never has. `data-panel-active` is the library's own
      // active row — the same attribute the other selects, the searchable menu and the
      // palette carry — wearing the same fill, so "what Enter takes" reads identically
      // wherever the keyboard happens to be.
      data-panel-active={panelActive || undefined}
      // Hover focuses a row here and so do the arrows, so this one handler carries both.
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented) setActiveItem(value);
      }}
      className={cn(
        "flex items-center gap-2 rounded-xs px-2.5 py-1.5 outline-none select-none",
        SIZE[size].row,
        "text-muted-foreground",
        "data-[panel-active]:bg-muted data-[panel-active]:text-foreground",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[selected]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      {/* A reserved slot, occupied or not, so a row's label sits at the same x whether or
          not it is the selected one. */}
      <span className="flex size-3.5 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator className="text-foreground">
          <Check className="size-3.5" />
        </BaseSelect.ItemIndicator>
      </span>
    </BaseSelect.Item>
  );
}
