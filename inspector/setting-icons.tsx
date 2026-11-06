import type { ReactNode } from "react";
import { NavIcon } from "@/components/site/nav-icons";

/*
 * Two-tone icons for demo settings, shown as the setting's tabs: `side`, and each component's
 * own `orientation`. 16px grid, 1.25 strokes, surfaces at 30%, secondary lines at 40%.
 */

export const FILLED = { fill: "currentColor", fillOpacity: 0.3 } as const;
export const TONE = { fill: "currentColor", fillOpacity: 0.3, stroke: "none" } as const;
export const SOLID = { fill: "currentColor", stroke: "none" } as const;
export const FAINT = { strokeOpacity: 0.4 } as const;

/** Loading, everywhere a setting has it: the Classic Loader's sidebar icon (a still drawing). */
const LOADING = <NavIcon href="/docs/classic-loader" />;

/** `wide` draws on a 32x16 grid at the tab's height, for shapes that read as long lines. */
export function Icon({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <svg viewBox={wide ? "0 0 32 16" : "0 0 16 16"} fill="none" stroke="currentColor" strokeWidth={1.25}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      // `size-auto` opts out of the tab's square icon size; the height still matches it.
      className={wide ? "size-auto h-3.5 w-7" : undefined}>
      {children}
    </svg>
  );
}

/** "None", everywhere a setting has it: a faintly filled circle, struck through. */
export const NONE = <Icon><circle cx="8" cy="8" r="6" {...FILLED} /><path d="M3.75 12.25l8.5-8.5" /></Icon>;

/** Icon content and placement: one solid mark shows where the glyph sits. */
export const ICON_PROP_ICONS: Readonly<Record<string, ReactNode>> = {
  none: NONE,
  leading: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FAINT} /><circle cx="5" cy="8" r="1.5" {...SOLID} /><path d="M8.5 8h3" {...FAINT} /></Icon>,
  trailing: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FAINT} /><path d="M4.5 8h3" {...FAINT} /><circle cx="11" cy="8" r="1.5" {...SOLID} /></Icon>,
  only: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} /><circle cx="8" cy="8" r="2" {...SOLID} /></Icon>,
  default: <Icon><circle cx="8" cy="8" r="6" {...FILLED} /><path d="M8 7.5v3.5" /><circle cx="8" cy="5" r="0.75" {...SOLID} /></Icon>,
  custom: <Icon><path d="M3.5 6a4.5 4.5 0 0 1 9 0v3l1.5 2.5H2L3.5 9Z" {...FILLED} /><path d="M6.5 14h3" /></Icon>,
  icon: <Icon><path d="m8 1.5 2 4.25 4.5.75-3.25 3.25.75 4.75-4-2.25-4 2.25.75-4.75L1.5 6.5 6 5.75Z" {...FILLED} /></Icon>,
  dot: <Icon><circle cx="8" cy="8" r="4.5" {...TONE} /><circle cx="8" cy="8" r="2.25" {...SOLID} /></Icon>,
  pulse: <Icon><circle cx="8" cy="8" r="6.5" {...FAINT} /><circle cx="8" cy="8" r="4.5" {...TONE} /><circle cx="8" cy="8" r="2.25" {...SOLID} /></Icon>,
};

/** Toggle's pressed fill: shade the bookmark, its button surface, or both. */
export const TOGGLE_PRESSED_FILL_ICONS = {
  icon: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" {...FAINT} /><path d="M5 4h6v8l-3-2-3 2Z" {...SOLID} /></Icon>,
  background: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" {...FILLED} /><path d="M5 4h6v8l-3-2-3 2Z" /></Icon>,
  both: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" {...FILLED} /><path d="M5 4h6v8l-3-2-3 2Z" {...SOLID} /></Icon>,
  none: NONE,
} satisfies Record<string, ReactNode>;

const RECTANGULAR_SHAPE = <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FILLED} /><path d="M5.5 8h5" /></Icon>;

/** The same surface and centre mark, with corners matching each shape. */
export const SHAPE_ICONS: Readonly<Record<string, ReactNode>> = {
  rectangular: RECTANGULAR_SHAPE,
  rounded: RECTANGULAR_SHAPE,
  pill: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="4.5" {...FILLED} /><path d="M5.5 8h5" /></Icon>,
};

