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

export const emptyEntry = defineEntry({
  slug: "empty",
  name: "Empty",
  controls: {
    media: select(MEDIA, "icon", "Media"),
    bordered: bool(true, "Dashed border"),
  },
  render({ media, bordered }) {
    return (
      <Empty className={bordered ? "w-full max-w-md border" : "w-full max-w-md"}>
        <EmptyHeader>
          <EmptyMedia variant={media}>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyDescription>
            You&apos;re all caught up. New messages will show up here as they arrive.
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
