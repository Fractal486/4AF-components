import Link from "next/link";
import { entries } from "@/inspector";

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
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/c/${entry.slug}`}
              className="group flex h-full flex-col gap-1 rounded-xl bg-surface p-5 shadow-border transition-[box-shadow,scale] duration-(--duration-fast) ease-out hover:shadow-border-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99]"
            >
              <span className="text-sm font-medium text-foreground">{entry.name}</span>
              <span className="text-sm text-pretty text-muted-foreground">
                {entry.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
