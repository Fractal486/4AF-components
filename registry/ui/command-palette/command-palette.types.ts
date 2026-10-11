import type { Autocomplete } from "@base-ui/react/autocomplete";
import type { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps, MouseEvent as ReactMouseEvent, ReactNode } from "react";

export interface CommandPanelInputProps
  extends Omit<
    ComponentProps<typeof Autocomplete.Input>,
    "className" | "defaultValue" | "onKeyDown" | "value"
  > {
  /** An accessible label for the compact header field. Falls back to the panel title. */
  label?: string;
  /** Use a controlled value for the header field. Omit it for an uncontrolled field. */
  value?: string;
  /** Initial value for an uncontrolled header field. */
  defaultValue?: string;
  /** Optional key handler; Escape clears only `type="search"` fields, otherwise it goes back. */
  onKeyDown?: ComponentProps<"input">["onKeyDown"];
  /** Called with the current value whenever the header field changes. */
  onValueChange?: (value: string) => void;
  /** Optional input styling. The field remains aligned to the standard header geometry. */
  className?: string;
}

export interface CommandItem {
  /** Overrides the palette/provider loader for this item's pending state. */
  loader?: ReactNode;
  /** Stable identity for the item — used as the React key. */
  id: string;
  /** The visible label, what the query ranks against, and where matches are bolded. */
  label: string;
  /** A dimmer second line under the label. */
  description?: string;
  /** An optional leading glyph. A Lucide icon at `size-4` sits right. */
  icon?: ReactNode;
  /** Marks an irreversible action; action menus render it with destructive styling. */
  destructive?: boolean;
  /** Optional trailing content, typically a `Badge`, shown beside the shortcut or chevron. */
  badge?: ReactNode;
  /** A display-only shortcut hint shown trailing, e.g. `⌘P`. */
  shortcut?: string;
  /** An executable key chord for `CommandPanelActions`, e.g. `mod+o`. */
  keybind?: string;
  /** Extra terms the query should match beyond the label ("prefs" → "Settings"). */
  keywords?: string[];
  disabled?: boolean;
  /** Sub-commands. When present, choosing the item drills into them instead of running. */
  items?: CommandItem[];
  /**
   * Drill into a custom panel — a form with its own inputs and buttons — instead of a
   * sub-list. Receives helpers to close, step back, or open another custom panel. Takes
   * precedence over `items`.
   */
  panel?: (helpers: CommandPanelHelpers) => ReactNode;
  /** Render a configurable text field in the custom panel header instead of the panel title. */
  panelInput?: CommandPanelInputProps;
  /** Render arbitrary controls at the right side of this item's header when it opens a page. */
  headerActions?: ReactNode;
  /** Run when a leaf item is chosen (click or Enter). The palette closes around it. */
  onSelect?: () => void;

  /* -- Actions-menu rows. Ignored in the main list; see `CommandPanelActions`. -------- */

