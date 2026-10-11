import Link from "next/link";
import { Button } from "@/registry/ui/button/button";

export const metadata = { title: "Not found — 4AF" };

export default function NotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle-foreground uppercase">404</p>
      <h1 className="text-lg font-medium text-foreground">Documentation not found</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        That route doesn&apos;t match a page in the component catalog.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-3">
        <Link href="/">Back to the library</Link>
      </Button>
    </div>
  );
}
