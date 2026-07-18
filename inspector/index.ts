import { actionButtonEntry } from "./entries/action-button";
import { alertDialogEntry } from "./entries/alert-dialog";
import { buttonEntry } from "./entries/button";
import { checkboxEntry } from "./entries/checkbox";
import { copyButtonEntry } from "./entries/copy-button";
import { dialogEntry } from "./entries/dialog";
import { hoverCardEntry } from "./entries/hover-card";
import { inputEntry } from "./entries/input";
import { morphEntry } from "./entries/morph";
import { popoverEntry } from "./entries/popover";
import { radioEntry } from "./entries/radio";
import { selectEntry } from "./entries/select";
import { selectMotionEntry } from "./entries/select-motion";
import { selectMotionSearchEntry } from "./entries/select-motion-search";
import { selectSearchEntry } from "./entries/select-search";
import { sheetEntry } from "./entries/sheet";
import { sliderEntry } from "./entries/slider";
import { switchEntry } from "./entries/switch";
import { tabsEntry } from "./entries/tabs";
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
      "The action, the toggle that holds a state, the content swap inside them, and the two buttons built from those.",
    entries: [buttonEntry, toggleEntry, morphEntry, copyButtonEntry, actionButtonEntry],
    stacked: true,
  },
  {
    slug: "input",
    name: "Input",
    summary: "A native text field backed by Base UI.",
    entries: [inputEntry],
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
    slug: "select",
    name: "Select",
    summary:
      "A panel of options off a trigger. BaseUI fades a panel in and can check several; BaseUI Search filters as you type and can check several; Motion unfolds one or checks several; Motion Search unfolds from the field and can check several.",
    entries: [selectEntry, selectSearchEntry, selectMotionEntry, selectMotionSearchEntry],
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
    slug: "sheet",
    name: "Sheet",
    summary: "A dialog that slides in from an edge. Focus-trapped, scroll-locked.",
    entries: [sheetEntry],
  },
];

export function getGroup(slug: string): Group | undefined {
  return groups.find((group) => group.slug === slug);
}
