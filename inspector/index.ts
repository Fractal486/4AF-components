import { actionButtonEntry } from "./entries/action-button";
import { alertDialogEntry } from "./entries/alert-dialog";
import { badgeEntry } from "./entries/badge";
import { buttonEntry } from "./entries/button";
import { checkboxEntry } from "./entries/checkbox";
import { commandPaletteEntry } from "./entries/command-palette";
import { copyButtonEntry } from "./entries/copy-button";
import { deleteButtonEntry } from "./entries/delete-button";
import { dialogEntry } from "./entries/dialog";
import { dropdownMenuEntry } from "./entries/dropdown-menu";
import { emptyEntry } from "./entries/empty";
import { fieldErrorEntry } from "./entries/field-error";
import { hoverCardEntry } from "./entries/hover-card";
import { inputEntry } from "./entries/input";
import { morphEntry } from "./entries/morph";
import { popoverEntry } from "./entries/popover";
import { progressEntry } from "./entries/progress";
import { radioEntry } from "./entries/radio";
import { selectEntry } from "./entries/select";
import { selectMotionSearchEntry } from "./entries/select-motion-search";
import { selectSearchEntry } from "./entries/select-search";
import { selectSortEntry } from "./entries/select-sort";
import { skeletonEntry } from "./entries/skeleton";
import { sheetEntry } from "./entries/sheet";
import { sidebarEntry } from "./entries/sidebar";
import { sidebarLayoutEntry } from "./entries/sidebar-layout";
import { sliderEntry } from "./entries/slider";
import { switchEntry } from "./entries/switch";
import { tableOfContentsEntry } from "./entries/table-of-contents";
import { textShimmerEntry } from "./entries/text-shimmer";
import { tabsEntry } from "./entries/tabs";
import { textareaEntry } from "./entries/textarea";
import { toastEntry } from "./entries/toast";
import { toggleEntry } from "./entries/toggle";
import { tooltipEntry } from "./entries/tooltip";
import type { Entry } from "./schema";

/**
 * The index lists *groups*, not entries.
 *
 * Button, Toggle, Morph, Action Button and Copy Button are five separately installable
 * pieces — the two action buttons are built from the others — but they're one family.
 * The sidebar lists them while the main pane shows one at a time.
 *
 * A `stacked` group inverts that: it's one line in the sidebar and one page that renders
 * every entry, full section by full section (title, demo box, settings). Use it when the
 * entries are variations on a single component you want to compare side by side — the
 * Select variations, say — rather than distinct pieces to visit one at a time.
 */
export interface Group {
  slug: string;
  name: string;
  summary: string;
  entries: Entry[];
  stacked?: boolean;
}

