"use client";

import { useState } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import {
  Table,
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
] as const;

const NUMBER = new Intl.NumberFormat("en-GB");

export const tableEntry = defineEntry({
  slug: "table",
  name: "Table",
  controls: {
    size: select(SIZES, "md"),
    selectable: bool(true, "Checkbox column"),
    bordered: bool(false, "Grid lines"),
    caption: bool(false, "Caption"),
    footer: bool(false, "Footer"),
  },
  render({ size, selectable, bordered, caption, footer }) {
    return (
      <TableDemo
        size={size}
        selectable={selectable}
        bordered={bordered}
        caption={caption}
        footer={footer}
      />
    );
  },
});

function TableDemo({
  size,
  selectable,
  bordered,
  caption,
  footer,
}: {
  size: (typeof SIZES)[number];
  selectable: boolean;
  bordered: boolean;
  caption: boolean;
  footer: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(["4.1.3"]);
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
        rows={RELEASES.map((release) => release.id)}
        value={selected}
        onValueChange={setSelected}
      >
        {caption && (
          <TableCaption>
            {selected.length > 0
              ? `${selected.length} of ${RELEASES.length} releases selected.`
              : "Every published release of the package."}
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Channel</TableHead>
            {/* Numbers right-align so their digits stack; `tabular-nums` stops the column
                twitching as the figures change width. */}
            <TableHead className="text-right">Downloads</TableHead>
            <TableHead className="text-right">Published</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RELEASES.map((release) => (
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
