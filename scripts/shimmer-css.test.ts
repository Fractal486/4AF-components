import postcss from "postcss";
import { normalizeShimmerCss } from "./shimmer-css";

const frames = { from: { translate: "-100% 0" }, to: { translate: "100% 0" } };

describe("installed shimmer CSS", () => {
  it("migrates duplicate legacy animations and survives repeated theme merges", () => {
    const css = `
/* @keyframes text-shimmer in a comment is not a declaration. */
@keyframes text-shimmer { from { translate: -100% 0; } to { translate: 100% 0; } }
@theme inline {
  --animate-text-shimmer: text-shimmer 2.5s linear infinite;
  --animate-icon-pop: icon-pop 1s;
  @keyframes text-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @keyframes icon-pop { to { scale: 1; } }
}
.custom { color: red; }
`;
    const migrated = normalizeShimmerCss(css, frames);
    const root = postcss.parse(migrated);
    const locations: string[] = [];
    root.walkAtRules("keyframes", (rule) => {
      if (rule.params === "text-shimmer") locations.push(rule.parent!.type);
    });
    expect(locations).toEqual(["root"]);
    expect(migrated).not.toContain("--animate-text-shimmer:");
    expect(migrated).not.toContain("background-position");
    expect(migrated).toContain("--animate-icon-pop: icon-pop 1s");
    expect(migrated).toContain("@keyframes icon-pop");
    expect(migrated).toContain(".custom { color: red; }");
    expect(normalizeShimmerCss(migrated, frames)).toBe(migrated);
  });

  it("moves a fresh installation's animation outside the theme", () => {
    const css = "@theme inline { @keyframes text-shimmer { to { translate: 100% 0; } } }";
    const root = postcss.parse(normalizeShimmerCss(css, frames));
    const animation = root.nodes.find((node) => node.type === "atrule" && node.name === "keyframes");
    expect(animation?.toString()).toContain("translate: -100% 0");
    expect(animation?.toString()).toContain("translate: 100% 0");
  });
});
