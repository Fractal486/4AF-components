import { highlightHast } from "fumadocs-core/highlight";
import { toHtml } from "hast-util-to-html";

/**
 * Static source needs no React token tree in the RSC payload. Shiki escapes source
 * text; serialize that trusted HAST, never interpolate raw source into HTML.
 */
export async function highlightSource(code: string, lang: "ts" | "tsx") {
  const tree = await highlightHast(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
  const pre = tree.children.find((node) => node.type === "element" && node.tagName === "pre");
  if (pre?.type === "element") {
    pre.properties.class = `${pre.properties.class ?? ""} min-w-max py-4 font-mono text-xs leading-5`;
  }
  return toHtml(tree);
}
