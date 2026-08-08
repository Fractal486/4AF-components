import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";
import { bool, defineEntry, select } from "../schema";

const VARIANTS = ["plain", "card"] as const;
const CHEVRONS = ["end", "start", "none"] as const;

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
    chevron: select(CHEVRONS, "end"),
    // Two rows are what shows the thing a single one can't: the second section moving
    // the instant the first one opens, rather than being dragged down over 200ms.
    stacked: bool(true, "Two sections"),
  },
  render({ variant, chevron, stacked }) {
    const sections = stacked ? SECTIONS : SECTIONS.slice(0, 1);

    return (
      // `self-start` pins the demo to the top of the preview box. The box centres its
      // demo, which is right for a component with a fixed height and wrong for this one:
      // centred, the trigger row drifts up by half the panel as the panel grows down, and
      // the row looks like it's moving when in a real page it wouldn't.
      <div className="flex w-full max-w-md flex-col gap-3 self-start">
        {sections.map((section, index) => (
          <Collapsible key={section.title} variant={variant} defaultOpen={index === 0}>
            <CollapsibleTrigger chevron={chevron === "none" ? false : chevron}>
              {section.title}
            </CollapsibleTrigger>
            <CollapsibleContent>{section.body}</CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    );
  },
});
