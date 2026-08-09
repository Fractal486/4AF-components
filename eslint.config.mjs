import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// `eslint-plugin-react-hooks` is a direct devDependency here purely to raise the version.
// Keeping it at the root ensures the Next preset resolves the same current hooks rules
// that consumers see when they install a component.

const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "_incoming/**", "next-env.d.ts"]),
  {
    // The firewall: the library must never reach into the site that displays it.
    // If registry/ can import from app/ or inspector/, it stops being portable and
    // the whole point of this repo is lost. Keep this rule.
    files: ["registry/**/*.{ts,tsx}"],
    rules: {
      // Registry components are framework-agnostic and intentionally test native anchors.
      "@next/next/no-html-link-for-pages": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/*",
                "@/components/*",
                "@/inspector/*",
                "@/lib/*",
                "@/stories/*",
                "**/app/**",
                "**/components/**",
                "**/content/**",
                "**/inspector/**",
                "**/stories/**",
              ],
              message:
                "registry/ is the portable library — it must not import from the documentation site. Move shared code into registry/lib/ instead.",
            },
            {
              group: ["next/*"],
              message:
                "registry/ components must be framework-agnostic React so they drop into any project. Take the Next-specific bit as a prop (e.g. render prop / asChild) instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default config;