  /**
   * Work the row waits on, instead of choosing and closing. The menu stays open so the
   * outcome is visible. Given the state being moved *to* when the row is a toggle.
   *
   * With `checked`/`defaultChecked` it's the dropdown's `DropdownMenuCheckboxItem action`
   * — the row lands in the new state. Without, it's `DropdownMenuActionItem` — the row
   * confirms and reverts.
   */
  action?: (checked: boolean) => void | Promise<unknown>;
  /** Controlled toggle state. With no `action`, the flip is immediate. */
  checked?: boolean;
  /** Uncontrolled starting state. Its presence is what makes the row a toggle. */
  defaultChecked?: boolean;
  /** Called when the checked state changes, after success if an action is provided. */
  onCheckedChange?: (checked: boolean) => void;
  /** Labels for the row's other states. Each falls back to `label`. */
  labels?: { checked?: ReactNode; pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /** Glyphs for the row's other states. Pending and error default to the loader and the
      warning triangle. */
  icons?: { checked?: ReactNode; pending?: ReactNode; success?: ReactNode; error?: ReactNode };
  /**
   * Make the row ask before it runs: the first press arms and morphs it, the second runs
   * `onSelect` and closes the menu like any other row. The menu-row form of
   * `DeleteButton`, and it disarms the same ways — Escape, the menu closing, or a timeout.
   */
  confirm?: {
    /** The armed label. Defaults to "Confirm?". */
    label?: ReactNode;
    /** The armed glyph. Defaults to the row's own icon. */
    icon?: ReactNode;
    /** How long it waits before disarming itself, in ms. `0` never does. @default 3000 */
    resetAfter?: number;
  };
  /** How long an outcome holds before the row returns to rest, in ms. @default 2000 */
  revertAfter?: number;
  /** Hold the loader back this long, so a near-instant action doesn't flash it.
      @default 0 */
  pendingDelay?: number;
}

export interface CommandGroup {
  /** A section heading. Omit for an unlabelled group. */
  heading?: string;
  items: CommandItem[];
}

export interface CommandPanelHeaderOptions {
  /** Render arbitrary controls at the right side of this panel's header. */
  headerActions?: ReactNode;
}

export interface CommandPanelOptions extends CommandPanelHeaderOptions {
  /** The title shown when this panel is opened without a header input. */
  title: string;
  /** Render the panel body and footer. Receives a fresh helper scope for the new depth. */
  panel: (helpers: CommandPanelHelpers) => ReactNode;
  /** Optional configurable input rendered in the new panel's header. */
  panelInput?: CommandPanelInputProps;
}

export interface CommandPanelHelpers {
  /** Close the whole palette — call it once the form is submitted. */
  close: () => void;
  /** Step back to the page that opened the panel, keeping the palette open. */
  back: () => void;
  /** Push another custom panel on top of the current one. */
  openPanel: (options: CommandPanelOptions) => void;
  /** The current value of the custom-panel header field, when it is enabled. */
  query: string;
  /** Alias for `query` that is clearer when the header field is used as a text field. */
  inputValue: string;
  /** Set the custom-panel header field value. Controlled fields still require their owner to update `value`. */
  setInputValue: (value: string) => void;
}

export interface CommandPaletteProps {
  /** Default loader for search indicators, custom panels, and pending actions. */
  loader?: ReactNode;
  groups: CommandGroup[];
  /**
   * Drive the root results from a source instead of filtering `groups` locally — for a
   * server-backed search. Called (debounced) as the query changes; return the groups to
   * show, already ranked, and the palette renders them in that order without a second
   * local pass. A loading indicator shows while the promise is in flight, and stale
   * responses are dropped when a newer keystroke supersedes them (the `signal` aborts too).
   *
   * `groups` still renders whenever the query is empty, so it's the resting state —
   * recents or suggestions — with `onSearch` taking over the moment someone types. Only
   * the root page is affected; drilled-in pages and panels stay local. Omit it entirely
   * and the palette filters `groups` itself, exactly as before.
   */
  onSearch?: (query: string, signal: AbortSignal) => Promise<CommandGroup[]>;
  /** How long to wait after a keystroke before calling `onSearch`, in ms. @default 200 */
  searchDebounce?: number;
  /** Shown in place of the results while `onSearch` is in flight. @default "Searching…" */
  loadingMessage?: ReactNode;
  /**
   * Shown when `onSearch` rejects. Receives the error when supplied as a function.
   * @default "Search failed. Change your query to retry."
   */
  searchErrorMessage?: ReactNode | ((error: unknown) => ReactNode);
  /** Bind ⌘K / Ctrl-K to toggle the palette globally. @default true */
  shortcut?: boolean;
  placeholder?: string;
  /** Shown when the query matches nothing (and there's no create action). */
  emptyMessage?: ReactNode;
  /**
   * Turns a miss into an action: a `Create "<query>"` row appears at the foot of the root
   * page while typing, navigable and runnable like any item.
   */
  onCreate?: (query: string) => void;
  /**
   * Show the ↑↓ / ↵ / esc hint bar under the command list. Panel pages carry their own
   * bar instead — see `CommandPanelFooter`. @default true
   */
  footer?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Open straight into this item's panel or sub-list instead of the root list — for a
   * shortcut that summons one page of the palette (`?` for a help page, say). Read each time
   * the palette opens. Escape and Back then close the palette rather than revealing a root
   * list nobody asked for.
   */
  initialItemId?: string | null;
  className?: string;
}

export interface UseCommandSearchOptions {
  /** Wait this long after a keystroke before calling `onSearch`, in ms. @default 200 */
  debounce?: number;
  /** Enable search for the active panel; set false for inactive panels. @default true */
  enabled?: boolean;
  /** Keep the panel header loader on for an additional async operation, such as pagination. */
  additionalRefreshing?: boolean;
}

export interface CommandPanelRowProps
  extends Omit<
    ComponentProps<"div">,
    "children" | "onClick" | "onKeyDown" | "onPointerDown" | "onMouseMoveCapture"
  > {
  /** A stable value used by Base UI's keyboard navigation. Defaults to the row label. */
  value?: string;
  /** A leading icon rendered in the standard 16px palette icon slot. */
  icon?: ReactNode;
  /** Marks an irreversible row action; its label and icon use the destructive color. */
  destructive?: boolean;
  children?: ReactNode;
  /** Optional trailing content, typically a `Badge`, aligned with the checkbox slot. */
  badge?: ReactNode;
  /** Persistent selection state shown by the optional checkbox indicator. */
  selected?: boolean;
  /** Select the row when it is clicked or activated with Enter/Space. */
  onSelect?: () => void;
  /** Observe the activation event when a caller needs to distinguish keyboard activation. */
  onActivate?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Show a trailing checkbox indicator for the row's selection state. */
  checkbox?: boolean;
  onKeyDown?: ComponentProps<"div">["onKeyDown"];
}

/** The action bar for a panel page — see `CommandPanelBody` for the expected structure. */
export interface CommandPanelFooterProps {
  className?: string;
  /**
   * The panel's primary action — the one Enter runs. Its key chip is always the return
   * glyph: the bar describes the keyboard rather than configuring it, and a footer claiming
   * some other key would be describing a binding the panel does not have.
   */
  enter?: {
    label: ReactNode;
    onClick?: () => void;
    /** `"submit"` submits the containing form. A supplied `onClick` also runs. @default "button" */
    type?: "button" | "submit";
    disabled?: boolean;
  };
  /** The contextual actions menu, opened with a fixed Cmd/Ctrl + J. */
  actions?: CommandPanelActionsProps;
}

export interface CommandPanelActionsProps {
  /** A flat list of contextual actions. Kept for the simple menu form. */
  items?: CommandItem[];
  /** Grouped contextual actions. Group headings become section labels in the menu. */
  groups?: CommandGroup[];
  /** Trigger label. @default "Actions" */
  label?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
}

/**
 * Tabs inside a custom panel. The root wraps everything below the header.
 * Tab / Shift+Tab cycle enabled tabs in the palette without moving focus.
 */
export interface CommandPanelTabsProps
  extends Omit<ComponentProps<typeof BaseTabs.Root>, "className" | "orientation"> {
  className?: string;
}

export interface CommandPanelTabListProps
  extends Omit<ComponentProps<typeof BaseTabs.List>, "className"> {
  /**
   * How the selected tab is marked. `fill` slides a muted fill behind it; `underline` slides
   * a hairline along the rule under the row. @default "fill"
   */
  variant?: "fill" | "underline";
  /** Select a tab as the arrow keys reach it, rather than on Enter. @default true */
  activateOnFocus?: boolean;
  className?: string;
}

export interface CommandPanelTabProps
  extends Omit<ComponentProps<typeof BaseTabs.Tab>, "className"> {
  className?: string;
}

export interface CommandPanelTabPanelProps
  extends Omit<ComponentProps<typeof BaseTabs.Panel>, "className"> {
  className?: string;
}
