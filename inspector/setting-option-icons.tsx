import type { ReactNode } from "react";
import { NavIcon } from "@/components/site/nav-icons";
import {
  Icon, FILLED, TONE, SOLID, FAINT, NONE,
  BADGE_STATUS_ICONS, CHECKBOX_CHECKED_ICONS, DATE_RANGE_ICON,
  ICON_PROP_ICONS, INPUT_TYPE_ICONS, NUMBER_FORMAT_ICONS,
  SIDEBAR_VARIANT_ICONS, STATE_ICONS, VARIANT_ICONS,
} from "./setting-icons";

// Shared subjects keep the same silhouette wherever an option has the same meaning.
const TEXT = <Icon><path d="M2.5 5h11" /><path d="M2.5 8h8M2.5 11h5" {...FAINT} /></Icon>;
const ANIMATED_NUMBER = <Icon><path d="M5 4.5 3 6V12M1.5 12h3" /><path d="M8 12h6M8 9h3" {...FAINT} /><path d="M11 7V2M8.5 4.5 11 2l2.5 2.5" /></Icon>;
const INPUT = <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FILLED} /><path d="M5 6.5v3" /><path d="M8 8h3" {...FAINT} /></Icon>;
const TEXTAREA = <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FILLED} /><path d="M4 5h7" /><path d="M4 8h5M4 11h3" {...FAINT} /></Icon>;
const EYE = <Icon><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" {...FILLED} /><circle cx="8" cy="8" r="2" {...SOLID} /></Icon>;
const HOVER = <Icon><path d="M2 3h10M2 6h5" {...FAINT} /><path d="m7 7 6 4-3 1-1 3Z" {...FILLED} /></Icon>;
const UP = <Icon><path d="M8 14V2M3.5 6.5 8 2l4.5 4.5" /><path d="M3 11h10" {...FAINT} /></Icon>;
const DOWN = <Icon><path d="M8 2v12M3.5 9.5 8 14l4.5-4.5" /><path d="M3 5h10" {...FAINT} /></Icon>;
const PLAY = <Icon><circle cx="8" cy="8" r="6.5" {...FAINT} /><path d="m6 4.5 5.5 3.5L6 11.5Z" {...SOLID} /></Icon>;
const WIDTH_ICONS = {
  widest: <Icon><path d="M1.5 3v10M14.5 3v10" {...FAINT} /><rect x="3.5" y="5.5" width="9" height="5" rx="1.5" {...FILLED} /><path d="M6 8h4" /></Icon>,
  current: <Icon><path d="M1.5 3v10M14.5 3v10" {...FAINT} /><rect x="5.5" y="5.5" width="5" height="5" rx="1.5" {...FILLED} /><path d="M7.5 8h1" /></Icon>,
};
const FOCUS_ICONS = {
  neutral: <Icon><rect x="2.5" y="4" width="11" height="8" rx="2" {...FAINT} /><path d="M5.5 8h5" /></Icon>,
  accent: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="3" {...TONE} /><rect x="3.5" y="4.5" width="9" height="7" rx="1.5" /><path d="M6 8h4" /></Icon>,
};
const LABEL_ICONS = { none: NONE, text: TEXT, label: TEXT, icon: ICON_PROP_ICONS.icon };
const CONTENT_ICONS = {
  label: TEXT,
  count: NUMBER_FORMAT_ICONS.number,
  animatedCount: ANIMATED_NUMBER,
  short: <Icon><rect x="2.5" y="4.5" width="11" height="7" rx="2" {...FILLED} /><path d="M5 8h6" /></Icon>,
  long: TEXTAREA,
  phased: <Icon><rect x="1.5" y="2.5" width="9" height="9" rx="2" {...FILLED} /><path d="M5.5 14h7a2 2 0 0 0 2-2V6" {...FAINT} /><path d="M4 7h4" /></Icon>,
  key: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} /><path d="M6 5v6M10 5 6 8l4 3" /></Icon>,
  combination: <Icon><rect x="1.5" y="4.5" width="5" height="7" rx="1.5" {...FILLED} /><rect x="9.5" y="4.5" width="5" height="7" rx="1.5" /><path d="M4 7v2M11 8h2" /></Icon>,
  sequence: <Icon><rect x="1.5" y="2" width="5" height="5" rx="1.5" {...FILLED} /><rect x="9.5" y="9" width="5" height="5" rx="1.5" {...FAINT} /><path d="M9 4.5h3v2M3.5 9.5v2h3" /></Icon>,
  icons: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FILLED} /><path d="M5 6v4M3 8h4M10 6v3h2M10 9l1.5-1.5M10 9l1.5 1.5" /></Icon>,
};
const LAYOUT_ICONS = {
  single: <Icon><path d="M2 3h5" {...FAINT} /><rect x="1.5" y="6.5" width="13" height="7" rx="2" {...FILLED} /><path d="M4.5 10h5" /></Icon>,
  horizontal: <Icon><path d="M1.5 8h3" {...FAINT} /><rect x="7" y="4.5" width="7.5" height="7" rx="2" {...FILLED} /><path d="M9.5 8H12" /></Icon>,
  fieldset: <Icon><path d="M3 2.5H1.5v12h13v-12H13M6 2.5h4" {...FAINT} /><rect x="4" y="5.5" width="8" height="3" rx="1" {...FILLED} /><path d="M4.5 11.5h7" /></Icon>,
  default: SIDEBAR_VARIANT_ICONS.default,
  split: <Icon><path d="M1.5 2.5H8v11H1.5Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M4.5 2.5v11M8 2.5v11" /></Icon>,
};
const COLOR_ICONS = {
  foreground: <Icon><circle cx="8" cy="8" r="5.5" {...SOLID} /><path d="M3 14.5h10" {...FAINT} /></Icon>,
  muted: <Icon><circle cx="8" cy="8" r="5.5" {...TONE} /><path d="M3 14.5h10" {...FAINT} /></Icon>,
  neutral: <Icon><circle cx="8" cy="8" r="6" /><path d="M8 2a6 6 0 0 0 0 12Z" {...TONE} /></Icon>,
  accent: <Icon><circle cx="8" cy="8" r="6" {...FILLED} /><path d="M8 4.5v7M4.5 8h7" /></Icon>,
  colored: <Icon><circle cx="6" cy="6" r="4.5" {...FILLED} /><circle cx="10" cy="10" r="4.5" {...FAINT} /></Icon>,
};

