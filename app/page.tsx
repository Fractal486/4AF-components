import Link from "next/link";
import { groups } from "@/inspector";

export default function IndexPage() {
  return (
    <div className="flex flex-col gap-10 pt-8">
      <header className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-medium text-balance text-foreground">
          A component library, and an instrument for inspecting it.
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          Components pulled from the best public libraries, then rebuilt: accessible,
          composable, and animated on properties the compositor can actually handle.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <li key={group.slug}>
            <Link
              href={`/c/${group.slug}`}
              className="group flex h-full flex-col gap-1 rounded-xl bg-surface p-5 shadow-border transition-[background-color,box-shadow,scale] duration-(--duration-fast) ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99]"
            >
              <span className="text-sm font-medium text-foreground">{group.name}</span>
              <span className="text-sm text-pretty text-muted-foreground">
                {group.summary}
              </span>
              {group.entries.length > 1 && (
                <span className="mt-2 font-mono text-2xs tracking-widest text-subtle-foreground uppercase">
                  {group.entries.map((entry) => entry.name).join(" · ")}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
