import { Command, CornerDownLeft } from "lucide-react";
import { Kbd, KbdGroup } from "@/registry/ui/kbd/kbd";
import { Button } from "@/registry/ui/button/button";
import { Tooltip } from "@/registry/ui/tooltip/tooltip";
import { bool, defineEntry, select } from "../schema";

export const kbdEntry = defineEntry({
  slug: "kbd",
  name: "Kbd",
  controls: {
    size: select(["sm", "md"], "sm"),
    content: select(["key", "combination", "sequence", "icons"], "combination", "Content"),
    grouped: bool(true, "Separate keycaps", values => values.content === "key" || values.content === "icons"),
    context: select(["standalone", "button", "tooltip"], "standalone", "Context"),
  },
  render: ({ size, content, grouped, context }) => {
    const keys = content === "key" ? "escape" : content === "sequence" ? "mod+k mod+c" : "mod+shift+k";
    const keycaps = content === "icons"
      ? <KbdGroup size={size}>
          <Kbd aria-label="Command"><Command aria-hidden="true" /></Kbd>
          <Kbd aria-label="Enter"><CornerDownLeft aria-hidden="true" className="size-4" /></Kbd>
        </KbdGroup>
      : grouped && content !== "key" ? <KbdGroup size={size} keys={keys} /> : <Kbd size={size} keys={keys} />;
    if (context === "button") return <Button>Shortcut {keycaps}</Button>;
    if (context === "tooltip") return <Tooltip content={<span className="inline-flex items-center gap-2">Shortcut {keycaps}</span>}>
      <Button variant="outline">Show shortcut</Button>
    </Tooltip>;
    return keycaps;
  },
});
