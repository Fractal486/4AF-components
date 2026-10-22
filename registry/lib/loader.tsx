"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import { cn } from "./cn";

const LoaderContext = createContext<ReactNode>(<ClassicLoader />);

/** Internal: measurement copies reserve space without mounting an animated indicator. */
export const LoaderSizerContext = createContext(false);

/** Supply any loader for a subtree, including its portals. Omitted values inherit. */
export function LoaderProvider({ loader, children }: { loader?: ReactNode; children?: ReactNode }) {
  const inherited = useContext(LoaderContext);
  return (
    <LoaderContext.Provider value={loader === undefined ? inherited : loader}>
      {children}
    </LoaderContext.Provider>
  );
}

/** Internal decorative slot. Busy announcements remain on the consuming component. */
export function LoadingIndicator({ loader, className }: { loader?: ReactNode; className?: string }) {
  const inherited = useContext(LoaderContext);
  const sizing = useContext(LoaderSizerContext);
  return (
    <span
      data-slot="loader"
      aria-hidden="true"
      className={cn("inline-flex size-[1em] shrink-0 items-center justify-center align-middle leading-none [&>*]:max-h-full [&>*]:max-w-full", className)}
    >
      {sizing ? null : loader === undefined ? inherited : loader}
    </span>
  );
}
