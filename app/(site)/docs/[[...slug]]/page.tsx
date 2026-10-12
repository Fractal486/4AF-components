import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import { getMDXComponents } from "@/components/mdx";
import { DownloadSkillButton } from "@/components/download-skill-button";
import { InlineLink } from "@/components/inline-link";
import { PageFrame } from "@/components/site/page-frame";
import { siblings, siteNav } from "@/lib/site-nav";
import { source } from "@/lib/source";
import { pageAlternates, SITE_URL } from "@/lib/site";
import { Button } from "@/registry/ui/button/button";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export const dynamicParams = false;

export default async function Page({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  // The overview lives at `/`; the docs index stays as content for the Markdown export.
  if (slug.length === 0) redirect("/");
  const page = source.getPage(slug);
  if (!page) notFound();

  const MdxContent = page.data.body;
  const group = siteNav().find((g) => g.items.some((item) => item.href === page.url));
  const { previous, next } = siblings(page.url);
  const toc = page.data.toc.map((entry) => ({
    id: entry.url.slice(1),
    title: entry.title,
    level: entry.depth,
  }));

  return (
    <PageFrame toc={toc}>
      <article>
        <header className="mb-8 flex flex-col gap-3">
          {group?.label ? (
            <p className="font-mono text-2xs tracking-[0.04em] text-subtle-foreground">{group.label}</p>
          ) : null}
          <h1 className="text-[length:clamp(1.75rem,3vw,2.25rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
            {page.data.title}
          </h1>
          {page.data.description ? (
            <p className="max-w-[60ch] text-[17px] leading-[1.6] tracking-[-0.01em] text-pretty text-muted-foreground">
              {page.data.description}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3">
              <CopyButton
                value={`${SITE_URL}${page.url}.md`}
                variant="outline"
                size="sm"
                iconPosition="start"
                swapLabel={false}
              >
                Copy Markdown link
              </CopyButton>
              <InlineLink
                href={`${page.url}.md`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Markdown in a new tab"
                className="text-xs"
              >
                View ↗
              </InlineLink>
            </div>
            {page.url === "/docs/sidebar-layout" ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href="/full/sidebar-layout"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Sidebar Layout fullscreen in a new tab"
                >
                  <Maximize2 aria-hidden />
                  Open in new tab
                </a>
              </Button>
            ) : null}
            {page.url === "/docs/reference/agent-skill" ? <DownloadSkillButton /> : null}
          </div>
        </header>

        <div className="prose max-w-none">
          <MdxContent components={getMDXComponents()} />
        </div>

        {previous || next ? (
          <nav aria-label="Pages" className="mt-16 grid grid-cols-2 gap-3 border-t pt-6">
            {previous ? (
              <Link
                href={previous.href}
                className="flex flex-col gap-1 rounded-lg p-3 outline-none transition-[background-color] duration-(--duration-fast) hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1 font-mono text-2xs text-subtle-foreground">
                  <ArrowLeft className="size-3" aria-hidden />
                  Previous
                </span>
                <span className="text-sm font-medium">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={next.href}
                className="flex flex-col items-end gap-1 rounded-lg p-3 text-right outline-none transition-[background-color] duration-(--duration-fast) hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1 font-mono text-2xs text-subtle-foreground">
                  Next
                  <ArrowRight className="size-3" aria-hidden />
                </span>
                <span className="text-sm font-medium">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>
    </PageFrame>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: `${page.data.title} — 4AF`,
    description: page.data.description,
    alternates: pageAlternates(slug.length === 0 ? "/" : page.url),
  };
}
