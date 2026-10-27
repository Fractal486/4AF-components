import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { bool, defineEntry, select } from "../schema";

const TAGS = Array.from({ length: 40 }, (_, index) => `v1.${40 - index}.0`);
const ALBUMS = Array.from({ length: 12 }, (_, index) => `Album ${index + 1}`);
const COLUMNS = ["Region", "Requests", "p50", "p95", "p99", "Errors", "Cache hit", "Egress", "Uptime"];
const REGIONS = Array.from({ length: 24 }, (_, index) => `region-${String(index + 1).padStart(2, "0")}`);

export const scrollAreaEntry = defineEntry({
  slug: "scroll-area",
  name: "Scroll Area",
  controls: {
    orientation: select(["vertical", "horizontal", "both"], "vertical", "Orientation"),
    scrollbar: select(["auto", "always"], "auto", "Scrollbar"),
    fade: bool(false, "Edge fade"),
  },
  render({ orientation, scrollbar, fade }) {
    if (orientation === "horizontal") {
      return (
        <ScrollArea
          orientation="horizontal"
          scrollbar={scrollbar}
          fade={fade}
          className="w-full rounded-xl shadow-border"
        >
          <div className="flex gap-3 p-4">
            {ALBUMS.map((album) => (
              <figure key={album} className="w-28 shrink-0">
                <div className="aspect-square rounded-lg bg-muted" />
                <figcaption className="mt-2 text-sm text-muted-foreground">{album}</figcaption>
              </figure>
            ))}
          </div>
        </ScrollArea>
      );
    }

    if (orientation === "both") {
      return (
        <ScrollArea
          orientation="both"
          scrollbar={scrollbar}
          fade={fade}
          className="h-72 w-full rounded-xl shadow-border"
        >
          <table className="text-sm">
            <tbody>
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column} className="px-4 py-2 text-left font-medium whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
              {REGIONS.map((region, row) => (
                <tr key={region} className="text-muted-foreground">
                  <td className="px-4 py-2 whitespace-nowrap text-foreground">{region}</td>
                  {COLUMNS.slice(1).map((column, cell) => (
                    <td key={column} className="px-4 py-2 tabular-nums">
                      {((row + 3) * (cell + 7)) % 97}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      );
    }

    return (
      <ScrollArea
        scrollbar={scrollbar}
        fade={fade}
        className="h-72 w-full rounded-xl shadow-border"
      >
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium">Tags</h4>
          {TAGS.map((tag) => (
            <div key={tag} className="py-1.5 text-sm">
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
});
