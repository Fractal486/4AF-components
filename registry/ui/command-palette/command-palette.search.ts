import { useContext, useEffect, useRef, useState } from "react";
import { PanelSearchContext } from "./command-palette.context";
import type { CommandItem, UseCommandSearchOptions } from "./command-palette.types";

export const CREATE_ID = "__command_create__";

/* -- Fuzzy matching ------------------------------------------------------------------ */

/**
 * A subsequence match with a relevance score, or `null` if `query`'s characters don't
 * appear in `text` in order. Whitespace in the query is ignored, so "go p" still finds
 * "**G**o to **P**rofile". Bonuses reward the matches that read as intentional — the
 * start of the string, the start of a word, and runs of consecutive characters — while
 * gaps are gently penalised. The returned positions drive the bolding.
 */
export function fuzzyMatch(text: string, query: string): { score: number; positions: number[] } | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, positions: [] };

  const t = text.toLowerCase();
  const positions: number[] = [];
  let from = 0;
  let prev = -2;
  let score = 0;

  for (const char of q) {
    const idx = t.indexOf(char, from);
    if (idx === -1) return null;

    let bonus = 1;
    if (idx === prev + 1) bonus += 4; // consecutive
    if (idx === 0) bonus += 5; // start of the string
    else if (/[\s\-_/.]/.test(t[idx - 1]!)) bonus += 3; // start of a word
    if (prev >= 0) bonus -= Math.min(idx - prev - 1, 3) * 0.5; // gap

    score += bonus;
    positions.push(idx);
    prev = idx;
    from = idx + 1;
  }

  // Prefer shorter labels and more complete matches when scores are otherwise close.
  score += (q.length / t.length) * 3;
  return { score, positions };
}

/** Best of the label and keywords. Label matches are biased up and keep their positions. */
export function scoreItem(item: CommandItem, query: string): { score: number; positions: number[] } | null {
  const labelMatch = fuzzyMatch(item.label, query);
  let best = labelMatch ? { score: labelMatch.score + 2, positions: labelMatch.positions } : null;

  if (query.trim()) {
    for (const keyword of item.keywords ?? []) {
      const km = fuzzyMatch(keyword, query);
      if (km && (!best || km.score > best.score)) {
        best = { score: km.score, positions: labelMatch?.positions ?? [] };
      }
    }
  }
  return best;
}

/**
 * The async-search engine behind the palette, exported so a custom panel gets the same
 * guarantees the root list does. Feed it the live query (a panel reads it from
 * `helpers.query`) and a source; it debounces, aborts the superseded request through its
 * `AbortSignal`, drops out-of-order responses, and reports `searching` *during render* —
 * derived from which query the current results answer — so no empty state flashes ahead of
 * the loading row.
 *
 * `results` is the last resolved value: it stays put while a refinement loads, so the list
 * doesn't blink to empty between keystrokes, and is `null` before the first result, while
 * the query is blank, or while `enabled` is false. The source ranks its own results —
 * render them in the order returned. Pair it with `CommandPanelLoading` for the row.
 */
export function useCommandSearch<T>(
  query: string,
  onSearch: ((query: string, signal: AbortSignal) => Promise<T>) | undefined,
  options: UseCommandSearchOptions = {},
): { results: T | null; searching: boolean; error: unknown | null } {
  const { additionalRefreshing = false, debounce = 200, enabled = true } = options;
  const [results, setResults] = useState<T | null>(null);
  const [resolvedTerm, setResolvedTerm] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  // The source lives behind a ref so an inline function (a fresh identity every render)
  // doesn't retrigger the effect and loop — it fires on the query, not the identity.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  // Monotonic id: only the newest request may commit, so a slow earlier response can't
  // overwrite a fast later one.
  const seqRef = useRef(0);
  const reportRefreshing = useContext(PanelSearchContext);
  const active = enabled && onSearch != null && query.trim() !== "";

  // Leaving search mode drops the stale results so the next entry starts clean — done on
  // the transition during render, not from the effect below. The effect owns a debounce
  // timer and an AbortController, which are genuinely external; this reset is not, and
  // from inside the effect it fired on every inactive render (a no-op each time, but a
  // cascading render by the letter of it).
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) {
      setResults(null);
      setResolvedTerm(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!active) return;
    const term = query.trim();
    const seq = ++seqRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError(null);
      Promise.resolve()
        .then(() => onSearchRef.current!(term, controller.signal))
        .then((result) => {
          if (seq !== seqRef.current) return;
          setResults(result);
          setResolvedTerm(term);
          setError(null);
        })
        .catch((reason: unknown) => {
          // An abort is the expected path when a newer keystroke supersedes this one — not
          // a failure, and the superseding run already owns the state.
          if (seq !== seqRef.current || controller.signal.aborted) return;
          setResults(null);
          setResolvedTerm(term);
          setError(reason || new Error("Search failed."));
        });
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, query, debounce]);

  // Derived, not stored: true from the keystroke until the results answer this exact
  // query, which is what keeps the loading indicator ahead of any empty state.
  const searching = active && resolvedTerm !== query.trim();

  // Tell a panel header when to show its inline loader — the refresh case only (a search
  // over results already on screen). First-load, when there's nothing yet, is left to the
  // centred `CommandPanelLoading`, so the two never overlap. A no-op at the root.
  const refreshing = additionalRefreshing || (searching && results != null);
  useEffect(() => {
    reportRefreshing?.(refreshing);
    return () => reportRefreshing?.(false);
  }, [reportRefreshing, refreshing]);

  return {
    results: active ? results : null,
    searching,
    error: active ? error : null,
  };
}
