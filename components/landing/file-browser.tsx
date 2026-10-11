"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";

const SCROLLBAR = "code-scrollbar";

export interface BrowsedFile {
  path: string;
  lines: number;
  /** Server-highlighted source. */
  code: ReactNode;
}

/** Splits a project path into its directory and file name. */
function split(path: string) {
  const slash = path.lastIndexOf("/");
  return { dir: path.slice(0, slash), name: path.slice(slash + 1) };
}

/** A read-only file tree and source pane for the files an install writes. */
export function FileBrowser({ files }: { files: BrowsedFile[] }) {
  const [selected, setSelected] = useState(0);
  const file = files[selected];
  if (!file) return null;
  const dirs = [...new Set(files.map((f) => split(f.path).dir))];

  return (
    <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
      <nav
        aria-label="Installed files"
        className={cn(
          "flex gap-4 overflow-x-auto border-b bg-background py-3 pr-3 sm:flex-col sm:gap-5 sm:overflow-visible sm:border-r sm:border-b-0 sm:pt-2.5 sm:pb-4",
          SCROLLBAR,
        )}
      >
        {dirs.map((dir) => (
          <div key={dir} className="flex shrink-0 gap-1 sm:flex-col">
            <p className="hidden pb-1 font-mono text-2xs text-subtle-foreground sm:block">
              {dir}/
            </p>
            {files.map((f, index) =>
              split(f.path).dir === dir ? (
                <button
                  key={f.path}
                  type="button"
                  aria-pressed={index === selected}
                  aria-controls="installed-file"
                  onClick={() => setSelected(index)}
                  className="rounded-sm px-2 py-1 text-left font-sans text-xs whitespace-nowrap text-muted-foreground outline-none transition-[background-color,color] duration-(--duration-fast) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground"
                >
                  {split(f.path).name}
                </button>
              ) : null,
            )}
          </div>
        ))}
      </nav>
      <div id="installed-file" role="region" aria-label={file.path} className="min-w-0">
        <div
          // Focusable so keyboard users can scroll the source.
          tabIndex={0}
          className={cn(
            "relative h-[26rem] overflow-auto scroll-pt-14 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            SCROLLBAR,
          )}
        >
          <div className="sticky top-0 left-0 z-10 flex items-center justify-between gap-4 px-4 py-2.5 font-sans text-2xs text-muted-foreground">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-px -bottom-8 bg-background backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_40%,rgb(0_0_0/0.95)_50%,rgb(0_0_0/0.7)_65%,rgb(0_0_0/0.3)_82%,transparent)]"
            />
            <span className="relative min-w-0 truncate">{file.path}</span>
            <span className="relative shrink-0 text-[10px] tabular">{file.lines} lines</span>
          </div>
          {file.code}
        </div>
      </div>
    </div>
  );
}
