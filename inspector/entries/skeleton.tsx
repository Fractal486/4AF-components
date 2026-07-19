import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { defineEntry } from "../schema";

export const skeletonEntry = defineEntry({
  slug: "skeleton",
  name: "Skeleton",
  controls: {},
  render() {
    // A typical loading card: avatar + two lines. Each block is sized with utilities.
    return (
      <div className="flex w-full max-w-sm items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  },
});
