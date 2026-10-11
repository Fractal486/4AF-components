"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/registry/ui/button/button";

/**
 * The route-level boundary. It catches renders under the Fumadocs shell, but not the
 * root layout itself; a throw there would require a separate global error boundary.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The overlay swallows this in dev, and there's no reporter in prod — so log it, or a
  // component that throws only on the deployed site leaves nothing behind to read.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle-foreground uppercase">Error</p>
      <h1 className="text-lg font-medium text-foreground">Couldn&apos;t load this page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message || "Something went wrong. Try again."}
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-3">
        <RotateCw />
        Try again
      </Button>
      {error.digest && (
        <p className="font-mono text-xs text-subtle-foreground">Error ID {error.digest}</p>
      )}
    </div>
  );
}
