import { createMDX } from "fumadocs-mdx/next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
};

const withMDX = createMDX();

const configureNext = (phase) => withMDX({
  ...nextConfig,
  // Development serves these aliases through Next; the export creates real .md files.
  ...(phase === PHASE_DEVELOPMENT_SERVER
    ? {
        async rewrites() {
          return [
            { source: "/docs.md", destination: "/llms.mdx/docs/index.md" },
            { source: "/docs/:path*.md", destination: "/llms.mdx/docs/:path*.md" },
          ];
        },
      }
    : { output: "export" }),
});

export default configureNext;
