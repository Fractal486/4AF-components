import { Folder } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/registry/ui/collapsible/collapsible";
import { bool, defineEntry, select, withIcons } from "../schema";
import { COLLAPSIBLE_ICON_ICONS, COLLAPSIBLE_POSITION_ICONS } from "../setting-icons";

const VARIANTS = ["plain", "card"] as const;

const SECTIONS = [
  {
    title: "What counts as a change?",
    body: "Anything that alters the rendered output — copy, styles, or the data a page reads. Refactors that leave the output identical don't need an entry.",
  },
  {
    title: "How long is a draft kept?",
    body: "Thirty days from the last edit. After that it's removed, and the deletion is logged against the workspace rather than the author.",
  },
] as const;

export const collapsibleEntry = defineEntry({
  slug: "collapsible",
  name: "Collapsible",
  controls: {
    variant: select(VARIANTS, "plain"),
    icon: withIcons(select(["chevron", "folder", "none"] as const, "chevron", "Icon"), COLLAPSIBLE_ICON_ICONS),
    position: withIcons(select(["end", "start"] as const, "end", "Icon position", (values) => values.icon === "none"), COLLAPSIBLE_POSITION_ICONS),
    stacked: bool(true, "Two sections"),
  },
  render({ variant, icon, position, stacked }) {
    const chevron = icon === "none" ? "none" : position;
    const sections = stacked ? SECTIONS : SECTIONS.slice(0, 1);

    return (
      // `self-start` pins the demo to the top of the preview box. The box centres its
      // demo, which is right for a component with a fixed height and wrong for this one:
      // centred, the trigger row drifts up by half the panel as the panel grows down, and
      // the row looks like it's moving when in a real page it wouldn't.
      <div className="flex w-full max-w-md flex-col gap-3 self-start">
        {sections.map((section, index) => (
          <Collapsible key={section.title} variant={variant} defaultOpen={index === 0}
            className={variant === "card" ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
            <CollapsibleTrigger chevron={icon === "chevron" && chevron !== "none" ? chevron : false}>
              {icon === "folder" && chevron === "start" && <CollapsibleTriggerIcon><Folder /></CollapsibleTriggerIcon>}
              {icon === "chevron" && chevron !== "none" ? section.title : <span className="min-w-0 flex-1">{section.title}</span>}
              {icon === "folder" && chevron === "end" && <CollapsibleTriggerIcon><Folder /></CollapsibleTriggerIcon>}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-0">{section.body}</CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    );
  },
});
