import type { CSSProperties, ReactNode } from "react";

/**
 * A logo set into the hero title before its name, entering with the title's letters: the same
 * `blur-text-in` keyframes, held by the landing gate like them (`.landing-title`). Sized in `em`
 * so it scales with the title, and sat just under the cap height. Coloured by the caller.
 */
function TitleMark({ delay, className, children }: { delay: number; className: string; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} me-[0.2em] inline-block animate-blur-text-in align-[-0.06em] motion-reduce:animate-none [&_svg]:h-[0.82em] [&_svg]:w-auto`}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** React's atom: three orbits around a nucleus, in react.dev's light and dark brand colours. */
export function ReactMark({ delay }: { delay: number }) {
  return (
    <TitleMark delay={delay} className="text-[#087ea4] dark:text-[#61dafb]">
      <svg viewBox="-11.5 -10.23 23 20.46" fill="none" stroke="currentColor" strokeWidth={1.15}>
        <circle r="2.05" fill="currentColor" stroke="none" />
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </svg>
    </TitleMark>
  );
}

/**
 * Base UI's mark, from its documentation site. It has no brand colour, so it stays monochrome:
 * the title's ink, dimmed a little so it sits back from the words.
 */
export function BaseUIMark({ delay }: { delay: number }) {
  return (
    <TitleMark delay={delay} className="text-foreground/70">
      <svg viewBox="0 0 17 24" fill="currentColor">
        <path d="M9.5001 7.01537C9.2245 6.99837 9 7.22385 9 7.49999V23C13.4183 23 17 19.4183 17 15C17 10.7497 13.6854 7.27351 9.5001 7.01537Z" />
        <path d="M8 9.8V12V23C3.58172 23 0 19.0601 0 14.2V12V1C4.41828 1 8 4.93989 8 9.8Z" />
      </svg>
    </TitleMark>
  );
}
