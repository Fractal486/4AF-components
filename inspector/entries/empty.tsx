import { Inbox, Plus } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/ui/empty/empty";
import { bool, defineEntry, select } from "../schema";

const MEDIA = ["icon", "default"] as const;
const SIZES = ["sm", "md"] as const;

export const emptyEntry = defineEntry({
  slug: "empty",
  name: "Empty",
  controls: {
    size: select(SIZES, "md", "Size"),
    media: select(MEDIA, "icon", "Media"),
    bordered: bool(true, "Dashed border"),
    animated: bool(true, "Entrance animation"),
  },
  render({ size, media, bordered, animated }) {
    return (
      <Empty
        size={size}
        animated={animated}
        className={`w-full ${size === "sm" ? "max-w-sm" : "max-w-md"} ${bordered ? "border" : ""}`}
      >
        <EmptyHeader>
          <EmptyMedia variant={media}>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle render={<h2 />}>No messages yet</EmptyTitle>
          <EmptyDescription>
            New messages will appear here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <Plus />
            Compose
          </Button>
        </EmptyContent>
      </Empty>
    );
  },
});
