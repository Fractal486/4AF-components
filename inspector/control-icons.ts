import type { ReactNode } from "react";
import type { ControlDef } from "./schema";
import { ICON_PROP_ICONS, SHAPE_ICONS, SIDEBAR_VARIANT_ICONS, SIZE_ICONS, VARIANT_ICONS } from "./setting-icons";
import { SETTING_OPTION_ICONS } from "./setting-option-icons";

const SETTING_ICONS: Readonly<Record<string, Readonly<Record<string, ReactNode>>>> = {
  ...SETTING_OPTION_ICONS,
  Size: SIZE_ICONS,
  Shape: SHAPE_ICONS,
  Icon: ICON_PROP_ICONS,
  Variant: VARIANT_ICONS,
  Style: VARIANT_ICONS,
  Pattern: VARIANT_ICONS,
};

/** Explicit component drawings take precedence over shared setting conventions. */
export function settingIcons(def: Extract<ControlDef, { kind: "select" | "multiselect" }>, label: string) {
  if (def.icons) return def.icons;
  if (label === "Variant" && def.options.includes("floating")) return SIDEBAR_VARIANT_ICONS;
  return SETTING_ICONS[label];
}
