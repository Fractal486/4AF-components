import { renderToStaticMarkup } from "react-dom/server";
import { highlight } from "fumadocs-core/highlight";
import { describe, expect, it } from "vitest";
import { highlightSource } from "./highlight-source";

const code = `// Quotes, Unicode, and HTML must remain source text.
const label = '</code><img src=x onerror="alert(1)"> & café';
export const Demo = () => <button title={label}>Hello</button>;`;

function parse(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

// Compare the output users see, including token colours in both themes.
function tokens(container: HTMLElement) {
  return Array.from(container.querySelectorAll("span"), (span) => ({
    text: span.textContent,
    light: span.style.getPropertyValue("--shiki-light"),
    dark: span.style.getPropertyValue("--shiki-dark"),
  }));
}

describe("static source highlighting", () => {
  it("preserves source, tokens, themes, and keyboard scrolling without interpreting source HTML", async () => {
    const previous = parse(renderToStaticMarkup(await highlight(code, {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    })));
    const next = parse(await highlightSource(code, "tsx"));
    expect(next.querySelector("pre")?.textContent).toBe(code);
    expect(tokens(next)).toEqual(tokens(previous));
    expect(next.querySelector("img")).toBeNull();
    expect(next.querySelector("pre")).toHaveAttribute("tabindex", "0");
    expect(next.querySelector("pre")).toHaveClass("shiki", "min-w-max", "py-4", "font-mono", "text-xs", "leading-5");
    expect(next.querySelector("pre")?.style.cssText).toBe(previous.querySelector("pre")?.style.cssText);
  });
});