const FILLED_VARIANT = <Icon><path d="M3.5 3.5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2ZM5 7.25v1.5h6v-1.5Z" fillRule="evenodd" {...SOLID} /></Icon>;
const OUTLINE_VARIANT = <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" /><path d="M5.5 8h5" /></Icon>;

/** Visual treatments shared by the Variant, Style, and Pattern dropdowns. */
export const VARIANT_ICONS: Readonly<Record<string, ReactNode>> = {
  primary: FILLED_VARIANT,
  filled: FILLED_VARIANT,
  default: OUTLINE_VARIANT,
  outline: OUTLINE_VARIANT,
  "outline-ghost": <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FAINT} /><path d="M5.5 8h5" /></Icon>,
  ghost: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...TONE} /><path d="M5.5 8h5" /></Icon>,
  plain: <Icon><path d="M3.5 8h9" /><path d="M5.5 11h5" {...FAINT} /></Icon>,
  destructive: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FILLED} /><path d="m6 6 4 4m0-4-4 4" /></Icon>,
  link: <Icon><path d="M7 9a2.75 2.75 0 0 0 4 0l2-2a2.75 2.75 0 0 0-4-4l-1 1" /><path d="M9 7a2.75 2.75 0 0 0-4 0l-2 2a2.75 2.75 0 0 0 4 4l1-1" {...FAINT} /></Icon>,
  solid: <Icon><rect x="1.5" y="3.5" width="13" height="9" rx="2" {...FILLED} /><path d="M5.5 8h5" /></Icon>,
  card: <Icon><rect x="2.5" y="1.5" width="11" height="11" rx="2" {...FILLED} /><path d="M5.5 7h5" /><path d="M4 14.5h8" {...FAINT} /></Icon>,
  underline: <Icon><path d="M2 12h12" /><path d="M4 5h8M4 8h5" {...FAINT} /></Icon>,
  segment: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FAINT} /><rect x="3" y="6" width="5" height="4" rx="1" {...TONE} /><path d="M4.5 8h2" /><path d="M10.5 8h2" {...FAINT} /></Icon>,
  pill: <Icon><rect x="1.5" y="4.5" width="8" height="7" rx="3.5" {...FILLED} /><path d="M4 8h3" /><path d="M12 8h2.5" {...FAINT} /></Icon>,
  floating: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FAINT} /><rect x="3.5" y="3.5" width="4" height="9" rx="1" {...FILLED} /><path d="M10 5h2M10 8h2" {...FAINT} /></Icon>,
  inset: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...TONE} /><rect x="7" y="3.5" width="5.5" height="9" rx="1" /><path d="M3.5 5h1M3.5 8h1" {...FAINT} /></Icon>,
  span: <Icon><path d="M2.5 2v12M6 4h7M6 8h5M6 12h7" {...FAINT} /><rect x="1.5" y="3" width="2" height="6" rx="1" {...SOLID} /><path d="M6 4h7M6 8h5" /></Icon>,
  single: <Icon><path d="M2.5 2v12M6 8h5M6 12h7" {...FAINT} /><rect x="1.5" y="3" width="2" height="2" rx="1" {...SOLID} /><path d="M6 4h7" /></Icon>,
  scan: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2" {...FAINT} /><path d="M5.5 5v6M10.5 5v6" {...FAINT} /><rect x="1.5" y="6.5" width="13" height="3" rx="1.5" {...TONE} /><path d="M2.5 8h11" /></Icon>,
  twinkle: <Icon><circle cx="3.5" cy="3.5" r="1.5" {...TONE} /><circle cx="12.5" cy="12.5" r="1.5" {...TONE} /><path d="m9.5 2 1.25 3.25L14 6.5l-3.25 1.25L9.5 11 8.25 7.75 5 6.5l3.25-1.25Z" {...FILLED} /><circle cx="3.5" cy="12.5" r="1" {...SOLID} /></Icon>,
};

/** Sidebar's default is a flush panel, rather than an outlined field. */
export const SIDEBAR_VARIANT_ICONS: Readonly<Record<string, ReactNode>> = {
  default: <Icon><path d="M6 2.5H3.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2H6Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M6 2.5v11" /></Icon>,
  floating: VARIANT_ICONS.floating,
  inset: VARIANT_ICONS.inset,
};

