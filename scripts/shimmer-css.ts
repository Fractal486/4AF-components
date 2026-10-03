import postcss, { type AtRule } from "postcss";

/** shadcn puts registry keyframes in @theme, where Tailwind can discard this
 * non-utility animation. It also leaves older root declarations untouched. */
export function normalizeShimmerCss(
  css: string,
  frames: Record<string, Record<string, string>>,
): string {
  const root = postcss.parse(css);
  const matches: AtRule[] = [];
  root.walkAtRules("keyframes", (rule) => {
    if (rule.params === "text-shimmer") matches.push(rule);
  });
  root.walkDecls("--animate-text-shimmer", (declaration) => { declaration.remove(); });

  const animation = matches.find((rule) => rule.parent === root)
    ?? postcss.atRule({ name: "keyframes", params: "text-shimmer", nodes: [] });
  for (const rule of matches) {
    if (rule !== animation) rule.remove();
  }
  animation.removeAll();
  for (const [selector, declarations] of Object.entries(frames)) {
    const frame = postcss.rule({ selector });
    for (const [prop, value] of Object.entries(declarations)) {
      frame.append(postcss.decl({ prop, value }));
    }
    animation.append(frame);
  }
  if (!animation.parent) root.append(animation);
  return root.toString().trimEnd() + "\n";
}
