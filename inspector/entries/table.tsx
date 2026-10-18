"use client";

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
  { id: "4.1.1", version: "4.1.1", channel: "stable", downloads: 14_502, published: "21 Jan" },
  { id: "4.1.0", version: "4.1.0", channel: "stable", downloads: 31_044, published: "9 Jan" },
  { id: "4.1.0-beta.2", version: "4.1.0-beta.2", channel: "preview", downloads: 610, published: "2 Jan" },
  { id: "4.0.7", version: "4.0.7", channel: "stable", downloads: 22_118, published: "14 Dec" },
] as const;

const NUMBER = new Intl.NumberFormat("en-GB");

const TOTAL = RELEASES.reduce((sum, release) => sum + release.downloads, 0);


export const tableEntry = defineEntry({
  slug: "table",
  name: "Table",
  controls: {
    size: select(SIZES, "sm"),
    outline: bool(false, "Outline"),
    verticalLines: bool(false, "Vertical lines"),
    horizontalLines: bool(true, "Horizontal lines"),
    scroll: bool(true, "Bounded height"),
    loading: bool(false, "Loading"),
    footer: bool(false, "Footer"),
    caption: bool(true, "Caption"),
  },
  render({ size, outline, verticalLines, horizontalLines, scroll, loading, footer, caption }) {
    return (
      // `self-start` keeps the table at the top of the preview box rather than floating in
      // the middle of it — a table is read from its header down, not from its centre out.
      <div className="w-full max-w-xl self-start">
        <Table
          size={size}
          outline={outline}
          verticalLines={verticalLines}
          horizontalLines={horizontalLines}
          loading={loading}
          // The header pins to the scroll container, so it needs one with a height to pin to.
          wrapperClassName={scroll ? "max-h-64" : undefined}
        >
          {caption && <TableCaption>Release history</TableCaption>}
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
              <TableRow key={release.id}>
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
                <TableCell colSpan={2}>All releases</TableCell>
                <TableCell className="text-right tabular-nums">{NUMBER.format(TOTAL)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    );
  },
});