/** Size steps share a centre: text sizes grow as bars, icon-only sizes as squares. */
export const SIZE_ICONS: Readonly<Record<string, ReactNode>> = {
  xs: <Icon><rect x="4" y="5.5" width="8" height="5" rx="1.5" {...FILLED} /><path d="M6.5 8h3" /></Icon>,
  sm: <Icon><rect x="3" y="4.5" width="10" height="7" rx="1.75" {...FILLED} /><path d="M6 8h4" /></Icon>,
  md: <Icon><rect x="2" y="3.5" width="12" height="9" rx="2" {...FILLED} /><path d="M5.5 8h5" /></Icon>,
  lg: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FILLED} /><path d="M5 8h6" /></Icon>,
  "icon-xs": <Icon><rect x="5" y="5" width="6" height="6" rx="1.5" {...FILLED} /><circle cx="8" cy="8" r="1" {...SOLID} /></Icon>,
  "icon-sm": <Icon><rect x="4" y="4" width="8" height="8" rx="1.75" {...FILLED} /><circle cx="8" cy="8" r="1.25" {...SOLID} /></Icon>,
  icon: <Icon><rect x="3" y="3" width="10" height="10" rx="2" {...FILLED} /><circle cx="8" cy="8" r="1.5" {...SOLID} /></Icon>,
  "icon-lg": <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" {...FILLED} /><circle cx="8" cy="8" r="2" {...SOLID} /></Icon>,
};

