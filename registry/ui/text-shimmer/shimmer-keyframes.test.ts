import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const registry = JSON.parse(readFileSync(`${process.cwd()}/registry.json`, "utf8"));
const theme = registry.items.find((item: { name: string }) => item.name === "4af-theme");

/**
 * There must be exactly one `@keyframes text-shimmer`, and it must move `translate`.
 *
 * This has regressed twice, both times the same way and both times silently. A second
 * `@keyframes` of the same name does not merge with the first — it *replaces* it, and the
 * loser is whichever comes earlier in the file. The duplicate that keeps coming back is a
 * leftover from the `background-position` gradient this effect used to be, and the effect
 * is now a masked `::after` overlay that translates. Animating `background-position` on it
 * is legal CSS that changes nothing, so the shimmer freezes with no error anywhere.
 *
 * A comment above the spot did not stop it happening again, which is why this is a test.
 */
/*
 * shadcn writes every registry `@keyframes` into the target's `@theme inline`, and Tailwind
 * drops a theme keyframe that no `animation` declaration names. The overlay's `animation`
 * below is what keeps `text-shimmer` alive in a plain `shadcn add` install, so the name in it
 * must stay the keyframes' name.
 */
describe("text shimmer keyframes", () => {
  it("ships the overlay and translating keyframes without recreating the old animation utility", () => {
    expect(theme.cssVars.theme).not.toHaveProperty("animate-text-shimmer");
    expect(theme.css["@keyframes text-shimmer"]).toEqual({
      from: { translate: "-100% 0" },
      to: { translate: "100% 0" },
    });
    expect(theme.css[".shimmer-text"]).toEqual({
      position: "relative", color: "var(--text-shimmer-base)",
    });
    const supported = theme.css["@supports (-webkit-mask-clip: text)"];
    expect(supported[".shimmer-text"]).toEqual({
      "-webkit-mask-image": "linear-gradient(white, white)", "-webkit-mask-clip": "text",
    });
    expect(supported[".shimmer-text.animate-text-shimmer::after"]).toMatchObject({
      content: '""',
      "pointer-events": "none",
      animation: "text-shimmer var(--text-shimmer-duration, 2.5s) linear infinite",
    });
    expect(supported["@media (prefers-reduced-motion: reduce)"]).toEqual({
      ".shimmer-text.animate-text-shimmer::after": { display: "none" },
    });
  });
  // Comments stripped first: the spot this keeps regressing at carries a warning that
  // names the at-rule, and counting that as a declaration made this test fail on itself.
  const css = readFileSync(`${process.cwd()}/app/globals.css`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  it("declares the animation exactly once", () => {
    const declarations = css.match(/@keyframes\s+text-shimmer\b/g) ?? [];
    expect(
      declarations.length,
      "a second @keyframes text-shimmer replaces the first rather than merging",
    ).toBe(1);
  });

  it("moves the property the overlay actually has", () => {
    const start = css.search(/@keyframes\s+text-shimmer\b/);
    expect(start).toBeGreaterThan(-1);
    // Brace-matched rather than sliced to the first "}": the keyframes hold nested
    // `from`/`to` blocks, so the first closing brace is only the end of `from`.
    const open = css.indexOf("{", start);
    let depth = 0;
    let index = open;
    while (index < css.length) {
      if (css[index] === "{") depth += 1;
      else if (css[index] === "}" && --depth === 0) break;
      index += 1;
    }
    const block = css.slice(open, index + 1);

    expect(block).toContain("translate:");
    // The tell of the old technique. The overlay has no background-position to move.
    expect(block).not.toContain("background-position");
  });

  it("keeps the animation off the theme block, where a utility would redeclare it", () => {
    // `--animate-text-shimmer` generated a Tailwind utility for the old approach. The
    // class is now only a selector on a hand-written rule, so the token is dead weight
    // that drags its keyframes back in with it.
    expect(css).not.toMatch(/^\s*--animate-text-shimmer:/m);
  });
});
