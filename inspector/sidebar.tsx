import Link from "next/link";
import { groups } from "./index";

export function Sidebar() {
  return (
    <aside className="w-full shrink-0 px-6 pt-4 md:sticky md:top-0 md:w-48 md:self-start md:pt-8">
      <nav aria-label="Components">
        <ul className="flex flex-wrap gap-1 md:flex-col">
          {groups.flatMap((group) =>
            group.entries.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/c/${group.slug}?component=${entry.slug}`}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-[background-color,color] duration-(--duration-fast) ease-out hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {entry.name}
                </Link>
              </li>
            )),
          )}
        </ul>
      </nav>
    </aside>
  );
}