/** Which side of its trigger a popup opens on: the panel, filled, beside the outlined trigger. */
export const ANCHORED_SIDE_ICONS = {
  top: <Icon><rect x="1.5" y="1.5" width="13" height="7.5" rx="2" {...FILLED} /><rect x="5" y="11.5" width="6" height="3" rx="1.5" /></Icon>,
  right: <Icon><rect x="7" y="1.5" width="7.5" height="13" rx="2" {...FILLED} /><rect x="1.5" y="5" width="3" height="6" rx="1.5" /></Icon>,
  bottom: <Icon><rect x="1.5" y="7" width="13" height="7.5" rx="2" {...FILLED} /><rect x="5" y="1.5" width="6" height="3" rx="1.5" /></Icon>,
  left: <Icon><rect x="1.5" y="1.5" width="7.5" height="13" rx="2" {...FILLED} /><rect x="11.5" y="5" width="3" height="6" rx="1.5" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Which screen edge a sheet slides from: a window with that edge's panel shaded. */
export const EDGE_SIDE_ICONS = {
  top: <Icon><path d="M1.5 6.5V4.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M1.5 6.5h13" /></Icon>,
  right: <Icon><path d="M10 2.5h2.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M10 2.5v11" /></Icon>,
  bottom: <Icon><path d="M1.5 9.5v2a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-2Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M1.5 9.5h13" /></Icon>,
  left: <Icon><path d="M6 2.5H3.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2H6Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11" rx="2" /><path d="M6 2.5v11" /></Icon>,
} satisfies Record<string, ReactNode>;

/* Orientation: each component drawn laid out both ways, from its sidebar icon. */

export const BUTTON_GROUP_ORIENTATION_ICONS = {
  horizontal: <Icon><path d="M6 4.5H3.5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2H6Z" {...TONE} /><rect x="1.5" y="4.5" width="13" height="7" rx="2" /><path d="M6 4.5v7M10 4.5v7" /></Icon>,
  vertical: <Icon><path d="M4.5 6V3.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V6Z" {...TONE} /><rect x="4.5" y="1.5" width="7" height="13" rx="2" /><path d="M4.5 6h7M4.5 10h7" /></Icon>,
} satisfies Record<string, ReactNode>;

export const MENUBAR_ORIENTATION_ICONS = {
  horizontal: <Icon><rect x="1.5" y="1.5" width="13" height="3.5" rx="1.5" /><path d="M4 3.25h2" /><path d="M8.5 3.25h2" {...FAINT} /><rect x="1.5" y="6.5" width="8" height="8" rx="2" {...FILLED} /><path d="M4 9h3" /><path d="M4 12h2" {...FAINT} /></Icon>,
  vertical: <Icon><rect x="1.5" y="1.5" width="3.5" height="13" rx="1.5" /><path d="M3.25 4v2" /><path d="M3.25 8.5v2" {...FAINT} /><rect x="6.5" y="1.5" width="8" height="8" rx="2" {...FILLED} /><path d="M9 4h3" /><path d="M9 7h2" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

export const SCROLL_AREA_ORIENTATION_ICONS = {
  vertical: <Icon><rect x="1.5" y="1.5" width="10" height="13" rx="2" /><path d="M4 5h5M4 8h5M4 11h3" {...FAINT} /><path d="M14 2v12" {...FAINT} /><path d="M14 3.5v4" /></Icon>,
  horizontal: <Icon><rect x="1.5" y="1.5" width="13" height="10" rx="2" /><path d="M5 4.5v4M8 4.5v4M11 4.5v4" {...FAINT} /><path d="M2 14h12" {...FAINT} /><path d="M3.5 14h4" /></Icon>,
  both: <Icon><rect x="1.5" y="1.5" width="10" height="10" rx="2" /><path d="M4 4.5h5M4 7.5h5" {...FAINT} /><path d="M14 2v9.5M2 14h9.5" {...FAINT} /><path d="M14 3.5v3.5M3.5 14h3.5" /></Icon>,
} satisfies Record<string, ReactNode>;

export const SEPARATOR_ORIENTATION_ICONS = {
  horizontal: <Icon><path d="M1.5 8h13" /><path d="M4 4.5h8M4 11.5h8" {...FAINT} /></Icon>,
  vertical: <Icon><path d="M8 1.5v13" /><path d="M4.5 4v8M11.5 4v8" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

export const SLIDER_ORIENTATION_ICONS = {
  horizontal: <Icon><path d="M1.5 8h13" {...FAINT} /><path d="M1.5 8H8" /><circle cx="9.5" cy="8" r="2.25" {...SOLID} /></Icon>,
  vertical: <Icon><path d="M8 1.5v13" {...FAINT} /><path d="M8 14.5V8" /><circle cx="8" cy="6.5" r="2.25" {...SOLID} /></Icon>,
} satisfies Record<string, ReactNode>;

export const TABS_ORIENTATION_ICONS = {
  horizontal: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" /><rect x="3" y="6" width="5.5" height="4" rx="1" {...TONE} /><path d="M4.5 8h2.5" /><path d="M10.25 8h2.25" {...FAINT} /></Icon>,
  vertical: <Icon><rect x="3.5" y="1.5" width="9" height="13" rx="2" /><rect x="5" y="3" width="6" height="4" rx="1" {...TONE} /><path d="M6.5 5h3" /><path d="M6.5 9.5h3M6.5 12.5h3" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

/** Which layout an app shell renders: a monitor on its stand, or a phone. Screens shaded. */
export const VIEWPORT_ICONS = {
  desktop: <Icon><rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5" {...FILLED} /><path d="M8 11v2.5M5.5 13.5h5" /></Icon>,
  mobile: <Icon><rect x="4.5" y="1.5" width="7" height="13" rx="1.75" {...FILLED} /><path d="M7 12.5h2" /></Icon>,
} satisfies Record<string, ReactNode>;

/* Alignment: three meanings, three sets. */

/** Where a popup sits along its trigger: the outlined trigger above the filled panel. */
export const ANCHORED_ALIGN_ICONS = {
  start: <Icon><rect x="1.5" y="1.5" width="6" height="3" rx="1.5" /><rect x="1.5" y="7" width="10" height="7.5" rx="2" {...FILLED} /></Icon>,
  center: <Icon><rect x="5" y="1.5" width="6" height="3" rx="1.5" /><rect x="3" y="7" width="10" height="7.5" rx="2" {...FILLED} /></Icon>,
  end: <Icon><rect x="8.5" y="1.5" width="6" height="3" rx="1.5" /><rect x="4.5" y="7" width="10" height="7.5" rx="2" {...FILLED} /></Icon>,
} satisfies Record<string, ReactNode>;

/** Where Separator's label sits on its line: the label, filled, and the line around it. */
export const SEPARATOR_ALIGN_ICONS = {
  start: <Icon><rect x="1.5" y="6" width="5" height="4" rx="2" {...FILLED} /><path d="M9 8h5.5" {...FAINT} /></Icon>,
  center: <Icon><rect x="5.5" y="6" width="5" height="4" rx="2" {...FILLED} /><path d="M1.5 8h1.5M13 8h1.5" {...FAINT} /></Icon>,
  end: <Icon><rect x="9.5" y="6" width="5" height="4" rx="2" {...FILLED} /><path d="M1.5 8H7" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

/** How a column's text lines up: lines of different lengths sharing an edge, or centred. */
export const TEXT_ALIGN_ICONS = {
  start: <Icon><path d="M2 4.5h9" /><path d="M2 8h12M2 11.5h6" {...FAINT} /></Icon>,
  center: <Icon><path d="M3.5 4.5h9" /><path d="M2 8h12M5 11.5h6" {...FAINT} /></Icon>,
  end: <Icon><path d="M5 4.5h9" /><path d="M2 8h12M8 11.5h6" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

/* Collapsible: the trigger's glyph, and which end of the row it sits at. */

export const COLLAPSIBLE_ICON_ICONS = {
  chevron: <Icon><path d="m4 6 4 4 4-4" /></Icon>,
  folder: <Icon><path d="M1.5 4a1 1 0 0 1 1-1h3.25l1.5 1.5h6.25a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1Z" {...FILLED} /></Icon>,
  // No glyph: the shared "none" mark.
  none: NONE,
} satisfies Record<string, ReactNode>;

export const COLLAPSIBLE_POSITION_ICONS = {
  end: <Icon><path d="m10.5 6.75 1.75 1.75L14 6.75" /><path d="M2 7.75h6" /><path d="M2 11.25h4" {...FAINT} /></Icon>,
  start: <Icon><path d="m2 6.75 1.75 1.75L5.5 6.75" /><path d="M8 7.75h6" /><path d="M8 11.25h4" {...FAINT} /></Icon>,
} satisfies Record<string, ReactNode>;

/** Number Animation's formats, as the glyph each one adds or stands for. */
export const NUMBER_FORMAT_ICONS = {
  number: <Icon><path d="M6.5 2.5 5 13.5M11 2.5 9.5 13.5" /><path d="M2.5 6h11M2 10h11" {...FAINT} /></Icon>,
  decimal: <Icon><rect x="1.5" y="3" width="4.5" height="9.5" rx="2.25" /><rect x="10" y="3" width="4.5" height="9.5" rx="2.25" {...FAINT} /><circle cx="8" cy="11.75" r="1" {...SOLID} /></Icon>,
  currency: <Icon><path d="M8 1.5v13" {...FAINT} /><path d="M11 5a2.5 2 0 0 0-2.5-1.75h-1a2.25 2.25 0 0 0 0 4.5h1a2.25 2.25 0 0 1 0 4.5h-1A2.5 2 0 0 1 5 10.5" /></Icon>,
  percent: <Icon><path d="M12.5 3.5 3.5 12.5" /><circle cx="4.5" cy="4.5" r="2" {...FILLED} /><circle cx="11.5" cy="11.5" r="2" {...FILLED} /></Icon>,
} satisfies Record<string, ReactNode>;

/** Badge's statuses, as two-tone versions of the glyphs Badge itself shows; loading is the Classic Loader. */
export const BADGE_STATUS_ICONS = {
  neutral: <Icon><circle cx="8" cy="8" r="6.5" {...FILLED} /></Icon>,
  info: <Icon><circle cx="8" cy="8" r="6.5" {...FILLED} /><path d="M8 7.5v3.75" /><circle cx="8" cy="5" r="0.875" {...SOLID} /></Icon>,
  success: <Icon><circle cx="8" cy="8" r="6.5" {...FILLED} /><path d="m5.25 8.25 1.75 1.75 3.75-4" /></Icon>,
  warning: <Icon><path d="M6.7 2.6a1.5 1.5 0 0 1 2.6 0l5.1 9.15A1.5 1.5 0 0 1 13.1 14H2.9a1.5 1.5 0 0 1-1.3-2.25Z" {...FILLED} /><path d="M8 6v3.25" /><circle cx="8" cy="11.5" r="0.875" {...SOLID} /></Icon>,
  danger: <Icon><path d="M5.4 1.5h5.2l3.9 3.9v5.2l-3.9 3.9H5.4l-3.9-3.9V5.4Z" {...FILLED} /><path d="M8 4.75V8.5" /><circle cx="8" cy="11" r="0.875" {...SOLID} /></Icon>,
  loading: LOADING,
} satisfies Record<string, ReactNode>;

/** Alert's variants: the same glyphs as Badge's statuses, which Alert shares. */
export const ALERT_VARIANT_ICONS = {
  error: BADGE_STATUS_ICONS.danger,
  warning: BADGE_STATUS_ICONS.warning,
  success: BADGE_STATUS_ICONS.success,
  info: BADGE_STATUS_ICONS.info,
  loading: BADGE_STATUS_ICONS.loading,
} satisfies Record<string, ReactNode>;

/** Progress's shapes: a bar part-filled (on the wide grid, so it reads as a line), and a ring. */
export const PROGRESS_SHAPE_ICONS = {
  bar: <Icon wide><rect x="1.5" y="6" width="29" height="4" rx="2" {...TONE} /><rect x="1.5" y="6" width="18" height="4" rx="2" {...SOLID} /></Icon>,
  circle: <Icon><circle cx="8" cy="8" r="6" strokeWidth={2} {...FAINT} /><path d="M8 2a6 6 0 1 1-3.53 10.85" strokeWidth={2} /></Icon>,
} satisfies Record<string, ReactNode>;

/** Slider's value formats: Number Animation's `#` and `$`, and °C for the demo's unit. */
export const SLIDER_FORMAT_ICONS = {
  number: NUMBER_FORMAT_ICONS.number,
  currency: NUMBER_FORMAT_ICONS.currency,
  unit: <Icon><circle cx="3.5" cy="4" r="1.75" {...FAINT} /><path d="M14 5a4 4 0 1 0 0 6" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Checkbox's checked states: an empty box, then a filled box with a check or a dash. */
export const CHECKBOX_CHECKED_ICONS = {
  unchecked: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" /></Icon>,
  checked: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} /><path d="m5.25 8.25 1.75 1.75 3.75-4" /></Icon>,
  indeterminate: <Icon><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" {...FILLED} /><path d="M5.5 8h5" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Input's types, shown beside their names in the Type dropdown. */
export const INPUT_TYPE_ICONS = {
  text: <Icon><path d="M3 3.5h10M8 3.5v9" /><path d="M5.5 12.5h5" {...FAINT} /></Icon>,
  email: <Icon><rect x="1.5" y="3" width="13" height="10" rx="2" {...FILLED} /><path d="m2 4 6 4.5L14 4" /></Icon>,
  password: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" /><circle cx="5" cy="8" r="1" {...SOLID} /><circle cx="8" cy="8" r="1" {...SOLID} /><circle cx="11" cy="8" r="1" {...SOLID} /></Icon>,
  search: <Icon><circle cx="7" cy="7" r="4.75" {...FILLED} /><path d="m10.5 10.5 3.5 3.5" /></Icon>,
  url: <Icon><path d="M7 9a2.83 2.83 0 0 0 4 0l2.17-2.17a2.83 2.83 0 0 0-4-4L8.5 3.5" /><path d="M9 7a2.83 2.83 0 0 0-4 0L2.83 9.17a2.83 2.83 0 0 0 4 4l.67-.67" {...FAINT} /></Icon>,
  number: NUMBER_FORMAT_ICONS.number,
  date: <Icon><path d="M1.5 6.5v-2a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2Z" {...TONE} /><rect x="1.5" y="2.5" width="13" height="11.5" rx="2" /><path d="M5 1.5v2.5M11 1.5v2.5" /><circle cx="10.5" cy="10.25" r="1.25" {...SOLID} /></Icon>,
  time: <Icon><circle cx="8" cy="8" r="6.5" {...FILLED} /><path d="M8 4.5V8l2.5 1.5" /></Icon>,
  file: <Icon><path d="M3.5 1.5h5.5l3.5 3.5v9.5h-9Z" {...FILLED} /><path d="M9 1.5V5h3.5" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Date Picker's sidebar calendar, with a range: two solid days joined by a shaded band. */
export const DATE_RANGE_ICON = (
  <Icon>
    <rect x="2" y="3" width="12" height="11" rx="2" />
    <path d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5" />
    <rect x="3.75" y="8.75" width="8.5" height="3" rx="0.75" {...TONE} />
    <rect x="3.75" y="8.75" width="2.75" height="3" rx="0.75" {...SOLID} />
    <rect x="9.5" y="8.75" width="2.75" height="3" rx="0.75" {...SOLID} />
  </Icon>
);

/*
 * Interactive state, after the Windows 11 cursor concept: the pointer, the pointer with a filled
 * red badge and "x" at its upper right for disabled (the "unavailable" cursor), and for invalid the error state fields wear: a red border
 * inside a faint red ring. Invalid isn't a pointer state, so it has no cursor.
 */
// The Windows 11 cursor concept's pointer: a stubby, tail-less wedge with rounded corners, set
// low and left so the upper right stays clear for the state's red mark.
const POINTER = <path d="M2 4.5 9.5 10.75 6 11.75 2.75 15Z" {...FILLED} />;

export const STATE_ICONS = {
  default: <Icon>{POINTER}</Icon>,
  disabled: (
    <Icon>
      {POINTER}
      {/* The concept's "unavailable" cursor: a large red badge beside the pointer, its ✕ in the
          pointer's own colour. */}
      <circle cx="11.5" cy="4.5" r="4" className="text-destructive" fill="currentColor" stroke="none" />
      <path d="m10.1 3.1 2.8 2.8m0-2.8-2.8 2.8" />
    </Icon>
  ),
  invalid: (
    <Icon>
      {/* The field's red border, and the faint 3px red ring just outside it. */}
      <circle cx="8" cy="8" r="6" className="text-destructive" strokeWidth={2.5} strokeOpacity={0.25} />
      <circle cx="8" cy="8" r="4" className="text-destructive" />
    </Icon>
  ),
} satisfies Record<string, ReactNode>;


/** Button's states: the pointer, the Classic Loader, and the not-allowed pointer. */
export const BUTTON_STATE_ICONS = {
  default: STATE_ICONS.default,
  loading: LOADING,
  disabled: STATE_ICONS.disabled,
} satisfies Record<string, ReactNode>;

/** Action Button's and Action Toggle's statuses: the pointer (a click runs it), the Classic Loader, and Badge's success and danger. */
export const ACTION_STATUS_ICONS = {
  automatic: STATE_ICONS.default,
  pending: LOADING,
  success: BADGE_STATUS_ICONS.success,
  error: BADGE_STATUS_ICONS.danger,
} satisfies Record<string, ReactNode>;

/** Table's states, as the sidebar icons of a table, the Classic Loader, and Empty. */
export const TABLE_STATE_ICONS = {
  default: <NavIcon href="/docs/table" />,
  loading: LOADING,
  empty: <NavIcon href="/docs/empty" />,
} satisfies Record<string, ReactNode>;

/** Scrub Slider's ruler below its label and value, or beside the value in one row. */
export const SCRUB_SLIDER_LAYOUT_ICONS = {
  card: <Icon><rect x="1.5" y="2.5" width="13" height="11" rx="2" {...FILLED} /><path d="M4 5.5h2M10 5.5h2M4 10v1M12 10v1" {...FAINT} /><path d="M8 8.5V11" /></Icon>,
  inline: <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FILLED} /><path d="M4 7v2M6.5 6.5v3M9 7v2" {...FAINT} /><path d="M11.5 8H13" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Scrub Slider's demo quantities: what each one measures, drawn beside its name. */
export const SCRUB_SLIDER_QUANTITY_ICONS = {
  // A span between two edges.
  width: <Icon><path d="M1.5 3.5v9M14.5 3.5v9" {...FAINT} /><path d="M4 6.5h8v3H4Z" {...TONE} /><path d="M4 8h8M6 6 4 8l2 2M10 6l2 2-2 2" /></Icon>,
  // A solid square under a see-through one.
  opacity: <Icon><rect x="1.5" y="1.5" width="8.5" height="8.5" rx="2" {...FILLED} /><rect x="6" y="6" width="8.5" height="8.5" rx="2" {...FAINT} /></Icon>,
  // An angle, its sweep shaded.
  rotation: <Icon><path d="M2 13.5h5.5a5.5 5.5 0 0 0-1.6-3.9Z" {...TONE} /><path d="M2 13.5h12M2 13.5l9-9" /><path d="M7.5 13.5a5.5 5.5 0 0 0-1.6-3.9" {...FAINT} /></Icon>,
  // A square growing toward its corner.
  scale: <Icon><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...FAINT} /><rect x="1.5" y="7.5" width="7" height="7" rx="2" {...FILLED} /><path d="M10 2.5h3.5V6M13.5 2.5 9.5 6.5" /></Icon>,
} satisfies Record<string, ReactNode>;

/** Field's marker conventions: a plain asterisk, a pair of parentheses, and a struck-out circle. */
export const FIELD_MARKER_ICONS = {
  required: <Icon><path d="M8 3v10M3.67 5.5l8.66 5M3.67 10.5l8.66-5" /></Icon>,
  optional: <Icon><path d="M5.5 2.5a8 8 0 0 0 0 11M10.5 2.5a8 8 0 0 1 0 11" /><path d="M7.25 8h1.5" {...FAINT} /></Icon>,
  none: NONE,
} satisfies Record<string, ReactNode>;
