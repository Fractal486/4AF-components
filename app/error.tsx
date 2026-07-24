"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/registry/ui/button/button";

/**
 * The route-level boundary. It catches renders under the shell — which is every page —
 * but not the shell itself; a throw in `layout.tsx` needs `global-error.tsx`, and that
 * ships its own <html>, which isn't worth carrying for a two-route site.
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
      <h1 className="text-lg font-medium text-foreground">This component threw</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message || "Something failed while rendering the inspector."}
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-3">
        <RotateCw />
        Try again
      </Button>
      {error.digest && (
        <p className="font-mono text-xs text-subtle-foreground">digest {error.digest}</p>
      )}
    </div>
  );
}
