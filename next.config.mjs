import { createNextStory } from "@fumadocs/story/next";
import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
};

const withMDX = createMDX();
const withStory = createNextStory();

export default withStory(withMDX(nextConfig));