/** Remaining dropdown families. Only semantically equivalent choices share drawings. */
export const SETTING_OPTION_ICONS: Readonly<Record<string, Readonly<Record<string, ReactNode>>>> = {
  "Pending content": { label: TEXT, icon: BADGE_STATUS_ICONS.loading },
  Width: WIDTH_ICONS,
  "Label sizing": WIDTH_ICONS,
  Action: {
    instant: <Icon><path d="m9 1.5-6.5 7H7l-1 6 7.5-8H9Z" {...FILLED} /></Icon>,
    async: BADGE_STATUS_ICONS.loading,
    failing: BADGE_STATUS_ICONS.danger,
  },
  "Long labels": {
    truncate: <Icon><path d="M2 5h9M2 9h4" /><path d="M14 2.5v11" {...FAINT} /><circle cx="9" cy="9" r="0.75" {...SOLID} /><circle cx="11.5" cy="9" r="0.75" {...SOLID} /></Icon>,
    wrap: <Icon><path d="M2 4.5h12M2 8h8.5a2 2 0 0 1 0 4H7M9 10l-2 2 2 2" /><path d="M2 12h2" {...FAINT} /></Icon>,
  },
  Interactive: {
    none: NONE,
    button: STATE_ICONS.default,
    link: VARIANT_ICONS.link,
    removable: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="3.5" {...FILLED} /><path d="m9.5 6.5 3 3m0-3-3 3" /><path d="M4 8h2" {...FAINT} /></Icon>,
  },
  Content: CONTENT_ICONS,
  "Animate by": {
    character: <Icon><rect x="1.5" y="2" width="8" height="12" rx="2" {...TONE} /><path d="m3 11 2.5-6 2.5 6M4 9h3" /><path d="M12 5h2M12 8h2M12 11h2" {...FAINT} /></Icon>,
    word: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...TONE} /><path d="M4 8h8" /><path d="M4 13.5h8" {...FAINT} /></Icon>,
  },
  Color: COLOR_ICONS,
  Target: {
    area: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FILLED} /><path d="M6 8h4M8 6v4" /></Icon>,
    rows: <Icon><rect x="1.5" y="6" width="13" height="4" rx="1" {...TONE} /><path d="M3 3h10M3 13h10" {...FAINT} /><path d="M3 8h10" /></Icon>,
  },
  Lines: {
    horizontal: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FAINT} /><path d="M1.5 6h13M1.5 10h13" /><path d="M6 2.5v11" {...FAINT} /></Icon>,
    vertical: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FAINT} /><path d="M6 2.5v11M10 2.5v11" /><path d="M1.5 8h13" {...FAINT} /></Icon>,
    outline: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M6 2.5v11M1.5 6h13M1.5 10h13" {...FAINT} /></Icon>,
  },
  Toolbar: {
    search: INPUT_TYPE_ICONS.search,
    filter: <Icon><path d="M1.5 2.5h13L9.5 8v4.5l-3 1V8Z" {...FILLED} /></Icon>,
    columns: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M6 2.5h4v11H6Z" {...TONE} /><path d="M6 2.5v11M10 2.5v11" /></Icon>,
  },
  Selection: {
    none: NONE,
    checkbox: CHECKBOX_CHECKED_ICONS.checked,
    actionRow: <Icon><rect x="1.5" y="9.5" width="13" height="4" rx="1.5" {...FILLED} /><path d="M3 3h10M3 6h7" {...FAINT} /><path d="M4 11.5h2M10 11.5h2" /></Icon>,
  },
  Mode: {
    single: INPUT_TYPE_ICONS.date,
    multiple: <Icon><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5" /><circle cx="5.5" cy="9.5" r="1.25" {...SOLID} /><circle cx="10.5" cy="11.5" r="1.25" {...SOLID} /></Icon>,
    range: DATE_RANGE_ICON,
  },
  "Open border": FOCUS_ICONS,
  "Focus tone": FOCUS_ICONS,
  Focus: FOCUS_ICONS,
  Format: {
    medium: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FILLED} /><path d="M1.5 6h13" {...FAINT} /><path d="M4 9.5h8" /></Icon>,
    numeric: <Icon><path d="M6.5 3 3.5 13M12.5 3l-3 10" {...FAINT} /><path d="M2 6v3M8 6v3M14 6v3" /></Icon>,
  },
  Media: {
    icon: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" {...FILLED} /><path d="M4 6h8v5H4ZM4 6l2 3h4l2-3" /></Icon>,
    default: <Icon><path d="m1.5 9 2-5h9l2 5v4h-13ZM1.5 9h4l1 2h3l1-2h4" {...FILLED} /></Icon>,
  },
  Layout: LAYOUT_ICONS,
  Control: { input: INPUT, textarea: TEXTAREA },
  Error: {
    none: NONE,
    message: <Icon><circle cx="3" cy="8" r="1.5" {...SOLID} /><path d="M7 8h7" /><path d="M7 11h4" {...FAINT} /></Icon>,
    list: <Icon><circle cx="3" cy="4" r="1" {...SOLID} /><path d="M6 4h8" /><path d="M2 8h2M6 8h6M2 12h2M6 12h8" {...FAINT} /></Icon>,
  },
  "Trailing action": LABEL_ICONS,
  Context: {
    standalone: CONTENT_ICONS.key,
    button: <NavIcon href="/docs/button" />,
    tooltip: <NavIcon href="/docs/tooltip" />,
  },
  Disabled: {
    none: NONE,
    menu: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FAINT} /><rect x="3.5" y="6" width="4" height="4" rx="1" {...TONE} /><path d="m4 9.5 3-3" /><path d="M10 8h2" {...FAINT} /></Icon>,
    bar: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...TONE} /><path d="M4 8h2M10 8h2" {...FAINT} /><path d="m3 13 10-10" /></Icon>,
  },
  Direction: {
    auto: <Icon><path d="M4.5 13V3M2 5.5 4.5 3 7 5.5" /><path d="M11.5 3v10M9 10.5l2.5 2.5 2.5-2.5" {...FAINT} /></Icon>,
    up: UP,
    down: DOWN,
    shortest: <Icon><path d="M2 2.5v11M14 2.5v11" {...FAINT} /><path d="M5 8h6M7 6 5 8l2 2M9 6l2 2-2 2" /></Icon>,
  },
  "Value label": { hidden: NONE, static: NUMBER_FORMAT_ICONS.number, animated: ANIMATED_NUMBER },
  Scrollbar: {
    auto: <Icon><rect x="1.5" y="1.5" width="10" height="13" rx="2" /><path d="M4 5h5M4 8h3M14 2v12" {...FAINT} /><path d="M14 5v4" strokeDasharray="1 2" /></Icon>,
    always: <Icon><rect x="1.5" y="1.5" width="10" height="13" rx="2" /><path d="M4 5h5M4 8h3M14 2v12" {...FAINT} /><path d="M14 5v4" /></Icon>,
  },
  Label: LABEL_ICONS,
  Collapsible: {
    offcanvas: <Icon><path d="M6 2.5h6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6" {...FAINT} /><path d="M6 2.5v11" /><path d="M1.5 8h9M4 5.5 1.5 8 4 10.5" /></Icon>,
    icon: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FAINT} /><path d="M6 1.5v13" /><rect x="2.5" y="3.5" width="2.5" height="2.5" rx="0.75" {...SOLID} /><rect x="2.5" y="9" width="2.5" height="2.5" rx="0.75" {...TONE} /></Icon>,
    none: NONE,
  },
  "Header content": {
    title: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FAINT} /><path d="M1.5 7h13" {...FAINT} /><path d="M4 4.75h7" /></Icon>,
    custom: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FAINT} /><path d="M1.5 7h13" {...FAINT} /><rect x="3" y="3.75" width="2.5" height="2" rx="0.75" {...SOLID} /><path d="M8 4.75h4" /></Icon>,
  },
  Appearance: {
    default: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...TONE} /><rect x="3" y="6" width="5" height="4" rx="1" /><path d="M10 8h2" {...FAINT} /></Icon>,
    solid: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...TONE} /><rect x="3" y="6" width="5" height="4" rx="1" {...SOLID} /><path d="M10 8h2" {...FAINT} /></Icon>,
    outline: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FAINT} /><rect x="3" y="6" width="5" height="4" rx="1" /><path d="M10 8h2" {...FAINT} /></Icon>,
  },
  Tone: {
    adaptive: <Icon><circle cx="8" cy="8" r="6" /><path d="M8 2a6 6 0 0 0 0 12Z" {...TONE} /><path d="M8 2v12" /></Icon>,
    fixed: <Icon><circle cx="8" cy="8" r="6" {...TONE} /><circle cx="8" cy="8" r="3" {...SOLID} /></Icon>,
  },
  Saving: { off: NONE, success: BADGE_STATUS_ICONS.success, failure: BADGE_STATUS_ICONS.danger },
  Labels: { always: EYE, hover: HOVER },
  Shimmer: {
    loop: <Icon><path d="M13.5 6a5.5 5.5 0 0 0-9-2L2 6.5M2 3v3.5h3.5" /><path d="M2.5 10a5.5 5.5 0 0 0 9 2l2.5-2.5M14 13V9.5h-3.5" {...FAINT} /></Icon>,
    once: PLAY,
    off: NONE,
  },
  Height: {
    grow: <Icon><rect x="1.5" y="5.5" width="8" height="9" rx="2" {...TONE} /><path d="M3 8h5M3 11h3" {...FAINT} /><path d="M12 13V2M9.5 4.5 12 2l2.5 2.5" /></Icon>,
    resizable: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FAINT} /><path d="M8 12.5 12.5 8M11 12.5l1.5-1.5" /><path d="M4 5h5" {...FAINT} /></Icon>,
    fixed: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FILLED} /><path d="M5 8h6" /><path d="M4 1.5h8M4 14.5h8" {...FAINT} /></Icon>,
  },
  "Follow cursor": {
    none: NONE,
    x: <Icon><path d="M2 8h12M4.5 5.5 2 8l2.5 2.5M11.5 5.5 14 8l-2.5 2.5" /><path d="M8 2v2M8 12v2" {...FAINT} /></Icon>,
    y: <Icon><path d="M8 2v12M5.5 4.5 8 2l2.5 2.5M5.5 11.5 8 14l2.5-2.5" /><path d="M2 8h2M12 8h2" {...FAINT} /></Icon>,
    both: <Icon><path d="M2 8h12M4 6 2 8l2 2M12 6l2 2-2 2" {...FAINT} /><path d="M8 2v12M6 4l2-2 2 2M6 12l2 2 2-2" /></Icon>,
  },
};
