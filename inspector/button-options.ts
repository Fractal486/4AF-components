/**
 * The Button family's demo options, in one order, so every button-like demo lists the same
 * variants and sizes the same way. A demo offers everything its component supports; only the
 * starting value differs, and it matches the component's own default.
 */

/** Every Button variant. */
export const BUTTON_VARIANTS = ["primary", "outline", "ghost", "plain", "destructive", "link"] as const;

/**
 * Every Button variant but `link`, for controls built on Button. `link` is inline text; a
 * toggle, a joined group, or a status glyph has nothing to sit in.
 */
export const CONTROL_VARIANTS = ["primary", "outline", "ghost", "plain", "destructive"] as const;

/** The text-button sizes: 24, 30, 34, and 38px tall. */
export const TEXT_SIZES = ["xs", "sm", "md", "lg"] as const;

/** The square icon-button sizes, matching the text sizes' heights. */
export const ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

export type ControlVariant = (typeof CONTROL_VARIANTS)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
