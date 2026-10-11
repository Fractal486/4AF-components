import { notFound } from "next/navigation";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

interface MarkdownRouteProps {
  params: Promise<{ slug?: string[] }>;
}

export const revalidate = false;
export const dynamic = "force-static";
export const dynamicParams = false;

export async function GET(_request: Request, { params }: MarkdownRouteProps) {
  const { slug = [] } = await params;
  if (!slug.at(-1)?.endsWith(".md")) notFound();
  const pageSlug = slug.length === 1 && slug[0] === "index.md"
    ? []
    : [...slug.slice(0, -1), slug.at(-1)!.slice(0, -3)];
  const page = source.getPage(pageSlug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  // Explicit extensions allow a page and its nested pages to coexist as static files.
  return source.generateParams().map(({ slug = [] }) => ({
    slug: slug.length === 0
      ? ["index.md"]
      : [...slug.slice(0, -1), `${slug.at(-1)}.md`],
  }));
}
