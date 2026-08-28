"use client";

import { useState } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import {
  Table,
  type TableSort,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";
import { bool, defineEntry, select } from "../schema";

const SIZES = ["sm", "md"] as const;

const RELEASES = [
  { id: "4.2.0", version: "4.2.0", channel: "stable", downloads: 18_204, published: "12 Mar" },
  { id: "4.2.0-rc.1", version: "4.2.0-rc.1", channel: "preview", downloads: 942, published: "5 Mar" },
  { id: "4.1.3", version: "4.1.3", channel: "stable", downloads: 26_781, published: "18 Feb" },
  { id: "4.1.2", version: "4.1.2", channel: "stable", downloads: 9_310, published: "2 Feb" },
  { id: "4.1.1", version: "4.1.1", channel: "stable", downloads: 14_502, published: "21 Jan" },
  { id: "4.1.0", version: "4.1.0", channel: "stable", downloads: 31_044, published: "9 Jan" },
  { id: "4.1.0-beta.2", version: "4.1.0-beta.2", channel: "preview", downloads: 610, published: "2 Jan" },
  { id: "4.0.7", version: "4.0.7", channel: "stable", downloads: 22_118, published: "14 Dec" },
] as const;

const NUMBER = new Intl.NumberFormat("en-GB");

type Release = (typeof RELEASES)[number];

/**
 * What each sortable column is worth, per row. The table owns the control and the state; the
 * rows are the demo's to order, because only the demo knows that "18,204" is a number and
 * "18 Feb" is a date rather than the string it is printed as.
 */
const SORT_VALUES: Record<string, (release: Release) => string | number> = {
  version: (release) => release.version,
  channel: (release) => release.channel,
  downloads: (release) => release.downloads,
  published: (release) => RELEASES.findIndex((entry) => entry.id === release.id),
};

function sorted(releases: readonly Release[], sort: TableSort | null): readonly Release[] {
  if (!sort) return releases;

  const value = SORT_VALUES[sort.column];
  if (!value) return releases;

  const direction = sort.direction === "asc" ? 1 : -1;
  return [...releases].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }
    return String(left).localeCompare(String(right)) * direction;
  });
}

export const tableEntry = defineEntry({
  slug: "table",
  name: "Table",
  controls: {
    size: select(SIZES, "md"),
    selectable: bool(true, "Checkbox column"),
    selectionBar: bool(true, "Selection action row"),
    bordered: bool(false, "Grid lines"),
    scroll: bool(true, "Bounded height"),
    loading: bool(false, "Loading"),
    footer: bool(false, "Footer"),
    caption: bool(true, "Caption"),
  },
  render({ size, selectable, selectionBar, bordered, scroll, loading, footer, caption }) {
    return (
      <TableDemo
        size={size}
        selectable={selectable}
        selectionBar={selectionBar}
        bordered={bordered}
        scroll={scroll}
        loading={loading}
        footer={footer}
        caption={caption}
      />
    );
  },
});

function TableDemo({
  size,
  selectable,
  selectionBar,
  bordered,
  scroll,
  loading,
  footer,
  caption,
}: {
  size: (typeof SIZES)[number];
  selectable: boolean;
  selectionBar: boolean;
  bordered: boolean;
  scroll: boolean;
  loading: boolean;
  footer: boolean;
  caption: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(["4.1.3"]);
  const [sort, setSort] = useState<TableSort | null>(null);
  const releases = sorted(RELEASES, sort);
  const totals = RELEASES.filter((release) => selected.includes(release.id));
  // Spread rather than the readonly tuple: a union of two differently-shaped array types
  // loses `reduce`'s inference, and the accumulator comes back as a release.
  const counted = totals.length > 0 ? totals : [...RELEASES];
  const downloads = counted.reduce((sum, release) => sum + release.downloads, 0);

  return (
    // `self-start` keeps the table at the top of the preview box rather than floating in
    // the middle of it — a table is read from its header down, not from its centre out.
    <div className="w-full max-w-xl self-start">
      <Table
        size={size}
        selectable={selectable}
        bordered={bordered}
        loading={loading}
        selectionBar={selectionBar}
        selectionActions={
          <>
            {/* Real actions, both of them: the count on its own tells you nothing about
                whether the row is wired up. */}
            <CopyButton
              size="xs"
              variant="ghost"
              value={() => totals.map((release) => release.version).join("\n")}
            >
              Copy
            </CopyButton>
            <Button size="xs" variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
          </>
        }
        // The header pins to the scroll container, so it needs one with a height to pin to.
        wrapperClassName={scroll ? "max-h-64" : undefined}
        sort={sort}
        onSortChange={setSort}
        rows={RELEASES.map((release) => release.id)}
        value={selected}
        onValueChange={setSelected}
      >
        {caption && <TableCaption>Release history</TableCaption>}
        <TableHeader>
          <TableRow>
            <TableHead sortKey="version">Version</TableHead>
            <TableHead sortKey="channel">Channel</TableHead>
            {/* Numbers right-align so their digits stack; `tabular-nums` stops the column
                twitching as the figures change width. */}
            <TableHead sortKey="downloads" className="text-right">
              Downloads
            </TableHead>
            <TableHead sortKey="published" className="text-right">
              Published
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.map((release) => (
            <TableRow
              key={release.id}
              value={release.id}
              selectLabel={`Select ${release.version}`}
            >
              <TableCell className="font-medium">{release.version}</TableCell>
              <TableCell>
                <Badge
                  size="sm"
                  variant="outline"
                  status={release.channel === "stable" ? "neutral" : "warning"}
                >
                  {release.channel}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {NUMBER.format(release.downloads)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {release.published}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {footer && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>
                {totals.length > 0 ? `${totals.length} selected` : "All releases"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {NUMBER.format(downloads)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
