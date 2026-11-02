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
import { bool, defineEntry, multi, select } from "../schema";

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
const CHANNELS = new Set(RELEASES.map((release) => release.channel)).size;


export const tableEntry = defineEntry({
  slug: "table",
  name: "Table",
  controls: {
    size: select(SIZES, "sm"),
    wrap: bool(false, "Wrap text"),
    pinned: bool(false, "Pinned columns"),
    alignment: select(["start", "center", "end"], "end", "Number alignment"),
    lines: multi(["horizontal", "vertical", "outline"], ["horizontal"], "Lines"),
    scroll: bool(true, "Bounded height"),
    state: select(["default", "loading", "empty"], "default", "State"),
    footer: bool(false, "Footer"),
    caption: bool(true, "Caption"),
  },
  render({ size, wrap, pinned, alignment, lines, scroll, state, footer, caption }) {
    const loading = state === "loading";
    const empty = state === "empty";
    return (
      // `self-start` keeps the table at the top of the preview box rather than floating in
      // the middle of it — a table is read from its header down, not from its centre out.
      <div className="w-full max-w-xl self-start">
        <Table
          size={size}
          wrap={wrap}
          className={pinned ? "min-w-3xl" : undefined}
          outline={lines.includes("outline")}
          verticalLines={lines.includes("vertical")}
          horizontalLines={lines.includes("horizontal")}
          loading={loading}
          // The header pins to the scroll container, so it needs one with a height to pin to.
          wrapperClassName={scroll ? "max-h-64" : undefined}
        >
          {caption && <TableCaption>Release history</TableCaption>}
          <TableHeader>
            <TableRow>
              <TableHead pinned={pinned ? "start" : undefined}>Version</TableHead>
              <TableHead>Channel</TableHead>
              {/* Numbers right-align so their digits stack; `tabular-nums` stops the column
                  twitching as the figures change width. */}
              <TableHead>Notes</TableHead>
              <TableHead align={alignment}>Downloads</TableHead>
              <TableHead align="end" pinned={pinned ? "end" : undefined}>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(empty ? [] : RELEASES).map((release) => (
              <TableRow key={release.id}>
                <TableHead scope="row" pinned={pinned ? "start" : undefined}>{release.version}</TableHead>
                <TableCell>
                  <Badge
                    size="sm"
                    variant="outline"
                    status={release.channel === "stable" ? "neutral" : "warning"}
                  >
                    {release.channel}
                  </Badge>
                </TableCell>
                <TableCell>{release.channel === "stable" ? "Maintenance fixes and performance improvements" : "Early access for compatibility testing"}</TableCell>
                <TableCell align={alignment}>
                  {NUMBER.format(release.downloads)}
                </TableCell>
                <TableCell align="end" pinned={pinned ? "end" : undefined} className="text-muted-foreground">
                  {release.published}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {footer && (
            <TableFooter>
              <TableRow>
                <TableHead scope="row" pinned={pinned ? "start" : undefined}>{empty ? 0 : RELEASES.length} releases</TableHead>
                <TableCell>{empty ? 0 : CHANNELS} channels</TableCell>
                <TableCell>Total downloads</TableCell>
                <TableCell align={alignment}>{NUMBER.format(empty ? 0 : TOTAL)}</TableCell>
                <TableCell align="end" pinned={pinned ? "end" : undefined}>
                  {empty ? "—" : `Latest: ${RELEASES[0].published}`}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    );
  },
});