export const groups: Group[] = [
  {
    slug: "button",
    name: "Button",
    summary:
      "The action, the toggle that holds a state, the content swap inside them, and the three buttons built from those — one that reports how it went, one that copies, and one that asks before it deletes.",
    entries: [
      buttonEntry,
      toggleEntry,
      morphEntry,
      copyButtonEntry,
      actionButtonEntry,
      deleteButtonEntry,
    ],
    stacked: true,
  },
  {
    slug: "input",
    name: "Input",
    summary: "A native text field backed by Base UI, and the taller textarea that shares its treatment.",
    entries: [inputEntry, textareaEntry, fieldErrorEntry],
    stacked: true,
  },
  {
    slug: "tabs",
    name: "Tabs",
    summary:
      "Base UI behaviour with a travelling indicator. Segment, pill, and underline.",
    entries: [tabsEntry],
  },
  {
    slug: "switch",
    name: "Switch",
    summary: "It slides, and squishes wider while held. Adaptive or fixed thumb.",
    entries: [switchEntry],
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    summary: "The tick draws itself in. Presses on click, not on hover.",
    entries: [checkboxEntry],
  },
  {
    slug: "radio",
    name: "Radio",
    summary: "The Checkbox's sibling — same well, but a single choice with a dot.",
    entries: [radioEntry],
  },
  {
    slug: "slider",
    name: "Slider",
    summary: "A spring-glided thumb — a thin bar or a round knob — that grabs while held.",
    entries: [sliderEntry],
  },
  {
    slug: "progress",
    name: "Progress",
    summary: "A determinate bar whose fill slides on transform, never width.",
    entries: [progressEntry],
  },
  {
    slug: "badge",
    name: "Badge",
    summary: "A status label that rolls its glyph and text over when the status changes.",
    entries: [badgeEntry],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    summary: "A muted placeholder that pulses while content loads. Sized with utilities.",
    entries: [skeletonEntry],
  },
  {
    slug: "empty",
    name: "Empty",
    summary: "An empty state — media, title, description and an action, centred in a placeholder.",
    entries: [emptyEntry],
  },
  {
    slug: "text-shimmer",
    name: "Text Shimmer",
    summary: "A lightweight moving highlight for a label while background work is in progress.",
    entries: [textShimmerEntry],
  },
  {
    slug: "table-of-contents",
    name: "Table of Contents",
    summary: "Headings as a nav that tracks the reader — the active entry lit, a rail marker sliding to it.",
    entries: [tableOfContentsEntry],
  },
  {
    slug: "select",
    name: "Select",
    summary:
      "A panel of options off a trigger. Base UI fades a panel in and can check several; Base UI Search filters as you type and can check several; Motion Search unfolds from the field and can check several; Sort is a compact chip that shows its picks and dashes its border until you choose.",
    entries: [
      selectEntry,
      selectSearchEntry,
      selectMotionSearchEntry,
      selectSortEntry,
    ],
    stacked: true,
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    summary: "Base UI positioning and timing, a CSS scale-and-blur enter.",
    entries: [tooltipEntry],
  },
  {
    slug: "dialog",
    name: "Dialog",
    summary:
      "A modal centred over the page. The plain dialog scales in from a blur and can be phased with step navigation; the alert dialog is its decision-forcing sibling — same surface, but it can't be dismissed by clicking away.",
    entries: [dialogEntry, alertDialogEntry],
    stacked: true,
  },
  {
    slug: "popover",
    name: "Popover",
    summary:
      "An interactive panel anchored to a trigger. Scales in from the trigger edge; not modal unless asked.",
    entries: [popoverEntry],
  },
  {
    slug: "hover-card",
    name: "Hover Card",
    summary:
      "A rich preview of what's behind a link, on hover and focus. Base UI PreviewCard, a CSS scale-and-blur enter.",
    entries: [hoverCardEntry],
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    summary:
      "A menu off a trigger, with a highlight that slides between items. Checkbox and radio items, submenus, shortcuts.",
    entries: [dropdownMenuEntry],
  },
  {
    slug: "command-palette",
    name: "Command Palette",
    summary:
      "The ⌘K overlay. Base UI Autocomplete filtering and keyboard nav inside a focus-trapped Dialog; grouped commands, icons and shortcut hints.",
    entries: [commandPaletteEntry],
  },
  {
    slug: "toast",
    name: "Toast",
    summary:
      "A stacking toast. Collapsed cards fan out on hover and swipe to dismiss — the whole stack is one CSS transform off Base UI's vars.",
    entries: [toastEntry],
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    summary:
      "An application shell: a collapsible nav rail that becomes a drawer on mobile. Groups, sub-menus, badges and row actions, with tooltips once it collapses to icons.",
    entries: [sidebarEntry],
  },
  {
    slug: "sidebar-layout",
    name: "Sidebar Layout",
    summary: "The optional page frame around a Sidebar: inset content, title, and collapse control.",
    entries: [sidebarLayoutEntry],
  },
  {
    slug: "sheet",
    name: "Sheet",
    summary: "A dialog that slides in from an edge. Focus-trapped, scroll-locked.",
    entries: [sheetEntry],
  },
];

export function getGroup(slug: string): Group | undefined {
  return groups.find((group) => group.slug === slug);
}
