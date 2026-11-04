import { Skeleton, SkeletonText } from "@/registry/ui/skeleton/skeleton";
import { Button } from "@/registry/ui/button/button";
import { bool, defineEntry, num } from "../schema";

// A typical loading card: avatar + two lines. Each block is sized with utilities.
export const skeletonEntry = defineEntry({
  slug: "skeleton",
  name: "Skeleton",
  controls: {},
  render() {
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

export const skeletonTextEntry = defineEntry({
  slug: "skeleton-text",
  name: "Text",
  controls: {
    lines: num(3, { min: 1, max: 10, step: 1, label: "Lines" }),
  },
  render({ lines }) {
    return <SkeletonText lines={lines} className="max-w-sm text-sm" />;
  },
});

/** Skeleton wrapping real content: it takes the content's own size, and shows it once loaded. */
export const skeletonWrapEntry = defineEntry({
  slug: "skeleton-wrap",
  name: "Wrap",
  controls: {
    loading: bool(true, "Loading"),
  },
  render({ loading }) {
    return (
      <div className="flex w-full max-w-sm items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <Skeleton loading={loading}><h3 className="text-sm font-medium">Alex Morgan</h3></Skeleton>
          <Skeleton loading={loading}><p className="text-sm text-muted-foreground">Design engineer</p></Skeleton>
        </div>
        <Skeleton loading={loading}><Button variant="outline" size="sm">Follow</Button></Skeleton>
      </div>
    );
  },
});

export const skeletonInlineEntry = defineEntry({
  slug: "skeleton-inline",
  name: "Inline",
  controls: {
    loading: bool(true, "Loading"),
  },
  render({ loading }) {
    return <p className="text-sm">Your balance is <Skeleton loading={loading} render={<span />}><strong>$12,480.00</strong></Skeleton> as of today.</p>;
  },
});
