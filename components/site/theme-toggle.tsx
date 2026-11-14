"use client";

import { useTheme } from "fumadocs-ui/provider/base";
import { Button } from "@/registry/ui/button/button";

/**
 * One button that flips between light and dark: a moon while light, a sun while dark. Both are
 * rendered and the theme class picks one, so the right icon shows before hydration.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      className="text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-3.5 dark:hidden">
        <path d="M7.6 1.3a.6.6 0 0 1 0 .7A5.5 5.5 0 0 0 14 9.7a.6.6 0 0 1 .8.7A7 7 0 1 1 6.9 1a.6.6 0 0 1 .7.3Z" />
      </svg>
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="hidden size-3.5 dark:block">
        <circle cx="8" cy="8" r="3.25" />
        <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeOpacity={0.4}>
          <path d="M8 .75v1.5M8 13.75v1.5M.75 8h1.5M13.75 8h1.5M2.9 2.9l1.05 1.05M12.05 12.05l1.05 1.05M2.9 13.1l1.05-1.05M12.05 3.95l1.05-1.05" />
        </g>
      </svg>
    </Button>
  );
}
