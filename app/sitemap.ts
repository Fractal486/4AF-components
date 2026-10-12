import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { source } from "@/lib/source";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // The docs index redirects home. Include documentation, not standalone demos or exports.
  return [
    { url: `${SITE_URL}/` },
    ...source.getPages()
      .filter((page) => page.slugs.length > 0)
      .map((page) => ({ url: `${SITE_URL}${page.url}` })),
  ];
}
