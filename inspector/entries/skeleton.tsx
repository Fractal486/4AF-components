import { Skeleton, SkeletonText } from "@/registry/ui/skeleton/skeleton";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, num, select } from "../schema";

export const skeletonEntry = defineEntry({
  slug: "skeleton",
  name: "Skeleton",
  controls: {
    preview: select(["block", "text", "wrap", "inline"], "block", "Preview"),
    loading: bool(true, "Loading", (values) => values.preview === "block" || values.preview === "text"),
    lines: num(3, { min: 1, max: 10, step: 1, label: "Lines", disabledWhen: (values) => values.preview !== "text" }),
  },
  render({ preview, loading, lines }) {
    if (preview === "text") {
      return <SkeletonText lines={lines} className="max-w-sm text-sm" />;
    }
    if (preview === "inline") {
      return <p className="text-sm">Your balance is <Skeleton loading={loading} render={<span />}><strong>$12,480.00</strong></Skeleton> as of today.</p>;
    }
    if (preview === "wrap") {
      return <div className="flex w-full max-w-sm items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <Skeleton loading={loading}><h3 className="text-sm font-medium">Alex Morgan</h3></Skeleton>
          <Skeleton loading={loading}><p className="text-sm text-muted-foreground">Design engineer</p></Skeleton>
        </div>
        <Skeleton loading={loading}><Button variant="outline" size="sm">Follow</Button></Skeleton>
      </div>;
    }
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
